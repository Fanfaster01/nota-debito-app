-- Consolidar múltiples políticas SELECT en clientes para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Los usuarios pueden ver todos los clientes activos" ON public.clientes;
DROP POLICY IF EXISTS "Users can view clientes" ON public.clientes;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view clientes" ON public.clientes
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios autenticados pueden ver clientes activos
        is_active = true
        OR
        -- Usuario puede ver todos sus clientes (activos o inactivos)
        created_by = (SELECT auth.uid())
        OR
        -- Master puede ver todos los clientes
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
        OR
        -- Admin puede ver todos los clientes de usuarios de su compañía
        EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = clientes.created_by
            AND u1.role = 'admin'::user_role
            AND u1.company_id = u2.company_id
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view clientes" ON public.clientes IS 
'Política SELECT consolidada: Usuarios ven clientes activos, creadores ven todos sus clientes, admin ve clientes de su compañía, master ve todos. Elimina solapamiento de 2 políticas.';