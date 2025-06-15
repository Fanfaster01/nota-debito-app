-- Optimizar política "Masters can manage bancos_depositos" en bancos_depositos
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Masters can manage bancos_depositos" ON public.bancos_depositos;

-- Recrear la política con optimización completa
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

-- Verificar y optimizar otras políticas de bancos_depositos
-- Política SELECT para usuarios (los bancos son globales)
DROP POLICY IF EXISTS "Users can view bancos_depositos" ON public.bancos_depositos;
CREATE POLICY "Users can view bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios autenticados pueden ver bancos (son globales)
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'user'::user_role)
        )
    );

-- Política SELECT optimizada para masters
DROP POLICY IF EXISTS "Masters can view all bancos_depositos" ON public.bancos_depositos;
CREATE POLICY "Masters can view all bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Masters can manage bancos_depositos" ON public.bancos_depositos IS 
'Política ALL optimizada: Solo masters pueden gestionar bancos para depósitos. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view bancos_depositos" ON public.bancos_depositos IS 
'Política SELECT: Admin y usuarios normales pueden ver bancos (son globales).';

COMMENT ON POLICY "Masters can view all bancos_depositos" ON public.bancos_depositos IS 
'Política SELECT: Masters pueden ver todos los bancos.';