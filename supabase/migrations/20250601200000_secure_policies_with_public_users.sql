-- Estrategia: Mantener la seguridad usando auth.users pero crear una función helper
-- que permita acceder a la información necesaria sin exponer la tabla completa

-- Crear función para verificar la compañía del usuario
CREATE OR REPLACE FUNCTION get_user_company_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM users WHERE id = user_id;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_user_company_id(uuid) TO authenticated;

-- Ahora actualizar las políticas para usar esta función en lugar de hacer joins directos

-- Para creditos_caja
DROP POLICY IF EXISTS "Users can insert creditos" ON creditos_caja;
DROP POLICY IF EXISTS "Users can view creditos" ON creditos_caja;
DROP POLICY IF EXISTS "Users can update creditos" ON creditos_caja;
DROP POLICY IF EXISTS "Users can delete creditos" ON creditos_caja;

CREATE POLICY "Users can insert creditos" ON creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND company_id = get_user_company_id(auth.uid())
    );

CREATE POLICY "Users can view creditos" ON creditos_caja
    FOR SELECT TO authenticated
    USING (
        company_id = get_user_company_id(auth.uid())
    );

CREATE POLICY "Users can update creditos" ON creditos_caja
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete creditos" ON creditos_caja
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Aplicar el mismo patrón a otras tablas
-- Cajas
DROP POLICY IF EXISTS "Users can view cajas from their company" ON cajas;
CREATE POLICY "Users can view cajas from their company" ON cajas
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id(auth.uid()));

-- Pagos móvil
DROP POLICY IF EXISTS "Users can view pagos from their company" ON pagos_movil;
CREATE POLICY "Users can view pagos from their company" ON pagos_movil
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id(auth.uid()));

-- Pagos Zelle
DROP POLICY IF EXISTS "Users can view pagos zelle from their company" ON pagos_zelle;
CREATE POLICY "Users can view pagos zelle from their company" ON pagos_zelle
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id(auth.uid()));

-- Notas de crédito
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON notas_credito_caja;
CREATE POLICY "Users can view notas credito from their company" ON notas_credito_caja
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id(auth.uid()));