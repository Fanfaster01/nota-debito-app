-- Consolidar múltiples políticas SELECT en notas_debito para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Masters can view all notas_debito" ON public.notas_debito;
DROP POLICY IF EXISTS "Users can view notas_debito" ON public.notas_debito;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view notas_debito" ON public.notas_debito
    FOR SELECT TO authenticated
    USING (
        -- Usuario puede ver si es el creador
        created_by = (SELECT auth.uid())
        OR
        -- O si pertenece a la misma compañía
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Masters pueden ver todas las notas de débito
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view notas_debito" ON public.notas_debito IS 
'Política SELECT consolidada: Usuario ve sus notas o notas de su compañía, Masters ven todas. Elimina solapamiento de 2 políticas duplicadas.';