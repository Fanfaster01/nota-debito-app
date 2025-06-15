-- Consolidar múltiples políticas UPDATE en abonos_credito para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE duplicadas

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Users can update abonos_credito" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can update their own abonos" ON public.abonos_credito;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update abonos_credito" ON public.abonos_credito
    FOR UPDATE TO authenticated
    USING (
        user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        user_id = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update abonos_credito" ON public.abonos_credito IS 
'Política UPDATE consolidada: Usuario puede actualizar solo sus propios abonos. Elimina solapamiento de 2 políticas duplicadas.';