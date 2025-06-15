-- Corregir específicamente la política "Users can update own cajas"
-- Esta política tiene auth.uid() sin optimizar y lógica diferente

-- Eliminar la política específica de UPDATE que está causando el warning
DROP POLICY IF EXISTS "Users can update own cajas" ON public.cajas;

-- Recrear la política de UPDATE con optimización
CREATE POLICY "Users can update own cajas" ON public.cajas
    AS PERMISSIVE
    FOR UPDATE
    TO public
    USING (
        -- Optimizar auth.uid() con SELECT y mantener la lógica original
        (SELECT auth.uid()) = user_id 
        AND estado::text = 'abierta'::text
    );

-- Asegurar que no hay conflictos con la política general "Users can manage own cajas"
-- Si existe, eliminarla para evitar conflictos
DROP POLICY IF EXISTS "Users can manage own cajas" ON public.cajas;

-- Recrear políticas específicas por operación para mejor control
-- Política SELECT
DROP POLICY IF EXISTS "Users can view own cajas" ON public.cajas;
CREATE POLICY "Users can view own cajas" ON public.cajas
    FOR SELECT TO public
    USING (
        (SELECT auth.uid()) = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role]) 
            AND u.company_id = cajas.company_id
        )
    );

-- Política INSERT
DROP POLICY IF EXISTS "Users can insert own cajas" ON public.cajas;
CREATE POLICY "Users can insert own cajas" ON public.cajas
    FOR INSERT TO public
    WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.company_id = cajas.company_id
        )
    );

-- Política DELETE si es necesaria
DROP POLICY IF EXISTS "Users can delete own cajas" ON public.cajas;
CREATE POLICY "Users can delete own cajas" ON public.cajas
    FOR DELETE TO public
    USING (
        (SELECT auth.uid()) = user_id 
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = 'master'::user_role
        )
    );

-- Comentarios de documentación
COMMENT ON POLICY "Users can update own cajas" ON public.cajas IS 
'Política UPDATE optimizada: Solo permite actualizar cajas propias cuando están abiertas. Usa (SELECT auth.uid()).';

COMMENT ON POLICY "Users can view own cajas" ON public.cajas IS 
'Política SELECT optimizada: Permite ver cajas propias o cajas de la misma compañía si es admin/master.';

COMMENT ON POLICY "Users can insert own cajas" ON public.cajas IS 
'Política INSERT optimizada: Permite crear cajas propias en la misma compañía del usuario.';