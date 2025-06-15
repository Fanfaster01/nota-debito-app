-- Consolidar múltiples políticas INSERT en cajas para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas INSERT duplicadas

-- Eliminar todas las políticas INSERT que se solapan
DROP POLICY IF EXISTS "Users can insert cajas" ON public.cajas;
DROP POLICY IF EXISTS "Users can insert own cajas" ON public.cajas;

-- Crear una sola política INSERT consolidada
CREATE POLICY "Users can insert cajas" ON public.cajas
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Usuario puede insertar cajas asignándose como user_id y en su compañía
        user_id = (SELECT auth.uid())
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can insert cajas" ON public.cajas IS 
'Política INSERT consolidada: Usuario puede crear cajas asignándose como user_id en su compañía. Elimina solapamiento de 2 políticas duplicadas.';