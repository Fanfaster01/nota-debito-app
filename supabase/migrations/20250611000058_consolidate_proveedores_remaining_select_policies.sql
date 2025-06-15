-- Consolidar múltiples políticas SELECT en proveedores para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT restantes

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Authenticated users can view proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can view proveedores" ON public.proveedores;

-- Crear una sola política SELECT consolidada
CREATE POLICY "Users can view proveedores" ON public.proveedores
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios autenticados pueden ver proveedores activos
        is_active = true
        OR
        -- El creador puede ver sus proveedores (activos o inactivos)
        created_by = (SELECT auth.uid())
        OR
        -- Admins/Masters pueden ver todos los proveedores
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view proveedores" ON public.proveedores IS 
'Política SELECT consolidada final: Usuarios ven proveedores activos, creadores ven todos sus proveedores, admin/master ven todos. Resuelve último solapamiento.';