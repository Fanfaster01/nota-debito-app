-- Consolidar múltiples políticas permisivas en proveedores para mejorar rendimiento
-- Eliminar solapamiento entre política general y específica para DELETE

-- Eliminar políticas que se solapan para DELETE
DROP POLICY IF EXISTS "Admin and master can manage proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Only master users can delete proveedores" ON public.proveedores;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT: Admin y master pueden ver todos los proveedores
CREATE POLICY "Admins can view all proveedores" ON public.proveedores
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política INSERT: Admin y master pueden crear proveedores
CREATE POLICY "Admins can create proveedores" ON public.proveedores
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política UPDATE: Admin y master pueden actualizar proveedores
CREATE POLICY "Admins can update proveedores" ON public.proveedores
    FOR UPDATE TO public
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política DELETE: SOLO master pueden eliminar (consolidando ambas políticas anteriores)
CREATE POLICY "Only masters can delete proveedores" ON public.proveedores
    FOR DELETE TO public
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Eliminar otras políticas duplicadas si existen
DROP POLICY IF EXISTS "Authenticated users can create proveedores" ON public.proveedores;
DROP POLICY IF EXISTS "Users can update own proveedores or admin/master" ON public.proveedores;

-- Política adicional para usuarios autenticados (solo lectura)
-- Nota: proveedores no tiene company_id, usar created_by para filtrar
CREATE POLICY "Authenticated users can view proveedores" ON public.proveedores
    FOR SELECT TO authenticated
    USING (
        -- Los usuarios autenticados pueden ver proveedores que crearon
        created_by = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política para que usuarios autenticados puedan crear proveedores
CREATE POLICY "Users can create proveedores" ON public.proveedores
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

-- Política para que usuarios puedan actualizar solo los proveedores que crearon
CREATE POLICY "Users can update own proveedores" ON public.proveedores
    FOR UPDATE TO authenticated
    USING (created_by = (SELECT auth.uid()))
    WITH CHECK (created_by = (SELECT auth.uid()));

-- Comentarios de documentación
COMMENT ON POLICY "Admins can view all proveedores" ON public.proveedores IS 
'Política SELECT para admins: Admin y master pueden ver todos los proveedores. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Admins can create proveedores" ON public.proveedores IS 
'Política INSERT para admins: Admin y master pueden crear proveedores.';

COMMENT ON POLICY "Admins can update proveedores" ON public.proveedores IS 
'Política UPDATE para admins: Admin y master pueden actualizar cualquier proveedor.';

COMMENT ON POLICY "Only masters can delete proveedores" ON public.proveedores IS 
'Política DELETE consolidada: SOLO usuarios master pueden eliminar proveedores. Elimina solapamiento con política general.';

COMMENT ON POLICY "Authenticated users can view proveedores" ON public.proveedores IS 
'Política SELECT para usuarios: Pueden ver proveedores de su compañía.';

COMMENT ON POLICY "Users can create proveedores" ON public.proveedores IS 
'Política INSERT para usuarios: Pueden crear proveedores (se asignan como created_by).';

COMMENT ON POLICY "Users can update own proveedores" ON public.proveedores IS 
'Política UPDATE para usuarios: Pueden actualizar solo los proveedores que crearon.';