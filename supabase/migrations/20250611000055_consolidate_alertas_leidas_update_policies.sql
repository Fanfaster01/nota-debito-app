-- Consolidar múltiples políticas UPDATE en alertas_leidas para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE duplicadas (una en inglés, otra en español)

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Users can update alertas_leidas" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus alertas" ON public.alertas_leidas;

-- Crear una sola política UPDATE consolidada
CREATE POLICY "Users can update alertas_leidas" ON public.alertas_leidas
    FOR UPDATE TO authenticated
    USING (
        user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        user_id = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update alertas_leidas" ON public.alertas_leidas IS 
'Política UPDATE consolidada: Usuario puede actualizar solo sus propias alertas leídas. Elimina solapamiento de 2 políticas duplicadas (inglés/español).';