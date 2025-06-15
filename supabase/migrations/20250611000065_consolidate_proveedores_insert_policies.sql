-- Consolidar múltiples políticas INSERT en proveedores para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas INSERT

-- Eliminar todas las políticas INSERT que se solapan
DROP POLICY IF EXISTS "Admins can create proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can create proveedores" ON public.proveedores;

-- Crear una sola política INSERT consolidada
CREATE POLICY "Users can insert proveedores" ON public.proveedores
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Todos los usuarios autenticados pueden crear proveedores
        -- Se asignan automáticamente como created_by
        created_by = (SELECT auth.uid())
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can insert proveedores" ON public.proveedores IS 
'Política INSERT consolidada: Todos los usuarios autenticados pueden crear proveedores (se asignan como created_by). Elimina solapamiento de 2 políticas.';