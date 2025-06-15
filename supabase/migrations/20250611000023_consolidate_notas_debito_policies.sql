-- Consolidar múltiples políticas DELETE en notas_debito para mejorar rendimiento
-- Eliminar solapamiento entre múltiples políticas que incluyen DELETE

-- Eliminar todas las políticas que se solapan para DELETE
DROP POLICY IF EXISTS "Admins can delete notas debito" ON public.notas_debito;
DROP POLICY IF EXISTS "Users can manage own notas debito" ON public.notas_debito;
DROP POLICY IF EXISTS "Company users can access notas_debito" ON public.notas_debito;

-- Eliminar otras políticas relacionadas para limpieza completa
DROP POLICY IF EXISTS "Company users can manage notas_debito" ON public.notas_debito;
DROP POLICY IF EXISTS "Users can view notas debito from their company" ON public.notas_debito;
DROP POLICY IF EXISTS "Users can create notas debito in their company" ON public.notas_debito;
DROP POLICY IF EXISTS "Users can update notas debito in their company" ON public.notas_debito;

-- Crear políticas específicas por operación para evitar solapamientos

-- Política SELECT específica
CREATE POLICY "Users can view notas_debito" ON public.notas_debito
    FOR SELECT TO authenticated
    USING (
        -- Usuario puede ver si es el creador O si pertenece a la misma compañía
        created_by = (SELECT auth.uid())
        OR company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política INSERT específica
CREATE POLICY "Users can insert notas_debito" ON public.notas_debito
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política UPDATE específica
CREATE POLICY "Users can update notas_debito" ON public.notas_debito
    FOR UPDATE TO authenticated
    USING (
        created_by = (SELECT auth.uid())
        OR company_id = get_user_company_id((SELECT auth.uid()))
    )
    WITH CHECK (
        created_by = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Política DELETE consolidada que reemplaza las 3 políticas anteriores
CREATE POLICY "Users can delete notas_debito" ON public.notas_debito
    FOR DELETE TO authenticated
    USING (
        -- Caso 1: Usuario puede eliminar sus propias notas
        created_by = (SELECT auth.uid())
        OR
        -- Caso 2: Admin/Master pueden eliminar notas de su compañía
        (
            company_id = get_user_company_id((SELECT auth.uid()))
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role IN ('admin'::user_role, 'master'::user_role)
            )
        )
    );

-- Política especial para masters (acceso global)
DROP POLICY IF EXISTS "Masters can view all notas_debito" ON public.notas_debito;
CREATE POLICY "Masters can view all notas_debito" ON public.notas_debito
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Política para acceso público (deshabilitada por seguridad)
DROP POLICY IF EXISTS "Public can view basic notas_debito" ON public.notas_debito;
CREATE POLICY "Public can view basic notas_debito" ON public.notas_debito
    FOR SELECT TO anon
    USING (false); -- Deshabilitado por defecto

-- Comentarios de documentación
COMMENT ON POLICY "Users can view notas_debito" ON public.notas_debito IS 
'Política SELECT: Usuario ve sus notas o notas de su compañía.';

COMMENT ON POLICY "Users can insert notas_debito" ON public.notas_debito IS 
'Política INSERT: Usuario puede crear notas en su compañía (se asigna como created_by).';

COMMENT ON POLICY "Users can update notas_debito" ON public.notas_debito IS 
'Política UPDATE: Usuario puede actualizar sus notas o notas de su compañía.';

COMMENT ON POLICY "Users can delete notas_debito" ON public.notas_debito IS 
'Política DELETE consolidada: Usuario puede eliminar sus notas, Admin/Master pueden eliminar notas de su compañía. Elimina solapamiento de 3 políticas.';

COMMENT ON POLICY "Masters can view all notas_debito" ON public.notas_debito IS 
'Política especial para masters: Pueden ver todas las notas de débito del sistema.';

COMMENT ON POLICY "Public can view basic notas_debito" ON public.notas_debito IS 
'Política para acceso anónimo: Deshabilitada por defecto por seguridad.';