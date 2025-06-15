-- Permitir que los usuarios creen su propio perfil en la tabla users
-- Esto es necesario para usuarios que se registran vía Supabase Auth

-- Agregar política INSERT para auto-creación de perfil
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Solo pueden crear un perfil para su propio ID
        id = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can create own profile" ON public.users IS 
'Política INSERT: Permite que usuarios autenticados creen su propio perfil en public.users cuando se registran vía Supabase Auth.';