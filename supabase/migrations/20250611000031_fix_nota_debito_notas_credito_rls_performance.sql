-- Optimizar política "Company users can manage nota_debito_notas_credito" en nota_debito_notas_credito
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Company users can manage nota_debito_notas_credito" ON public.nota_debito_notas_credito;

-- Recrear la política con optimización completa
CREATE POLICY "Company users can manage nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR ALL TO authenticated
    USING (
        -- Verificar que ambas notas (débito y crédito) pertenecen a la compañía del usuario
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc, public.users u
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND u.id = (SELECT auth.uid())
            AND nd.company_id = u.company_id
            AND nc.company_id = u.company_id
        )
    )
    WITH CHECK (
        -- También optimizar en WITH CHECK
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc, public.users u
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND u.id = (SELECT auth.uid())
            AND nd.company_id = u.company_id
            AND nc.company_id = u.company_id
        )
    );

-- Crear políticas específicas por operación para mejor control y rendimiento
-- Política SELECT
DROP POLICY IF EXISTS "Users can view nota_debito_notas_credito" ON public.nota_debito_notas_credito;
CREATE POLICY "Users can view nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND nd.company_id = get_user_company_id((SELECT auth.uid()))
            AND nc.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Política INSERT
DROP POLICY IF EXISTS "Users can insert nota_debito_notas_credito" ON public.nota_debito_notas_credito;
CREATE POLICY "Users can insert nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND nd.company_id = get_user_company_id((SELECT auth.uid()))
            AND nc.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Política UPDATE
DROP POLICY IF EXISTS "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito;
CREATE POLICY "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND nd.company_id = get_user_company_id((SELECT auth.uid()))
            AND nc.company_id = get_user_company_id((SELECT auth.uid()))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND nd.company_id = get_user_company_id((SELECT auth.uid()))
            AND nc.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Política DELETE
DROP POLICY IF EXISTS "Users can delete nota_debito_notas_credito" ON public.nota_debito_notas_credito;
CREATE POLICY "Users can delete nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc, public.users u
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
            AND nd.company_id = u.company_id
            AND nc.company_id = u.company_id
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Company users can manage nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política ALL optimizada: Usuarios pueden gestionar relaciones entre notas débito/crédito de su compañía. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política SELECT: Usuarios pueden ver relaciones entre notas de su compañía.';

COMMENT ON POLICY "Users can insert nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política INSERT: Usuarios pueden crear relaciones entre notas de su compañía.';

COMMENT ON POLICY "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política UPDATE: Usuarios pueden actualizar relaciones entre notas de su compañía.';

COMMENT ON POLICY "Users can delete nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política DELETE: Solo admin/master pueden eliminar relaciones entre notas de su compañía.';