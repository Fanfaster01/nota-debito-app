-- Optimizar política "Los usuarios pueden actualizar sus cierres de caja" en cierres_caja
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar la política que está causando el warning de performance
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus cierres de caja" ON public.cierres_caja;

-- Recrear la política con optimización completa
CREATE POLICY "Los usuarios pueden actualizar sus cierres de caja" ON public.cierres_caja
    FOR UPDATE TO authenticated
    USING (
        -- Optimizar con (SELECT auth.uid()) en lugar de auth.uid() directo
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        -- También optimizar en WITH CHECK
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    );

-- Verificar y optimizar otras políticas de cierres_caja si es necesario
-- Política SELECT
DROP POLICY IF EXISTS "Los usuarios pueden ver sus cierres de caja" ON public.cierres_caja;
CREATE POLICY "Los usuarios pueden ver sus cierres de caja" ON public.cierres_caja
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    );

-- Política INSERT
DROP POLICY IF EXISTS "Los usuarios pueden crear cierres de caja" ON public.cierres_caja;
CREATE POLICY "Los usuarios pueden crear cierres de caja" ON public.cierres_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
        )
    );

-- Política DELETE (solo para admins)
DROP POLICY IF EXISTS "Los administradores pueden eliminar cierres de caja" ON public.cierres_caja;
CREATE POLICY "Los administradores pueden eliminar cierres de caja" ON public.cierres_caja
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
        AND EXISTS (
            SELECT 1 FROM public.cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Los usuarios pueden actualizar sus cierres de caja" ON public.cierres_caja IS 
'Política UPDATE optimizada: Usuario puede actualizar cierres de sus cajas. Optimizada con (SELECT auth.uid()) para evitar re-evaluación.';

COMMENT ON POLICY "Los usuarios pueden ver sus cierres de caja" ON public.cierres_caja IS 
'Política SELECT optimizada: Usuario puede ver cierres de sus cajas.';

COMMENT ON POLICY "Los usuarios pueden crear cierres de caja" ON public.cierres_caja IS 
'Política INSERT optimizada: Usuario puede crear cierres en sus cajas.';

COMMENT ON POLICY "Los administradores pueden eliminar cierres de caja" ON public.cierres_caja IS 
'Política DELETE: Solo admin/master pueden eliminar cierres de caja de su compañía.';