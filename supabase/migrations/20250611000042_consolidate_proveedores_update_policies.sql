-- Consolidar múltiples políticas UPDATE en proveedores para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Admins can update proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can update own proveedores" ON public.proveedores;

-- Crear una sola política UPDATE consolidada que maneje todos los casos
CREATE POLICY "Users can update proveedores" ON public.proveedores
    FOR UPDATE TO authenticated
    USING (
        -- Caso 1: Usuario puede actualizar sus propios proveedores
        created_by = (SELECT auth.uid())
        OR
        -- Caso 2: Admin puede actualizar proveedores de usuarios de su compañía
        EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = proveedores.created_by
            AND u1.role = 'admin'::user_role
            AND u1.company_id = u2.company_id
        )
        OR
        -- Caso 3: Master puede actualizar cualquier proveedor
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        -- Validación para mantener integridad
        created_by = (SELECT auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = proveedores.created_by
            AND u1.role = 'admin'::user_role
            AND u1.company_id = u2.company_id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update proveedores" ON public.proveedores IS 
'Política UPDATE consolidada: Usuario actualiza sus proveedores, Admin proveedores de su compañía, Master cualquier proveedor. Elimina solapamiento de 2 políticas.';