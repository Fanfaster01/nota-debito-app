-- Corregir política de users para permitir acceso correcto durante el login
-- El problema es que la política actual puede fallar para usuarios nuevos

-- Eliminar la política actual
DROP POLICY IF EXISTS "Users can view users" ON public.users;

-- Crear una política SELECT más simple y directa
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

-- Comentario de documentación
COMMENT ON POLICY "Users can view users" ON public.users IS 
'Política SELECT mejorada: Usuario ve su perfil (acceso directo), Admin ve usuarios de su compañía, Master ve todos. Evita referencias circulares.';