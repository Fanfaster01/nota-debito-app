-- Consolidar múltiples políticas SELECT en bancos_depositos para mejorar rendimiento
-- Eliminar solapamiento entre 4 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Admins can view bancos_depositos" ON public.bancos_depositos;
DROP POLICY IF EXISTS "Masters can manage bancos_depositos" ON public.bancos_depositos;
DROP POLICY IF EXISTS "Masters can view all bancos_depositos" ON public.bancos_depositos;
DROP POLICY IF EXISTS "Users can view bancos_depositos" ON public.bancos_depositos;

-- Crear políticas separadas por operación

-- Política SELECT consolidada
CREATE POLICY "Users can view bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios autenticados pueden ver bancos (son globales)
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'user'::user_role, 'master'::user_role)
        )
    );

-- Política INSERT/UPDATE/DELETE solo para masters
CREATE POLICY "Masters can manage bancos_depositos" ON public.bancos_depositos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can view bancos_depositos" ON public.bancos_depositos IS 
'Política SELECT consolidada: Todos los usuarios autenticados pueden ver bancos (son globales). Elimina solapamiento de 4 políticas.';

COMMENT ON POLICY "Masters can manage bancos_depositos" ON public.bancos_depositos IS 
'Política ALL para masters: Solo masters pueden insertar, actualizar y eliminar bancos.';