-- Consolidar múltiples políticas UPDATE en cajas para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE duplicadas

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Users can update own cajas" ON public.cajas;
DROP POLICY IF EXISTS "Users can update their own cajas" ON public.cajas;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update cajas" ON public.cajas
    FOR UPDATE TO authenticated
    USING (
        user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        user_id = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update cajas" ON public.cajas IS 
'Política UPDATE consolidada: Usuario puede actualizar solo sus propias cajas. Elimina solapamiento de 2 políticas duplicadas con nombres similares.';