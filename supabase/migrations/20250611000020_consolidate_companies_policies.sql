-- Consolidar múltiples políticas SELECT en companies para mejorar rendimiento
-- Eliminar solapamiento entre política general (FOR ALL) y específica (FOR SELECT)

-- Eliminar políticas que se solapan para SELECT
DROP POLICY IF EXISTS "Master users can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view company data" ON public.companies;

-- Eliminar otras políticas relacionadas para limpieza completa
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Masters can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can create companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can update companies" ON public.companies;
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT consolidada que cubre todos los casos
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT TO public
    USING (
        -- Caso 1: Master puede ver todas las compañías
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        -- Caso 2: Usuario puede ver su propia compañía
        id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Caso 3: Admin puede ver todas las compañías
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'admin'::user_role
        )
    );

-- Política INSERT específica (solo masters)
CREATE POLICY "Masters can create companies" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política UPDATE específica (solo masters)
CREATE POLICY "Masters can update companies" ON public.companies
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política DELETE específica (solo masters)
CREATE POLICY "Masters can delete companies" ON public.companies
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política especial para acceso anónimo (si es necesario)
-- Solo para casos específicos donde se necesite acceso público limitado
DROP POLICY IF EXISTS "Public can view basic company info" ON public.companies;
CREATE POLICY "Public can view basic company info" ON public.companies
    FOR SELECT TO anon
    USING (false); -- Por defecto, no acceso anónimo

-- Comentarios de documentación
COMMENT ON POLICY "Users can view companies" ON public.companies IS 
'Política SELECT consolidada: Master ve todas, Admin ve todas, Usuario ve solo la suya. Elimina solapamiento de políticas.';

COMMENT ON POLICY "Masters can create companies" ON public.companies IS 
'Política INSERT específica: Solo masters pueden crear compañías.';

COMMENT ON POLICY "Masters can update companies" ON public.companies IS 
'Política UPDATE específica: Solo masters pueden actualizar compañías.';

COMMENT ON POLICY "Masters can delete companies" ON public.companies IS 
'Política DELETE específica: Solo masters pueden eliminar compañías.';

COMMENT ON POLICY "Public can view basic company info" ON public.companies IS 
'Política para acceso anónimo: Deshabilitada por defecto por seguridad.';