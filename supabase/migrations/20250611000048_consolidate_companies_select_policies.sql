-- Consolidar múltiples políticas SELECT en companies para mejorar rendimiento
-- Eliminar solapamiento entre políticas para rol anon

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Public can view basic company info" ON public.companies;
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;

-- Crear políticas separadas por rol para evitar solapamientos

-- Política para usuarios anónimos
CREATE POLICY "Public can view basic company info" ON public.companies
    FOR SELECT TO anon
    USING (
        -- Anónimos solo pueden ver compañías activas con información básica
        is_active = true
    );

-- Política para usuarios autenticados
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        -- Usuario puede ver su propia compañía
        id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Admin puede ver compañías activas
        (
            is_active = true
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
            )
        )
        OR
        -- Master puede ver todas las compañías
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Public can view basic company info" ON public.companies IS 
'Política SELECT para anónimos: Solo pueden ver compañías activas con información básica.';

COMMENT ON POLICY "Users can view companies" ON public.companies IS 
'Política SELECT para autenticados: Usuario ve su compañía, admin ve activas, master ve todas.';