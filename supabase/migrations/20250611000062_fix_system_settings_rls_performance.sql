-- Optimizar política "Master users can manage settings" en system_settings
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Master users can manage settings" ON public.system_settings;

-- Recrear la política con optimización completa
CREATE POLICY "Master users can manage settings" ON public.system_settings
    FOR ALL TO authenticated
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

-- Crear políticas adicionales si es necesario para otros roles
-- Política SELECT para usuarios normales (solo lectura)
DROP POLICY IF EXISTS "Users can view system settings" ON public.system_settings;
CREATE POLICY "Users can view system settings" ON public.system_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'user'::user_role)
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Master users can manage settings" ON public.system_settings IS 
'Política ALL optimizada: Solo masters pueden gestionar configuraciones del sistema. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view system settings" ON public.system_settings IS 
'Política SELECT: Admin y usuarios pueden ver configuraciones del sistema (solo lectura).';