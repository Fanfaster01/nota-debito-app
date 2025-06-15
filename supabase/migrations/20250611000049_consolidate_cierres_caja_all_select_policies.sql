-- Consolidar múltiples políticas SELECT en cierres_caja para mejorar rendimiento
-- Eliminar solapamiento entre 3 políticas SELECT

-- Eliminar todas las políticas SELECT que se solapan
DROP POLICY IF EXISTS "Los usuarios pueden ver los cierres de caja de su empresa" ON public.cierres_caja;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus cierres de caja" ON public.cierres_caja;
DROP POLICY IF EXISTS "Users can view own cierres" ON public.cierres_caja;

-- Crear una sola política SELECT consolidada que maneje todos los casos
CREATE POLICY "Users can view cierres_caja" ON public.cierres_caja
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM cajas c
            JOIN users u ON u.id = (SELECT auth.uid())
            WHERE c.id = cierres_caja.caja_id
            AND (
                -- Caso 1: Usuario puede ver cierres de sus propias cajas
                c.user_id = (SELECT auth.uid())
                OR
                -- Caso 2: Usuario puede ver cierres de cajas de su empresa
                c.company_id = u.company_id
            )
        )
    );

-- Comentario de documentación
COMMENT ON POLICY "Users can view cierres_caja" ON public.cierres_caja IS 
'Política SELECT consolidada: Usuario ve cierres de sus cajas y cierres de cajas de su empresa. Elimina solapamiento de 3 políticas duplicadas.';