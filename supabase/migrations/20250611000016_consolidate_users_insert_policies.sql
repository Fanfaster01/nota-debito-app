-- Consolidar múltiples políticas INSERT en users para mejorar rendimiento
-- Eliminar solapamiento entre políticas de admin y self-creation

-- Eliminar las dos políticas INSERT existentes que se solapan
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Crear una sola política INSERT consolidada que cubra ambos casos
CREATE POLICY "Users can be created" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Caso 1: Usuario creando su propio perfil (bootstrap inicial)
        (SELECT auth.uid()) = id
        OR 
        -- Caso 2: Admin/Master creando otros usuarios
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Verificar que no haya otras políticas INSERT duplicadas
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can create users" ON public.users;

-- Optimizar también otras políticas de users si tienen auth.uid() sin optimizar
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO public
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO public
    USING ((SELECT auth.uid()) = id);

-- Política adicional para que masters puedan ver todos los usuarios
DROP POLICY IF EXISTS "Masters can view all users" ON public.users;
CREATE POLICY "Masters can view all users" ON public.users
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = id
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política para que masters puedan actualizar cualquier usuario
DROP POLICY IF EXISTS "Masters can update all users" ON public.users;
CREATE POLICY "Masters can update all users" ON public.users
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

-- Política DELETE solo para masters
DROP POLICY IF EXISTS "Masters can delete users" ON public.users;
CREATE POLICY "Masters can delete users" ON public.users
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        -- Evitar que se elimine a sí mismo
        AND (SELECT auth.uid()) != id
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can be created" ON public.users IS 
'Política INSERT consolidada: Permite self-creation de perfil O creación por admin/master. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Política UPDATE básica: Usuario puede actualizar solo su propio perfil.';

COMMENT ON POLICY "Users can view own profile" ON public.users IS 
'Política SELECT básica: Usuario puede ver solo su propio perfil.';

COMMENT ON POLICY "Masters can view all users" ON public.users IS 
'Política SELECT para masters: Pueden ver todos los usuarios del sistema.';

COMMENT ON POLICY "Masters can update all users" ON public.users IS 
'Política UPDATE para masters: Pueden actualizar cualquier usuario.';

COMMENT ON POLICY "Masters can delete users" ON public.users IS 
'Política DELETE para masters: Pueden eliminar usuarios (excepto a sí mismos).';