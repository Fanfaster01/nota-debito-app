-- Consolidar múltiples políticas UPDATE en nota_debito_notas_credito para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Company users can manage nota_debito_notas_credito" ON public.nota_debito_notas_credito;
DROP POLICY IF EXISTS "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito
    FOR UPDATE TO authenticated
    USING (
        -- Verificar que ambas notas (débito y crédito) pertenecen a la compañía del usuario
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
        -- Validar en WITH CHECK también
        EXISTS (
            SELECT 1 
            FROM public.notas_debito nd, public.notas_credito nc
            WHERE nd.id = nota_debito_notas_credito.nota_debito_id
            AND nc.id = nota_debito_notas_credito.nota_credito_id
            AND nd.company_id = get_user_company_id((SELECT auth.uid()))
            AND nc.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update nota_debito_notas_credito" ON public.nota_debito_notas_credito IS 
'Política UPDATE consolidada: Usuarios pueden actualizar relaciones entre notas débito/crédito de su compañía. Elimina solapamiento de 2 políticas.';