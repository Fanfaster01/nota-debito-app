-- Resolver solapamiento final en bancos_depositos
-- La política "Masters can manage bancos_depositos" (FOR ALL) incluye SELECT y se solapa

-- Eliminar la política FOR ALL que causa solapamiento
DROP POLICY IF EXISTS "Masters can manage bancos_depositos" ON public.bancos_depositos;

-- Mantener solo la política SELECT consolidada
-- ("Users can view bancos_depositos" ya existe y maneja todos los roles)

-- Crear políticas específicas para INSERT, UPDATE, DELETE solo para masters

-- Política INSERT para masters
CREATE POLICY "Masters can insert bancos_depositos" ON public.bancos_depositos
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política UPDATE para masters
CREATE POLICY "Masters can update bancos_depositos" ON public.bancos_depositos
    FOR UPDATE TO authenticated
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

-- Política DELETE para masters
CREATE POLICY "Masters can delete bancos_depositos" ON public.bancos_depositos
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Masters can insert bancos_depositos" ON public.bancos_depositos IS 
'Política INSERT: Solo masters pueden crear bancos para depósitos.';

COMMENT ON POLICY "Masters can update bancos_depositos" ON public.bancos_depositos IS 
'Política UPDATE: Solo masters pueden actualizar bancos para depósitos.';

COMMENT ON POLICY "Masters can delete bancos_depositos" ON public.bancos_depositos IS 
'Política DELETE: Solo masters pueden eliminar bancos para depósitos.';