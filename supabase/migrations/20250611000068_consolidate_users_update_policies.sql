-- Consolidar múltiples políticas UPDATE en users para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Masters can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Crear una sola política UPDATE consolidada que maneje todos los casos
CREATE POLICY "Users can update users" ON public.users
    FOR UPDATE TO authenticated
    USING (
        -- Caso 1: Usuario puede actualizar su propio perfil
        id = (SELECT auth.uid())
        OR
        -- Caso 2: Admin puede actualizar usuarios de su compañía
        (
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
                AND u.company_id = users.company_id
            )
        )
        OR
        -- Caso 3: Master puede actualizar cualquier usuario
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        -- Validaciones para mantener integridad
        id = (SELECT auth.uid())
        OR
        (
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
                AND u.company_id = users.company_id
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update users" ON public.users IS 
'Política UPDATE consolidada: Usuario actualiza su perfil, Admin actualiza usuarios de su compañía, Master actualiza cualquier usuario. Elimina solapamiento de 2 políticas.';