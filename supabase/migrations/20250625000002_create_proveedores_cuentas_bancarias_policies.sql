-- Crear políticas RLS para la tabla proveedores_cuentas_bancarias
-- Seguir el mismo patrón que la tabla proveedores

-- Habilitar RLS en la tabla
ALTER TABLE public.proveedores_cuentas_bancarias ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Admin y master pueden ver todas las cuentas bancarias
CREATE POLICY "Admins can view all proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
    FOR SELECT TO public
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política INSERT: Admin y master pueden crear cuentas bancarias
CREATE POLICY "Admins can create proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
    FOR INSERT TO public
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política UPDATE: Admin y master pueden actualizar cuentas bancarias
CREATE POLICY "Admins can update proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
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

-- Política DELETE: SOLO master pueden eliminar cuentas bancarias
CREATE POLICY "Only masters can delete proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
    FOR DELETE TO public
    USING (
        EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Política adicional para usuarios autenticados (solo lectura de sus propias cuentas)
CREATE POLICY "Authenticated users can view own proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
    FOR SELECT TO authenticated
    USING (
        -- Los usuarios autenticados pueden ver cuentas de proveedores que crearon
        EXISTS (
            SELECT 1
            FROM public.proveedores p
            WHERE p.id = proveedor_id 
            AND p.created_by = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Política para que usuarios autenticados puedan crear cuentas bancarias para sus proveedores
CREATE POLICY "Users can create proveedores_cuentas_bancarias for own proveedores" ON public.proveedores_cuentas_bancarias
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.proveedores p
            WHERE p.id = proveedor_id 
            AND p.created_by = (SELECT auth.uid())
        )
    );

-- Política para que usuarios puedan actualizar solo cuentas bancarias de sus proveedores
CREATE POLICY "Users can update own proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.proveedores p
            WHERE p.id = proveedor_id 
            AND p.created_by = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.proveedores p
            WHERE p.id = proveedor_id 
            AND p.created_by = (SELECT auth.uid())
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Admins can view all proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política SELECT para admins: Admin y master pueden ver todas las cuentas bancarias de proveedores.';

COMMENT ON POLICY "Admins can create proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política INSERT para admins: Admin y master pueden crear cuentas bancarias para cualquier proveedor.';

COMMENT ON POLICY "Admins can update proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política UPDATE para admins: Admin y master pueden actualizar cualquier cuenta bancaria de proveedor.';

COMMENT ON POLICY "Only masters can delete proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política DELETE: SOLO usuarios master pueden eliminar cuentas bancarias de proveedores.';

COMMENT ON POLICY "Authenticated users can view own proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política SELECT para usuarios: Pueden ver cuentas bancarias de sus propios proveedores.';

COMMENT ON POLICY "Users can create proveedores_cuentas_bancarias for own proveedores" ON public.proveedores_cuentas_bancarias IS 
'Política INSERT para usuarios: Pueden crear cuentas bancarias para sus propios proveedores.';

COMMENT ON POLICY "Users can update own proveedores_cuentas_bancarias" ON public.proveedores_cuentas_bancarias IS 
'Política UPDATE para usuarios: Pueden actualizar cuentas bancarias solo de sus propios proveedores.';