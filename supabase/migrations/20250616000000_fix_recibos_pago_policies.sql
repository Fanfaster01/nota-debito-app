-- Fix RLS policies for recibos_pago table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Ver recibos de pago de la empresa" ON recibos_pago;
DROP POLICY IF EXISTS "Solo admin/master pueden crear recibos" ON recibos_pago;
DROP POLICY IF EXISTS "Solo admin/master pueden actualizar recibos" ON recibos_pago;

-- Create simpler, more permissive policies for testing
CREATE POLICY "Allow company users to view recibos" ON recibos_pago
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Allow company users to insert recibos" ON recibos_pago
    FOR INSERT WITH CHECK (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Allow company users to update recibos" ON recibos_pago
    FOR UPDATE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Allow company users to delete recibos" ON recibos_pago
    FOR DELETE USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    );

-- Ensure RLS is enabled
ALTER TABLE recibos_pago ENABLE ROW LEVEL SECURITY;