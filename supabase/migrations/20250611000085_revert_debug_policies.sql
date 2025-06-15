-- Revertir políticas temporales de diagnóstico y aplicar políticas finales
-- Ahora que el problema de login se resolvió con la política de auto-creación

-- Revertir política temporal de users
DROP POLICY IF EXISTS "Debug users policy" ON public.users;

-- Aplicar política final de users (la que estaba en 20250611000081)
CREATE POLICY "Users can view users" ON public.users
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Usuario puede ver su propio perfil (acceso directo)
        id = (SELECT auth.uid())
        OR
        -- Caso 2: Admin puede ver usuarios de su compañía
        (
            (SELECT auth.uid()) IN (
                SELECT u.id FROM public.users u 
                WHERE u.role = 'admin'::user_role 
                AND u.company_id = users.company_id
            )
        )
        OR
        -- Caso 3: Master puede ver todos los usuarios
        (
            (SELECT auth.uid()) IN (
                SELECT u.id FROM public.users u 
                WHERE u.role = 'master'::user_role
            )
        )
    );

-- Revertir política temporal de companies
DROP POLICY IF EXISTS "Debug companies policy" ON public.companies;

-- Aplicar política final de companies (la que estaba en 20250611000082)
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Usuario puede ver su propia compañía (JOIN directo)
        id IN (
            SELECT u.company_id 
            FROM public.users u 
            WHERE u.id = (SELECT auth.uid())
            AND u.company_id IS NOT NULL
        )
        OR
        -- Caso 2: Admin puede ver compañías activas
        (
            is_active = true
            AND (SELECT auth.uid()) IN (
                SELECT u.id FROM public.users u 
                WHERE u.role = 'admin'::user_role
            )
        )
        OR
        -- Caso 3: Master puede ver todas las compañías
        (
            (SELECT auth.uid()) IN (
                SELECT u.id FROM public.users u 
                WHERE u.role = 'master'::user_role
            )
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can view users" ON public.users IS 
'Política SELECT final: Usuario ve su perfil, Admin ve usuarios de su compañía, Master ve todos.';

COMMENT ON POLICY "Users can view companies" ON public.companies IS 
'Política SELECT final: Usuario ve su compañía, Admin ve activas, Master ve todas.';