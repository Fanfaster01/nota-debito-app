-- Corregir política de companies para evitar problemas durante el login
-- Simplificar para evitar dependencias circulares con get_user_company_id()

-- Eliminar las políticas actuales
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Public can view basic company info" ON public.companies;

-- Crear política para usuarios anónimos
CREATE POLICY "Public can view basic company info" ON public.companies
    FOR SELECT TO anon
    USING (
        -- Anónimos solo pueden ver compañías activas
        is_active = true
    );

-- Crear política simplificada para usuarios autenticados
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
COMMENT ON POLICY "Public can view basic company info" ON public.companies IS 
'Política SELECT para anónimos: Solo pueden ver compañías activas.';

COMMENT ON POLICY "Users can view companies" ON public.companies IS 
'Política SELECT simplificada: Usuario ve su compañía, admin ve activas, master ve todas. Evita dependencias circulares.';