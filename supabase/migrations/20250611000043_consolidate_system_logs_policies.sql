-- Consolidar políticas conflictivas en system_logs
-- Hay un conflicto: "All users can insert logs" permite inserción pero "Anon cannot access logs" la bloquea

-- Eliminar todas las políticas existentes para empezar limpio
DROP POLICY IF EXISTS "All users can insert logs" ON public.system_logs;
DROP POLICY IF EXISTS "Anon cannot access logs" ON public.system_logs;
DROP POLICY IF EXISTS "System can insert logs" ON public.system_logs;

-- Crear políticas claras y no conflictivas

-- Política para usuarios anónimos: NO tienen acceso
CREATE POLICY "Anon cannot access logs" ON public.system_logs
    FOR ALL TO anon
    USING (false)
    WITH CHECK (false);

-- Política para usuarios autenticados: Solo masters pueden insertar
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

-- Comentarios de documentación
COMMENT ON POLICY "Anon cannot access logs" ON public.system_logs IS 
'Política para anónimos: Acceso completamente denegado a logs del sistema.';

COMMENT ON POLICY "System can insert logs" ON public.system_logs IS 
'Política INSERT: Solo masters o funciones del sistema pueden insertar logs.';