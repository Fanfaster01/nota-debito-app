-- Optimizar política "Los usuarios pueden actualizar sus cierres POS" en cierres_punto_venta
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus cierres POS" ON public.cierres_punto_venta;

-- Recrear la política con optimización completa usando la relación con cajas
CREATE POLICY "Los usuarios pueden actualizar sus cierres POS" ON public.cierres_punto_venta
    FOR UPDATE TO authenticated
    USING (
        -- Optimizar con (SELECT auth.uid()) en lugar de auth.uid() directo
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = (SELECT auth.uid())
            AND c.estado = 'abierta'
        )
    )
    WITH CHECK (
        -- También optimizar en WITH CHECK
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = (SELECT auth.uid())
            AND c.estado = 'abierta'
        )
    );

-- Verificar y optimizar otras políticas de cierres_punto_venta si es necesario
-- Política SELECT
DROP POLICY IF EXISTS "Los usuarios pueden ver los cierres POS de su empresa" ON public.cierres_punto_venta;
CREATE POLICY "Los usuarios pueden ver los cierres POS de su empresa" ON public.cierres_punto_venta
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cajas c
            JOIN users u ON u.id = (SELECT auth.uid())
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.company_id = u.company_id
        )
    );

-- Política INSERT
DROP POLICY IF EXISTS "Los usuarios pueden crear cierres POS" ON public.cierres_punto_venta;
CREATE POLICY "Los usuarios pueden crear cierres POS" ON public.cierres_punto_venta
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = (SELECT auth.uid())
            AND c.estado = 'abierta'
        )
    );

-- Política DELETE
DROP POLICY IF EXISTS "Los usuarios pueden eliminar sus cierres POS" ON public.cierres_punto_venta;
CREATE POLICY "Los usuarios pueden eliminar sus cierres POS" ON public.cierres_punto_venta
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = (SELECT auth.uid())
            AND c.estado = 'abierta'
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Los usuarios pueden actualizar sus cierres POS" ON public.cierres_punto_venta IS 
'Política UPDATE optimizada: Usuario puede actualizar cierres POS de sus cajas abiertas. Optimizada con (SELECT auth.uid()) para evitar re-evaluación.';

COMMENT ON POLICY "Los usuarios pueden ver los cierres POS de su empresa" ON public.cierres_punto_venta IS 
'Política SELECT optimizada: Usuario puede ver cierres POS de su empresa.';

COMMENT ON POLICY "Los usuarios pueden crear cierres POS" ON public.cierres_punto_venta IS 
'Política INSERT optimizada: Usuario puede crear cierres POS en sus cajas abiertas.';

COMMENT ON POLICY "Los usuarios pueden eliminar sus cierres POS" ON public.cierres_punto_venta IS 
'Política DELETE optimizada: Usuario puede eliminar cierres POS de sus cajas abiertas.';