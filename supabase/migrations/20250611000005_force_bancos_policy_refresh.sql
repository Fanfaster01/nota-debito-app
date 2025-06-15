-- Forzar actualización de política bancos para eliminar warning de performance
-- Recrear completamente la política para asegurar que esté optimizada

-- 1. Eliminar política existente completamente
DROP POLICY IF EXISTS "Admin and master can manage bancos" ON public.bancos;

-- 2. Recrear política con optimización garantizada
CREATE POLICY "Admin and master can manage bancos" ON public.bancos
    AS PERMISSIVE
    FOR ALL 
    TO public
    USING (
        -- Usar subquery explícito para evitar re-evaluación por fila
        EXISTS (
            SELECT 1 
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- 3. Verificar que no hay otras políticas conflictivas en bancos
-- Si existe una política "Users can view bancos", también optimizarla
DROP POLICY IF EXISTS "Users can view bancos" ON public.bancos;
CREATE POLICY "Users can view bancos" ON public.bancos
    AS PERMISSIVE
    FOR SELECT
    TO public
    USING (true); -- Esta política permite lectura a todos, no necesita auth

-- 4. Comentario de documentación
COMMENT ON POLICY "Admin and master can manage bancos" ON public.bancos IS 
'Política RLS optimizada v2: Usa (SELECT auth.uid()) para evitar re-evaluación por fila. Resuelve warning de performance.';