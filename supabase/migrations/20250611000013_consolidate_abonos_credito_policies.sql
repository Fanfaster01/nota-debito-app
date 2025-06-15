-- Consolidar múltiples políticas permisivas en abonos_credito para mejorar rendimiento
-- Eliminar duplicados y crear una sola política optimizada por operación

-- Eliminar todas las políticas INSERT existentes que están duplicadas
DROP POLICY IF EXISTS "Users can create abonos for their company" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can insert own abonos" ON public.abonos_credito;

-- Crear una sola política INSERT consolidada y optimizada
CREATE POLICY "Users can insert abonos_credito" ON public.abonos_credito
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Verificar que el user_id sea el usuario actual
        user_id = (SELECT auth.uid())
        AND 
        -- Verificar que el crédito pertenezca a la misma compañía del usuario
        EXISTS (
            SELECT 1 FROM public.creditos_caja c
            WHERE c.id = abonos_credito.credito_id
            AND c.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Eliminar políticas SELECT duplicadas si existen
DROP POLICY IF EXISTS "Users can view own abonos" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can view abonos from their company" ON public.abonos_credito;

-- Crear una sola política SELECT optimizada
CREATE POLICY "Users can view abonos_credito" ON public.abonos_credito
    FOR SELECT TO authenticated
    USING (
        -- Permitir ver abonos donde el usuario es el creador O del mismo crédito/compañía
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.creditos_caja c
            WHERE c.id = abonos_credito.credito_id
            AND c.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

-- Eliminar políticas UPDATE duplicadas si existen
DROP POLICY IF EXISTS "Users can update own abonos" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can update abonos from their company" ON public.abonos_credito;

-- Crear una sola política UPDATE optimizada
CREATE POLICY "Users can update abonos_credito" ON public.abonos_credito
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Eliminar políticas DELETE duplicadas si existen
DROP POLICY IF EXISTS "Users can delete own abonos" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can delete abonos from their company" ON public.abonos_credito;

-- Crear una sola política DELETE optimizada (solo el creador puede eliminar)
CREATE POLICY "Users can delete abonos_credito" ON public.abonos_credito
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Política especial para administradores (pueden ver todos los abonos de su compañía)
DROP POLICY IF EXISTS "Admins can manage all company abonos" ON public.abonos_credito;
CREATE POLICY "Admins can view all company abonos" ON public.abonos_credito
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
            AND EXISTS (
                SELECT 1 FROM public.creditos_caja c
                WHERE c.id = abonos_credito.credito_id
                AND c.company_id = u.company_id
            )
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can insert abonos_credito" ON public.abonos_credito IS 
'Política INSERT consolidada: Usuario puede crear abonos para créditos de su compañía. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view abonos_credito" ON public.abonos_credito IS 
'Política SELECT consolidada: Usuario puede ver sus abonos o abonos de créditos de su compañía.';

COMMENT ON POLICY "Users can update abonos_credito" ON public.abonos_credito IS 
'Política UPDATE consolidada: Solo el creador puede actualizar sus abonos.';

COMMENT ON POLICY "Users can delete abonos_credito" ON public.abonos_credito IS 
'Política DELETE consolidada: Solo el creador puede eliminar sus abonos.';

COMMENT ON POLICY "Admins can view all company abonos" ON public.abonos_credito IS 
'Política especial para admins: Pueden ver todos los abonos de créditos de su compañía.';