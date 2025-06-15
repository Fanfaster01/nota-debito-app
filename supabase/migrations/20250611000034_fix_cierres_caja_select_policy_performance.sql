-- Optimizar política "Los usuarios pueden ver los cierres de caja de su empresa" en cierres_caja
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Los usuarios pueden ver los cierres de caja de su empresa" ON public.cierres_caja;

-- Recrear la política con optimización completa
CREATE POLICY "Los usuarios pueden ver los cierres de caja de su empresa" ON public.cierres_caja
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cajas c
            JOIN users u ON u.id = (SELECT auth.uid())
            WHERE c.id = cierres_caja.caja_id
            AND c.company_id = u.company_id
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Los usuarios pueden ver los cierres de caja de su empresa" ON public.cierres_caja IS 
'Política SELECT optimizada: Usuarios pueden ver cierres de caja de su empresa. Optimizada con (SELECT auth.uid()) para evitar re-evaluación.';