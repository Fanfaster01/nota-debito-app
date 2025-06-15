-- Corregir política "Company users can manage notas_debito"
-- Esta política tiene auth.uid() sin optimizar en EXISTS subquery

-- Eliminar la política específica que está causando el warning
DROP POLICY IF EXISTS "Company users can manage notas_debito" ON public.notas_debito;

-- Recrear la política con optimización completa usando función helper
CREATE POLICY "Company users can manage notas_debito" ON public.notas_debito
    AS PERMISSIVE
    FOR ALL
    TO public
    USING (
        -- Usar función helper que es más eficiente que EXISTS subquery
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Crear políticas específicas por operación para mejor control
-- Política SELECT específica
DROP POLICY IF EXISTS "Users can view notas debito from their company" ON public.notas_debito;
CREATE POLICY "Users can view notas debito from their company" ON public.notas_debito
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Política INSERT específica
DROP POLICY IF EXISTS "Users can create notas debito in their company" ON public.notas_debito;
CREATE POLICY "Users can create notas debito in their company" ON public.notas_debito
    FOR INSERT TO authenticated
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política UPDATE específica
DROP POLICY IF EXISTS "Users can update notas debito in their company" ON public.notas_debito;
CREATE POLICY "Users can update notas debito in their company" ON public.notas_debito
    FOR UPDATE TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())))
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política DELETE específica (solo para admins/masters)
DROP POLICY IF EXISTS "Admins can delete notas debito" ON public.notas_debito;
CREATE POLICY "Admins can delete notas debito" ON public.notas_debito
    FOR DELETE TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política adicional para usuarios específicos (usar created_by en lugar de user_id)
DROP POLICY IF EXISTS "Users can manage own notas debito" ON public.notas_debito;
CREATE POLICY "Users can manage own notas debito" ON public.notas_debito
    FOR ALL TO authenticated
    USING (
        -- Permitir acceso si es el creador O si pertenece a la misma compañía
        created_by = (SELECT auth.uid())
        OR company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Remover la política general si existe para evitar conflictos
DROP POLICY IF EXISTS "Company users can manage notas_debito" ON public.notas_debito;

-- Mantener solo las políticas específicas más eficientes
-- Política principal simplificada
CREATE POLICY "Company users can access notas_debito" ON public.notas_debito
    AS PERMISSIVE
    FOR ALL
    TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Comentarios de documentación
COMMENT ON POLICY "Company users can access notas_debito" ON public.notas_debito IS 
'Política principal optimizada: Usuarios pueden gestionar notas de débito de su compañía. Usa get_user_company_id() para máxima eficiencia.';

COMMENT ON POLICY "Users can view notas debito from their company" ON public.notas_debito IS 
'Política SELECT optimizada: Permite ver notas de débito de la misma compañía.';

COMMENT ON POLICY "Users can create notas debito in their company" ON public.notas_debito IS 
'Política INSERT optimizada: Permite crear notas de débito en la compañía del usuario.';

COMMENT ON POLICY "Users can update notas debito in their company" ON public.notas_debito IS 
'Política UPDATE optimizada: Permite actualizar notas de débito de la misma compañía.';

COMMENT ON POLICY "Admins can delete notas debito" ON public.notas_debito IS 
'Política DELETE optimizada: Solo administradores pueden eliminar notas de débito.';