-- Consolidar múltiples políticas DELETE en notas_credito_caja para mejorar rendimiento
-- Eliminar duplicados con nombres similares en español

-- Eliminar todas las políticas DELETE existentes que están duplicadas
DROP POLICY IF EXISTS "Usuarios pueden eliminar notas de crédito propias" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus notas de crédito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can delete their own notas credito" ON public.notas_credito_caja;

-- Crear una sola política DELETE consolidada y optimizada
CREATE POLICY "Users can delete notas_credito_caja" ON public.notas_credito_caja
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Revisar y consolidar otras políticas de notas_credito_caja para consistencia
-- Eliminar políticas duplicadas en español e inglés

-- Políticas SELECT
DROP POLICY IF EXISTS "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Usuarios pueden ver sus notas de crédito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can view their own notas credito" ON public.notas_credito_caja;

-- Crear una sola política SELECT optimizada
CREATE POLICY "Users can view notas_credito_caja" ON public.notas_credito_caja
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Políticas INSERT
DROP POLICY IF EXISTS "Usuarios pueden crear notas de crédito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Usuarios pueden crear notas de crédito en su compañía" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can insert notas credito in their company" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can create notas credito" ON public.notas_credito_caja;

-- Crear una sola política INSERT optimizada
CREATE POLICY "Users can insert notas_credito_caja" ON public.notas_credito_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Políticas UPDATE
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus notas de crédito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Usuarios pueden actualizar notas de crédito propias" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can update their own notas credito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can update notas credito" ON public.notas_credito_caja;

-- Crear una sola política UPDATE optimizada
CREATE POLICY "Users can update notas_credito_caja" ON public.notas_credito_caja
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Política especial para administradores (pueden ver todas las notas de su compañía)
DROP POLICY IF EXISTS "Admins can view all company notas_credito_caja" ON public.notas_credito_caja;
CREATE POLICY "Admins can view all company notas_credito_caja" ON public.notas_credito_caja
    FOR SELECT TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Eliminar políticas obsoletas o mal nombradas
DROP POLICY IF EXISTS "Company users can manage notas_credito_caja" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can manage notas credito" ON public.notas_credito_caja;

-- Comentarios de documentación
COMMENT ON POLICY "Users can delete notas_credito_caja" ON public.notas_credito_caja IS 
'Política DELETE consolidada: Solo el creador puede eliminar sus notas de crédito. Optimizada con (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view notas_credito_caja" ON public.notas_credito_caja IS 
'Política SELECT consolidada: Usuarios pueden ver notas de crédito de su compañía.';

COMMENT ON POLICY "Users can insert notas_credito_caja" ON public.notas_credito_caja IS 
'Política INSERT consolidada: Usuarios pueden crear notas de crédito en su compañía.';

COMMENT ON POLICY "Users can update notas_credito_caja" ON public.notas_credito_caja IS 
'Política UPDATE consolidada: Solo el creador puede actualizar sus notas de crédito.';

COMMENT ON POLICY "Admins can view all company notas_credito_caja" ON public.notas_credito_caja IS 
'Política especial para admins: Pueden ver todas las notas de crédito de su compañía.';