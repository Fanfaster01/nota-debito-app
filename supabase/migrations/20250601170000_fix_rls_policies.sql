-- Primero, eliminar las políticas problemáticas que referencian auth.users
DROP POLICY IF EXISTS "Users can insert creditos in their company" ON creditos_caja;
DROP POLICY IF EXISTS "Users can view creditos from their company" ON creditos_caja;

-- Crear nuevas políticas que no dependan de auth.users
-- Para creditos_caja
CREATE POLICY "Users can insert creditos in their company" ON creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view creditos from their company" ON creditos_caja
    FOR SELECT TO authenticated
    USING (company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

-- Verificar y corregir políticas similares en otras tablas
-- Pagos móvil
DROP POLICY IF EXISTS "Users can view pagos from their company" ON pagos_movil;
CREATE POLICY "Users can view pagos from their company" ON pagos_movil
    FOR SELECT TO authenticated
    USING (company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

-- Pagos Zelle
DROP POLICY IF EXISTS "Users can view pagos zelle from their company" ON pagos_zelle;
CREATE POLICY "Users can view pagos zelle from their company" ON pagos_zelle
    FOR SELECT TO authenticated
    USING (company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

-- Notas de crédito caja
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON notas_credito_caja;
CREATE POLICY "Users can view notas credito from their company" ON notas_credito_caja
    FOR SELECT TO authenticated
    USING (company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

-- Cajas
DROP POLICY IF EXISTS "Users can view cajas from their company" ON cajas;
CREATE POLICY "Users can view cajas from their company" ON cajas
    FOR SELECT TO authenticated
    USING (company_id = (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));