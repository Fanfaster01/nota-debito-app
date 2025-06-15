-- Consolidar múltiples políticas INSERT en cierres_caja para mejorar rendimiento
-- Eliminar solapamiento entre 2 políticas INSERT

-- Eliminar todas las políticas INSERT que se solapan
DROP POLICY IF EXISTS "Los usuarios pueden crear cierres de caja" ON public.cierres_caja;
DROP POLICY IF EXISTS "Users can insert own cierres" ON public.cierres_caja;

-- Crear una sola política INSERT consolidada
CREATE POLICY "Users can insert cierres_caja" ON public.cierres_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = (SELECT auth.uid())
            AND c.estado = 'abierta'
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can insert cierres_caja" ON public.cierres_caja IS 
'Política INSERT consolidada: Usuario puede crear cierres solo en sus cajas abiertas. Elimina solapamiento de 2 políticas duplicadas.';