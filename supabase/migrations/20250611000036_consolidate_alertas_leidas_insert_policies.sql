-- Consolidar múltiples políticas INSERT en alertas_leidas para mejorar rendimiento
-- Eliminar solapamiento entre 3 políticas INSERT

-- Eliminar todas las políticas INSERT que se solapan
DROP POLICY IF EXISTS "Users can insert alertas_leidas" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Users can insert their own read alerts" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus alertas" ON public.alertas_leidas;

-- Crear una sola política INSERT consolidada
CREATE POLICY "Users can insert alertas_leidas" ON public.alertas_leidas
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Usuario solo puede insertar alertas marcadas como leídas para sí mismo
        user_id = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can insert alertas_leidas" ON public.alertas_leidas IS 
'Política INSERT consolidada: Usuario puede marcar alertas como leídas (insertar registro de lectura). Elimina solapamiento de 3 políticas duplicadas.';