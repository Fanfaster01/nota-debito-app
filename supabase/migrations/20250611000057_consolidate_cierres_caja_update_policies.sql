-- Consolidar múltiples políticas UPDATE en cierres_caja para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE duplicadas

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus cierres de caja" ON public.cierres_caja;
DROP POLICY IF EXISTS "Users can update own cierres" ON public.cierres_caja;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update cierres_caja" ON public.cierres_caja
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update cierres_caja" ON public.cierres_caja IS 
'Política UPDATE consolidada: Usuario puede actualizar cierres de sus cajas. Elimina solapamiento de 2 políticas duplicadas (español/inglés).';