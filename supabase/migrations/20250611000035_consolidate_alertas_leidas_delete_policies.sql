-- Consolidar múltiples políticas DELETE en alertas_leidas para mejorar rendimiento
-- Eliminar solapamiento entre 3 políticas DELETE

-- Eliminar todas las políticas DELETE que se solapan
DROP POLICY IF EXISTS "Users can delete alertas_leidas" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Users can delete their own read alerts" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus alertas" ON public.alertas_leidas;

-- Crear una sola política DELETE consolidada que cubra todos los casos
CREATE POLICY "Users can delete alertas_leidas" ON public.alertas_leidas
    FOR DELETE TO authenticated
    USING (
        -- Caso 1: Usuario puede eliminar sus propias alertas leídas
        user_id = (SELECT auth.uid())
        OR
        -- Caso 2: Master puede eliminar cualquier alerta leída
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can delete alertas_leidas" ON public.alertas_leidas IS 
'Política DELETE consolidada: Usuario elimina sus alertas leídas, Master puede eliminar cualquiera. Elimina solapamiento de 3 políticas duplicadas.';