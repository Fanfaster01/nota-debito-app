-- Corregir política "Master users can manage companies"
-- Esta política tiene auth.uid() sin optimizar en EXISTS subquery

-- Eliminar la política específica que está causando el warning
DROP POLICY IF EXISTS "Master users can manage companies" ON public.companies;

-- Recrear la política con optimización completa
CREATE POLICY "Master users can manage companies" ON public.companies
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (
        -- Optimizar auth.uid() con SELECT en EXISTS subquery
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- También optimizar otras políticas de companies que puedan existir
DROP POLICY IF EXISTS "Users can view company data" ON public.companies;
CREATE POLICY "Users can view company data" ON public.companies
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (
        -- Permitir que usuarios vean datos de su propia compañía
        id = get_user_company_id((SELECT auth.uid()))
        OR EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política específica para que usuarios vean su propia compañía
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id = get_user_company_id((SELECT auth.uid()))
    );

-- Política específica para masters (gestión completa)
DROP POLICY IF EXISTS "Masters can manage companies" ON public.companies;
CREATE POLICY "Masters can manage companies" ON public.companies
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política para admins (solo pueden ver, no modificar)
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
CREATE POLICY "Admins can view all companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política INSERT específica (solo masters)
DROP POLICY IF EXISTS "Masters can create companies" ON public.companies;
CREATE POLICY "Masters can create companies" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política UPDATE específica (solo masters)
DROP POLICY IF EXISTS "Masters can update companies" ON public.companies;
CREATE POLICY "Masters can update companies" ON public.companies
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política DELETE específica (solo masters)
DROP POLICY IF EXISTS "Masters can delete companies" ON public.companies;
CREATE POLICY "Masters can delete companies" ON public.companies
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Master users can manage companies" ON public.companies IS 
'Política general optimizada: Solo usuarios master pueden gestionar compañías. Usa (SELECT auth.uid()) para eficiencia.';

COMMENT ON POLICY "Users can view their company" ON public.companies IS 
'Política SELECT optimizada: Usuarios pueden ver información de su propia compañía.';

COMMENT ON POLICY "Masters can manage companies" ON public.companies IS 
'Política completa optimizada: Masters tienen acceso total a todas las compañías.';

COMMENT ON POLICY "Admins can view all companies" ON public.companies IS 
'Política SELECT optimizada: Admins y masters pueden ver todas las compañías.';