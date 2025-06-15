-- Resolver solapamiento final en system_settings
-- La política "Master users can manage settings" (FOR ALL) incluye SELECT y se solapa

-- Eliminar la política FOR ALL que causa solapamiento
DROP POLICY IF EXISTS "Master users can manage settings" ON public.system_settings;

-- Mantener/recrear solo la política SELECT consolidada
DROP POLICY IF EXISTS "Users can view system settings" ON public.system_settings;
CREATE POLICY "Users can view system settings" ON public.system_settings
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios autenticados pueden ver configuraciones
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
        )
    );

-- Crear políticas específicas para INSERT, UPDATE, DELETE solo para masters

-- Política INSERT para masters
CREATE POLICY "Masters can insert settings" ON public.system_settings
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política UPDATE para masters
CREATE POLICY "Masters can update settings" ON public.system_settings
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política DELETE para masters
CREATE POLICY "Masters can delete settings" ON public.system_settings
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can view system settings" ON public.system_settings IS 
'Política SELECT: Todos los usuarios autenticados pueden ver configuraciones del sistema.';

COMMENT ON POLICY "Masters can insert settings" ON public.system_settings IS 
'Política INSERT: Solo masters pueden crear configuraciones.';

COMMENT ON POLICY "Masters can update settings" ON public.system_settings IS 
'Política UPDATE: Solo masters pueden actualizar configuraciones.';

COMMENT ON POLICY "Masters can delete settings" ON public.system_settings IS 
'Política DELETE: Solo masters pueden eliminar configuraciones.';