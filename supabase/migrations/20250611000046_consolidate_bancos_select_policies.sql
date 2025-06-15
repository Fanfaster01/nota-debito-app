-- Consolidar múltiples políticas SELECT en bancos para mejorar rendimiento
-- Eliminar solapamiento entre políticas para el rol dashboard_user

-- Eliminar políticas que se solapan
DROP POLICY IF EXISTS "Admin and master can manage bancos" ON public.bancos;
DROP POLICY IF EXISTS "Users can view bancos" ON public.bancos;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT consolidada
CREATE POLICY "Users can view bancos" ON public.bancos
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios pueden ver bancos activos
        is_active = true
        OR
        -- Admin y Master pueden ver todos los bancos (activos e inactivos)
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política INSERT para admin/master
CREATE POLICY "Admin and master can insert bancos" ON public.bancos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política UPDATE para admin/master
CREATE POLICY "Admin and master can update bancos" ON public.bancos
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política DELETE para master solamente
CREATE POLICY "Master can delete bancos" ON public.bancos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can view bancos" ON public.bancos IS 
'Política SELECT consolidada: Todos ven bancos activos, admin/master ven todos. Elimina solapamiento para dashboard_user.';

COMMENT ON POLICY "Admin and master can insert bancos" ON public.bancos IS 
'Política INSERT: Solo admin y master pueden crear bancos.';

COMMENT ON POLICY "Admin and master can update bancos" ON public.bancos IS 
'Política UPDATE: Solo admin y master pueden actualizar bancos.';

COMMENT ON POLICY "Master can delete bancos" ON public.bancos IS 
'Política DELETE: Solo master puede eliminar bancos.';