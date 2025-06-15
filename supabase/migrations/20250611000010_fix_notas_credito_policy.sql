-- Corregir política "Company users can manage notas_credito"
-- Esta política tiene auth.uid() sin optimizar en EXISTS subquery

-- Eliminar la política específica que está causando el warning
DROP POLICY IF EXISTS "Company users can manage notas_credito" ON public.notas_credito;

-- Recrear la política con optimización completa
CREATE POLICY "Company users can manage notas_credito" ON public.notas_credito
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (
        -- Optimizar auth.uid() con SELECT en la subquery EXISTS
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.company_id = notas_credito.company_id
        )
    );

-- Alternativa más eficiente usando la función helper
DROP POLICY IF EXISTS "Company users can manage notas_credito" ON public.notas_credito;
CREATE POLICY "Company users can manage notas_credito" ON public.notas_credito
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (
        -- Usar función helper que es más eficiente
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Crear políticas específicas por operación para mejor control
-- Política SELECT específica
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito;
CREATE POLICY "Users can view notas credito from their company" ON public.notas_credito
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Política INSERT específica
DROP POLICY IF EXISTS "Users can create notas credito in their company" ON public.notas_credito;
CREATE POLICY "Users can create notas credito in their company" ON public.notas_credito
    FOR INSERT TO authenticated
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política UPDATE específica
DROP POLICY IF EXISTS "Users can update notas credito in their company" ON public.notas_credito;
CREATE POLICY "Users can update notas credito in their company" ON public.notas_credito
    FOR UPDATE TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())))
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política DELETE específica (solo para admins/masters)
DROP POLICY IF EXISTS "Admins can delete notas credito" ON public.notas_credito;
CREATE POLICY "Admins can delete notas credito" ON public.notas_credito
    FOR DELETE TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin', 'master')
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Company users can manage notas_credito" ON public.notas_credito IS 
'Política general optimizada: Permite a usuarios de la compañía gestionar notas de crédito. Usa get_user_company_id() para eficiencia.';

COMMENT ON POLICY "Users can view notas credito from their company" ON public.notas_credito IS 
'Política SELECT optimizada: Permite ver notas de crédito de la misma compañía.';

COMMENT ON POLICY "Users can create notas credito in their company" ON public.notas_credito IS 
'Política INSERT optimizada: Permite crear notas de crédito en la compañía del usuario.';

COMMENT ON POLICY "Users can update notas credito in their company" ON public.notas_credito IS 
'Política UPDATE optimizada: Permite actualizar notas de crédito de la misma compañía.';

COMMENT ON POLICY "Admins can delete notas credito" ON public.notas_credito IS 
'Política DELETE optimizada: Solo administradores pueden eliminar notas de crédito.';