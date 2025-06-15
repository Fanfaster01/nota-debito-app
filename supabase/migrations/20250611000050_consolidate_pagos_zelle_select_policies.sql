-- Consolidar múltiples políticas SELECT en pagos_zelle para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Admins can view all company pagos_zelle" ON public.pagos_zelle;
DROP POLICY IF EXISTS "Users can view pagos_zelle" ON public.pagos_zelle;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view pagos_zelle" ON public.pagos_zelle
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios pueden ver pagos Zelle de su compañía
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Masters pueden ver todos los pagos Zelle
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view pagos_zelle" ON public.pagos_zelle IS 
'Política SELECT consolidada: Usuarios (incluidos admins) ven pagos Zelle de su compañía, Masters ven todos. Elimina solapamiento de 2 políticas.';