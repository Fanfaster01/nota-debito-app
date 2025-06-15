-- Agregar política INSERT faltante para la tabla users
-- Permite a administradores y master users crear nuevos usuarios

-- Política para permitir que administradores creen usuarios
CREATE POLICY "Admins can create users" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

-- Política adicional para permitir que los usuarios creen su propio perfil inicial
-- (necesario para el primer usuario master que no tiene perfil aún)
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Comentarios explicativos
COMMENT ON POLICY "Admins can create users" ON public.users IS 
'Permite a usuarios con rol admin o master crear nuevos usuarios en el sistema';

COMMENT ON POLICY "Users can create own profile" ON public.users IS 
'Permite a usuarios autenticados crear su propio perfil inicial (necesario para bootstrap)';