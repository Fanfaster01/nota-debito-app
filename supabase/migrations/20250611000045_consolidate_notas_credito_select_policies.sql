-- Consolidar múltiples políticas SELECT en notas_credito para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Masters can view all notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can view notas_credito" ON public.notas_credito;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view notas_credito" ON public.notas_credito
    FOR SELECT TO authenticated
    USING (
        -- Usuarios pueden ver notas de crédito de su compañía
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Masters pueden ver todas las notas de crédito
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view notas_credito" ON public.notas_credito IS 
'Política SELECT consolidada: Usuarios ven notas de crédito de su compañía, Masters ven todas. Elimina solapamiento de 2 políticas duplicadas.';