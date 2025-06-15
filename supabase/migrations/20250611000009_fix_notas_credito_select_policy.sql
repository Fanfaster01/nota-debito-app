-- Corregir política "Usuarios pueden ver notas de crédito de su compañía"
-- Esta política tiene auth.uid() sin optimizar en la subquery

-- Eliminar la política específica que está causando el warning
DROP POLICY IF EXISTS "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja;

-- Recrear la política con optimización
CREATE POLICY "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        -- Optimizar auth.uid() con SELECT en la subquery
        company_id IN (
            SELECT u.company_id
            FROM public.users u
            WHERE u.id = (SELECT auth.uid())
        )
    );

-- Alternativa más eficiente usando la función helper get_user_company_id
-- que ya está optimizada
DROP POLICY IF EXISTS "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        -- Usar función helper que es más eficiente
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Verificar y optimizar otras políticas en español que puedan existir
DROP POLICY IF EXISTS "Usuarios pueden crear notas de crédito en su compañía" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden crear notas de crédito en su compañía" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Optimizar política de eliminación si existe
DROP POLICY IF EXISTS "Usuarios pueden eliminar notas de crédito propias" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden eliminar notas de crédito propias" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Asegurar que las políticas en inglés también estén optimizadas
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito_caja;
CREATE POLICY "Users can view notas credito from their company" ON public.notas_credito_caja
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert notas credito in their company" ON public.notas_credito_caja;
CREATE POLICY "Users can insert notas credito in their company" ON public.notas_credito_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Comentarios de documentación
COMMENT ON POLICY "Usuarios pueden ver notas de crédito de su compañía" ON public.notas_credito_caja IS 
'Política SELECT optimizada: Permite ver todas las notas de crédito de la compañía del usuario. Usa get_user_company_id() para eficiencia.';

COMMENT ON POLICY "Usuarios pueden crear notas de crédito en su compañía" ON public.notas_credito_caja IS 
'Política INSERT optimizada: Permite crear notas de crédito en la compañía del usuario.';