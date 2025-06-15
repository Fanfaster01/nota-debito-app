-- Consolidar múltiples políticas SELECT en proveedores para mejorar rendimiento
-- Eliminar solapamiento entre 3 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Admins can view all proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Authenticated users can view active proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can view proveedores" ON public.proveedores;

-- Crear una sola política SELECT consolidada que cubra todos los casos
CREATE POLICY "Users can view proveedores" ON public.proveedores
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Todos los usuarios autenticados pueden ver proveedores activos
        is_active = true
        OR
        -- Caso 2: El creador puede ver sus proveedores (activos o inactivos)
        created_by = (SELECT auth.uid())
        OR
        -- Caso 3: Admins/Masters pueden ver todos los proveedores de cualquier estado
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Verificar que no haya políticas SELECT adicionales
DROP POLICY IF EXISTS "Los usuarios pueden ver proveedores activos" ON public.proveedores;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden ver proveedores activos" ON public.proveedores;

-- Mantener las otras políticas específicas por operación si existen
-- (INSERT, UPDATE, DELETE ya fueron consolidadas en migraciones anteriores)

-- Política para acceso anónimo (deshabilitada por seguridad)
DROP POLICY IF EXISTS "Anon can view proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Public can view active proveedores" ON public.proveedores;
CREATE POLICY "Anon access disabled" ON public.proveedores
    FOR SELECT TO anon
    USING (false); -- Deshabilitado por defecto

-- Comentarios de documentación
COMMENT ON POLICY "Users can view proveedores" ON public.proveedores IS 
'Política SELECT consolidada: Usuarios ven proveedores activos, creadores ven todos sus proveedores, admin/master ven todos. Elimina solapamiento de 3 políticas.';

COMMENT ON POLICY "Anon access disabled" ON public.proveedores IS 
'Política para acceso anónimo: Deshabilitada por seguridad. Proveedores requieren autenticación.';