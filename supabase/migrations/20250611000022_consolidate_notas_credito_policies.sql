-- Consolidar múltiples políticas DELETE en notas_credito para mejorar rendimiento
-- Eliminar solapamiento entre política general (FOR ALL) y específica (FOR DELETE)

-- Eliminar políticas que se solapan para DELETE
DROP POLICY IF EXISTS "Company users can manage notas_credito" ON public.notas_credito;
DROP POLICY IF EXISTS "Admins can delete notas credito" ON public.notas_credito;

-- Eliminar otras políticas relacionadas para limpieza completa
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can create notas credito in their company" ON public.notas_credito;
DROP POLICY IF EXISTS "Users can update notas credito in their company" ON public.notas_credito;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT específica
CREATE POLICY "Users can view notas_credito" ON public.notas_credito
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Política INSERT específica
CREATE POLICY "Users can insert notas_credito" ON public.notas_credito
    FOR INSERT TO authenticated
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política UPDATE específica
CREATE POLICY "Users can update notas_credito" ON public.notas_credito
    FOR UPDATE TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())))
    WITH CHECK (company_id = get_user_company_id((SELECT auth.uid())));

-- Política DELETE consolidada que cubre ambos casos previos
CREATE POLICY "Users can delete notas_credito" ON public.notas_credito
    FOR DELETE TO authenticated
    USING (
        company_id = get_user_company_id((SELECT auth.uid()))
        AND EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role IN ('admin'::user_role, 'master'::user_role)
        )
    );

-- Política especial para masters (acceso global si es necesario)
DROP POLICY IF EXISTS "Masters can manage all notas_credito" ON public.notas_credito;
CREATE POLICY "Masters can view all notas_credito" ON public.notas_credito
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política para acceso público (deshabilitada por seguridad)
DROP POLICY IF EXISTS "Public can view basic notas_credito" ON public.notas_credito;
CREATE POLICY "Public can view basic notas_credito" ON public.notas_credito
    FOR SELECT TO anon
    USING (false); -- Deshabilitado por defecto

-- Comentarios de documentación
COMMENT ON POLICY "Users can view notas_credito" ON public.notas_credito IS 
'Política SELECT: Usuarios pueden ver notas de crédito de su compañía.';

COMMENT ON POLICY "Users can insert notas_credito" ON public.notas_credito IS 
'Política INSERT: Usuarios pueden crear notas de crédito en su compañía.';

COMMENT ON POLICY "Users can update notas_credito" ON public.notas_credito IS 
'Política UPDATE: Usuarios pueden actualizar notas de crédito de su compañía.';

COMMENT ON POLICY "Users can delete notas_credito" ON public.notas_credito IS 
'Política DELETE consolidada: Solo admin/master pueden eliminar notas de crédito de su compañía. Elimina solapamiento de políticas.';

COMMENT ON POLICY "Masters can view all notas_credito" ON public.notas_credito IS 
'Política especial para masters: Pueden ver todas las notas de crédito del sistema.';

COMMENT ON POLICY "Public can view basic notas_credito" ON public.notas_credito IS 
'Política para acceso anónimo: Deshabilitada por defecto por seguridad.';