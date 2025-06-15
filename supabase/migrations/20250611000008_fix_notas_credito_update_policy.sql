-- Corregir política "Usuarios pueden actualizar sus notas de crédito"
-- Esta política tiene múltiples auth.uid() sin optimizar

-- Eliminar la política específica que está causando el warning
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus notas de crédito" ON public.notas_credito_caja;

-- Recrear la política con optimización completa
CREATE POLICY "Usuarios pueden actualizar sus notas de crédito" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING (
        -- Optimizar todas las llamadas auth.uid() con SELECT
        user_id = (SELECT auth.uid()) 
        AND company_id IN (
            SELECT u.company_id
            FROM public.users u
            WHERE u.id = (SELECT auth.uid())
        )
    );

-- También verificar y optimizar otras políticas relacionadas de notas_credito_caja
-- que pueden tener el mismo problema

-- Política de creación
DROP POLICY IF EXISTS "Usuarios pueden crear notas de crédito" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden crear notas de crédito" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política de lectura (si existe)
DROP POLICY IF EXISTS "Usuarios pueden ver sus notas de crédito" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden ver sus notas de crédito" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política de eliminación (si existe)
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus notas de crédito" ON public.notas_credito_caja;
CREATE POLICY "Usuarios pueden eliminar sus notas de crédito" ON public.notas_credito_caja
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Verificar si hay políticas con nombres en inglés y optimizarlas también
DROP POLICY IF EXISTS "Users can update their own notas credito" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can insert notas credito in their company" ON public.notas_credito_caja;
DROP POLICY IF EXISTS "Users can delete their own notas credito" ON public.notas_credito_caja;

-- Comentarios de documentación
COMMENT ON POLICY "Usuarios pueden actualizar sus notas de crédito" ON public.notas_credito_caja IS 
'Política UPDATE optimizada: Permite actualizar notas de crédito propias en la misma compañía. Usa (SELECT auth.uid()).';

COMMENT ON POLICY "Usuarios pueden crear notas de crédito" ON public.notas_credito_caja IS 
'Política INSERT optimizada: Permite crear notas de crédito en la compañía del usuario.';

COMMENT ON POLICY "Usuarios pueden ver sus notas de crédito" ON public.notas_credito_caja IS 
'Política SELECT optimizada: Permite ver notas propias o de la misma compañía.';