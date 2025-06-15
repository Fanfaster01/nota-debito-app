-- Consolidar múltiples políticas SELECT en cajas para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Users can view cajas from their company" ON public.cajas;
DROP POLICY IF EXISTS "Users can view own cajas" ON public.cajas;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view cajas" ON public.cajas
    FOR SELECT TO authenticated
    USING (
        -- Caso 1: Usuario puede ver sus propias cajas
        user_id = (SELECT auth.uid())
        OR
        -- Caso 2: Usuario puede ver cajas de su compañía
        company_id = get_user_company_id((SELECT auth.uid()))
        OR
        -- Caso 3: Master puede ver todas las cajas
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND u.role = 'master'::user_role
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view cajas" ON public.cajas IS 
'Política SELECT consolidada: Usuario ve sus cajas y cajas de su compañía, Master ve todas. Elimina solapamiento de 2 políticas duplicadas.';