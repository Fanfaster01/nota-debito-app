-- Consolidar múltiples políticas UPDATE en depositos_bancarios para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas UPDATE

-- Eliminar todas las políticas UPDATE que se solapan
DROP POLICY IF EXISTS "Masters can update depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can update depositos_bancarios" ON public.depositos_bancarios;

-- Crear una sola política UPDATE consolidada que maneje todos los casos
CREATE POLICY "Users can update depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        -- Caso 1: Usuario puede actualizar sus propios depósitos
        user_id = (SELECT auth.uid())
        OR
        -- Caso 2: Admin puede actualizar depósitos de su compañía
        (
            company_id = get_user_company_id((SELECT auth.uid()))
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
            )
        )
        OR
        -- Caso 3: Master puede actualizar cualquier depósito
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    )
    WITH CHECK (
        -- Validar que los cambios mantengan la integridad
        (
            user_id = (SELECT auth.uid())
            AND company_id = get_user_company_id((SELECT auth.uid()))
        )
        OR
        (
            company_id = get_user_company_id((SELECT auth.uid()))
            AND EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = (SELECT auth.uid())
                AND u.role = 'admin'::user_role
            )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can update depositos_bancarios" ON public.depositos_bancarios IS 
'Política UPDATE consolidada: Usuario actualiza sus depósitos, Admin depósitos de su compañía, Master cualquier depósito. Elimina solapamiento de 2 políticas.';