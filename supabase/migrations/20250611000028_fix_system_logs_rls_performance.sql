-- Optimizar política "Master users can view logs" en system_logs
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Master users can view logs" ON public.system_logs;

-- Recrear la política con optimización completa
CREATE POLICY "Master users can view logs" ON public.system_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Verificar y optimizar otras políticas de system_logs si existen
-- Política INSERT (logs del sistema generalmente se crean por funciones/triggers)
DROP POLICY IF EXISTS "System can insert logs" ON public.system_logs;
CREATE POLICY "System can insert logs" ON public.system_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Solo permitir inserciones si el usuario es master o si es una función del sistema
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
        OR
        -- Permitir inserciones del sistema (cuando no hay usuario autenticado)
        (SELECT auth.uid()) IS NULL
    );

-- Política UPDATE (logs no deberían actualizarse)
DROP POLICY IF EXISTS "Logs are immutable" ON public.system_logs;
CREATE POLICY "Logs are immutable" ON public.system_logs
    FOR UPDATE TO authenticated
    USING (false) -- Nunca permitir actualizaciones
    WITH CHECK (false);

-- Política DELETE (solo masters pueden eliminar logs si es necesario)
DROP POLICY IF EXISTS "Masters can delete logs" ON public.system_logs;
CREATE POLICY "Masters can delete logs" ON public.system_logs
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política para acceso anónimo (deshabilitada)
DROP POLICY IF EXISTS "Anon cannot access logs" ON public.system_logs;
CREATE POLICY "Anon cannot access logs" ON public.system_logs
    FOR ALL TO anon
    USING (false);

-- Comentarios de documentación
COMMENT ON POLICY "Master users can view logs" ON public.system_logs IS 
'Política SELECT optimizada: Solo usuarios master pueden ver logs del sistema. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "System can insert logs" ON public.system_logs IS 
'Política INSERT: Masters o funciones del sistema pueden insertar logs.';

COMMENT ON POLICY "Logs are immutable" ON public.system_logs IS 
'Política UPDATE: Los logs son inmutables, no se pueden actualizar.';

COMMENT ON POLICY "Masters can delete logs" ON public.system_logs IS 
'Política DELETE: Solo masters pueden eliminar logs (uso excepcional).';

COMMENT ON POLICY "Anon cannot access logs" ON public.system_logs IS 
'Política para acceso anónimo: Completamente deshabilitada por seguridad.';