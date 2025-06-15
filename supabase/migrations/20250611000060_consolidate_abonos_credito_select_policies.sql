-- Consolidar múltiples políticas SELECT en abonos_credito para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Admins can view all company abonos" ON public.abonos_credito;
DROP POLICY IF EXISTS "Users can view abonos_credito" ON public.abonos_credito;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view abonos_credito" ON public.abonos_credito
    FOR SELECT TO authenticated
    USING (
        -- Usuario puede ver abonos que creó o abonos de su compañía
        user_id = (SELECT auth.uid())
        OR
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Masters pueden ver todos los abonos
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view abonos_credito" ON public.abonos_credito IS 
'Política SELECT consolidada: Usuario ve sus abonos y abonos de su compañía (incluye admins), Masters ven todos. Elimina solapamiento de 2 políticas.';