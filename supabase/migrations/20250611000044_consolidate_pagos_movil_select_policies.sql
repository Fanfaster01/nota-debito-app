-- Consolidar múltiples políticas SELECT en pagos_movil para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Admins can view all company pagos_movil" ON public.pagos_movil;
DROP POLICY IF EXISTS "Users can view pagos_movil" ON public.pagos_movil;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view pagos_movil" ON public.pagos_movil
    FOR SELECT TO authenticated
    USING (
        -- Todos los usuarios pueden ver pagos móviles de su compañía
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Masters pueden ver todos los pagos móviles
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view pagos_movil" ON public.pagos_movil IS 
'Política SELECT consolidada: Usuarios (incluidos admins) ven pagos móviles de su compañía, Masters ven todos. Elimina solapamiento de 2 políticas.';