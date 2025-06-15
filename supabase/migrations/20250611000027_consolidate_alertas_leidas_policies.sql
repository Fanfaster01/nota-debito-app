-- Consolidar múltiples políticas SELECT en alertas_leidas para mejorar rendimiento
-- Eliminar solapamiento entre política de usuarios y masters

-- Eliminar políticas SELECT que se solapan
DROP POLICY IF EXISTS "Masters can view all read alerts" ON public.alertas_leidas;
DROP POLICY IF EXISTS "Users can view their own read alerts" ON public.alertas_leidas;

-- Crear una sola política SELECT consolidada que cubra ambos casos
CREATE POLICY "Users can view alertas_leidas" ON public.alertas_leidas
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Usuario puede ver sus propias alertas leídas
        user_id = (SELECT auth.uid())
        OR
        -- Caso 2: Master puede ver todas las alertas leídas
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Verificar y consolidar otras políticas si existen
-- Política INSERT
DROP POLICY IF EXISTS "Users can mark alerts as read" ON public.alertas_leidas;
CREATE POLICY "Users can insert alertas_leidas" ON public.alertas_leidas
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Política UPDATE (si existe)
DROP POLICY IF EXISTS "Users can update their read alerts" ON public.alertas_leidas;
CREATE POLICY "Users can update alertas_leidas" ON public.alertas_leidas
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Política DELETE
DROP POLICY IF EXISTS "Users can delete their read alerts" ON public.alertas_leidas;
CREATE POLICY "Users can delete alertas_leidas" ON public.alertas_leidas
    FOR DELETE TO authenticated
    USING (
        -- Usuario puede eliminar sus propias alertas o master puede eliminar cualquiera
        user_id = (SELECT auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política para acceso anónimo (si está configurada, la deshabilitamos)
DROP POLICY IF EXISTS "Anon users can view alerts" ON public.alertas_leidas;
CREATE POLICY "Anon access disabled" ON public.alertas_leidas
    FOR SELECT TO anon
    USING (false); -- Deshabilitado por seguridad

-- Comentarios de documentación
COMMENT ON POLICY "Users can view alertas_leidas" ON public.alertas_leidas IS 
'Política SELECT consolidada: Usuario ve sus alertas, Master ve todas. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can insert alertas_leidas" ON public.alertas_leidas IS 
'Política INSERT: Usuario puede marcar alertas como leídas (se asigna como user_id).';

COMMENT ON POLICY "Users can update alertas_leidas" ON public.alertas_leidas IS 
'Política UPDATE: Usuario puede actualizar sus propias alertas leídas.';

COMMENT ON POLICY "Users can delete alertas_leidas" ON public.alertas_leidas IS 
'Política DELETE consolidada: Usuario elimina sus alertas, Master puede eliminar cualquiera.';

COMMENT ON POLICY "Anon access disabled" ON public.alertas_leidas IS 
'Política para acceso anónimo: Deshabilitada por seguridad.';