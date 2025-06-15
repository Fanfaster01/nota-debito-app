-- Optimizar política RLS de cajas para mejor rendimiento
-- Reemplazar múltiples auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- Eliminar política existente
DROP POLICY IF EXISTS "Users can manage own cajas" ON public.cajas;

-- Crear política optimizada con subquery único
CREATE POLICY "Users can manage own cajas" ON public.cajas
    AS PERMISSIVE
    FOR ALL 
    TO public
    USING (
        -- Usar subquery para auth.uid() una sola vez
        (SELECT auth.uid()) = user_id 
        OR EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role]) 
            AND u.company_id = cajas.company_id
        )
    )
    WITH CHECK (
        -- Reutilizar la misma lógica optimizada para WITH CHECK
        (SELECT auth.uid()) = user_id 
        OR EXISTS (
            SELECT 1
            FROM public.users u
            WHERE u.id = (SELECT auth.uid()) 
            AND u.role = ANY (ARRAY['master'::user_role, 'admin'::user_role]) 
            AND u.company_id = cajas.company_id
        )
    );

-- También optimizar otras políticas de cajas si existen
DROP POLICY IF EXISTS "Users can view cajas from their company" ON public.cajas;
CREATE POLICY "Users can view cajas from their company" ON public.cajas
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert cajas" ON public.cajas;
CREATE POLICY "Users can insert cajas" ON public.cajas
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own cajas" ON public.cajas;
CREATE POLICY "Users can update their own cajas" ON public.cajas
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Comentario de documentación
COMMENT ON POLICY "Users can manage own cajas" ON public.cajas IS 
'Política RLS optimizada: Usa (SELECT auth.uid()) para evitar re-evaluación por fila. Permite acceso al propietario o admin/master de la misma compañía.';