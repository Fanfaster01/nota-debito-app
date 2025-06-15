-- Consolidar múltiples políticas SELECT en users para mejorar rendimiento
-- Eliminar solapamiento entre 3 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Masters can view all data" ON public.users;
DROP POLICY IF EXISTS "Masters can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view users" ON public.users
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Usuario puede ver su propio perfil
        id = (SELECT auth.uid())
        OR
        -- Caso 2: Admin puede ver usuarios de su compañía
        (
            EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
                AND u.company_id = users.company_id
            )
        )
        OR
        -- Caso 3: Master puede ver todos los usuarios
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view users" ON public.users IS 
'Política SELECT consolidada: Usuario ve su perfil, Admin ve usuarios de su compañía, Master ve todos. Elimina solapamiento de 3 políticas duplicadas.';