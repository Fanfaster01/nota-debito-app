-- Optimizar política "Users can update their own abonos" en abonos_credito
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Users can update their own abonos" ON public.abonos_credito;

-- Recrear la política con optimización completa
CREATE POLICY "Users can update their own abonos" ON public.abonos_credito
    FOR UPDATE TO authenticated
    USING (
        user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        user_id = (SELECT auth.uid())
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can update their own abonos" ON public.abonos_credito IS 
'Política UPDATE optimizada: Usuario puede actualizar sus propios abonos. Optimizada con (SELECT auth.uid()) para evitar re-evaluación.';