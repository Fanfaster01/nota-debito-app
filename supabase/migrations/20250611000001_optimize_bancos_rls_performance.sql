-- Optimizar política RLS de bancos para mejor rendimiento
-- Reemplazar auth.uid() con (select auth.uid()) para evitar re-evaluación por fila

-- Eliminar política existente
DROP POLICY IF EXISTS "Admin and master can manage bancos" ON public.bancos;

-- Crear política optimizada
CREATE POLICY "Admin and master can manage bancos" ON public.bancos
    AS PERMISSIVE
    FOR ALL 
    TO public
    USING (
        EXISTS (
            SELECT 1 
            FROM users 
            WHERE users.id = (SELECT auth.uid()) 
            AND users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])
        )
    );

-- Comentario para documentar la optimización
COMMENT ON POLICY "Admin and master can manage bancos" ON public.bancos IS 
'Política optimizada: usa (SELECT auth.uid()) en lugar de auth.uid() para evitar re-evaluación por fila';