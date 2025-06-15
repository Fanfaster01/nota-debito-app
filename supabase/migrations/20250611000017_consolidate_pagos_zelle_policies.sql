-- Consolidar múltiples políticas DELETE en pagos_zelle para mejorar rendimiento
-- Eliminar duplicados con nombres similares

-- Eliminar todas las políticas DELETE existentes que están duplicadas
DROP POLICY IF EXISTS "Users can delete own pagos_zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can delete their own pagos zelle" ON public.pagos_zelle;

-- Crear una sola política DELETE consolidada y optimizada
CREATE POLICY "Users can delete pagos_zelle" ON public.pagos_zelle
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Revisar y consolidar otras políticas de pagos_zelle para consistencia
-- Eliminar políticas duplicadas si existen

-- Políticas SELECT
DROP POLICY IF EXISTS "Users can view pagos zelle from their company" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can view their own pagos zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can view own pagos_zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can view pagos_zelle" ON public.pagos_zelle;

-- Crear una sola política SELECT optimizada
CREATE POLICY "Users can view pagos_zelle" ON public.pagos_zelle
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Políticas INSERT
DROP POLICY IF EXISTS "Users can insert pagos zelle in their company" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can create pagos_zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can insert pagos_zelle" ON public.pagos_zelle;

-- Crear una sola política INSERT optimizada
CREATE POLICY "Users can insert pagos_zelle" ON public.pagos_zelle
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Políticas UPDATE
DROP POLICY IF EXISTS "Users can update their own pagos zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can update own pagos_zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can update pagos_zelle" ON public.pagos_zelle;

-- Crear una sola política UPDATE optimizada
CREATE POLICY "Users can update pagos_zelle" ON public.pagos_zelle
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Política especial para administradores (pueden ver todos los pagos de su compañía)
DROP POLICY IF EXISTS "Admins can view all company pagos_zelle" ON public.pagos_zelle;
CREATE POLICY "Admins can view all company pagos_zelle" ON public.pagos_zelle
    FOR SELECT TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Eliminar políticas obsoletas con nombres en inglés mezclado con español
DROP POLICY IF EXISTS "Users can create pagos_movil" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can view pagos from their company" ON public.pagos_zelle;

-- Comentarios de documentación
COMMENT ON POLICY "Users can delete pagos_zelle" ON public.pagos_zelle IS 
'Política DELETE consolidada: Solo el creador puede eliminar sus pagos Zelle. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view pagos_zelle" ON public.pagos_zelle IS 
'Política SELECT consolidada: Usuarios pueden ver pagos Zelle de su compañía.';

COMMENT ON POLICY "Users can insert pagos_zelle" ON public.pagos_zelle IS 
'Política INSERT consolidada: Usuarios pueden crear pagos Zelle en su compañía.';

COMMENT ON POLICY "Users can update pagos_zelle" ON public.pagos_zelle IS 
'Política UPDATE consolidada: Solo el creador puede actualizar sus pagos Zelle.';

COMMENT ON POLICY "Admins can view all company pagos_zelle" ON public.pagos_zelle IS 
'Política especial para admins: Pueden ver todos los pagos Zelle de su compañía.';