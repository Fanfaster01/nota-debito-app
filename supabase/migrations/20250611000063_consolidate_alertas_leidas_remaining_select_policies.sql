-- Consolidar múltiples políticas SELECT restantes en alertas_leidas para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT duplicadas (inglés/español)

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Users can view alertas_leidas" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Usuarios pueden leer sus alertas" ON public.alertas_leidas;

-- Crear una sola política SELECT consolidada
CREATE POLICY "Users can view alertas_leidas" ON public.alertas_leidas
    FOR SELECT TO authenticated
    USING (
        -- Usuario puede ver sus propias alertas leídas
        user_id = (SELECT auth.uid())
        OR
        -- Master puede ver todas las alertas leídas
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view alertas_leidas" ON public.alertas_leidas IS 
'Política SELECT consolidada final: Usuario ve sus alertas leídas, Master ve todas. Elimina último solapamiento de políticas duplicadas (inglés/español).';