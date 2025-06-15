-- Consolidar múltiples políticas SELECT en facturas para mejorar rendimiento
-- Eliminar solapamiento entre política general FOR ALL y política específica SELECT

-- Eliminar políticas que se solapan
DROP POLICY IF EXISTS "Company users can manage facturas" ON public.facturas;
DROP POLICY IF EXISTS "Users can view facturas from their company" ON public.facturas;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT consolidada
CREATE POLICY "Users can view facturas" ON public.facturas
    FOR SELECT TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política INSERT
CREATE POLICY "Users can insert facturas" ON public.facturas
    FOR INSERT TO authenticated
    WITH CHECK (
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política UPDATE
CREATE POLICY "Users can update facturas" ON public.facturas
    FOR UPDATE TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
    )
    WITH CHECK (
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política DELETE (solo admin/master)
CREATE POLICY "Admins can delete facturas" ON public.facturas
    FOR DELETE TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can view facturas" ON public.facturas IS 
'Política SELECT: Usuarios pueden ver facturas de su compañía.';

COMMENT ON POLICY "Users can insert facturas" ON public.facturas IS 
'Política INSERT: Usuarios pueden crear facturas en su compañía.';

COMMENT ON POLICY "Users can update facturas" ON public.facturas IS 
'Política UPDATE: Usuarios pueden actualizar facturas de su compañía.';

COMMENT ON POLICY "Admins can delete facturas" ON public.facturas IS 
'Política DELETE: Solo admin/master pueden eliminar facturas de su compañía.';