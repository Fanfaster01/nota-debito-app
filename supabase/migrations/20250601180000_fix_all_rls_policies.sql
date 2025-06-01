-- Verificar y corregir todas las políticas RLS que puedan estar causando problemas

-- Para la tabla users (pública), asegurar que los usuarios puedan ver su propio registro
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Para pagos_movil
DROP POLICY IF EXISTS "Users can insert pagos in their company" ON pagos_movil;
DROP POLICY IF EXISTS "Users can view pagos from their company" ON pagos_movil;
DROP POLICY IF EXISTS "Users can update their own pagos" ON pagos_movil;
DROP POLICY IF EXISTS "Users can delete their own pagos" ON pagos_movil;

CREATE POLICY "Users can insert pagos in their company" ON pagos_movil
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view pagos from their company" ON pagos_movil
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can update their own pagos" ON pagos_movil
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pagos" ON pagos_movil
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Para pagos_zelle
DROP POLICY IF EXISTS "Users can insert pagos zelle in their company" ON pagos_zelle;
DROP POLICY IF EXISTS "Users can view pagos zelle from their company" ON pagos_zelle;
DROP POLICY IF EXISTS "Users can update their own pagos zelle" ON pagos_zelle;
DROP POLICY IF EXISTS "Users can delete their own pagos zelle" ON pagos_zelle;

CREATE POLICY "Users can insert pagos zelle in their company" ON pagos_zelle
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view pagos zelle from their company" ON pagos_zelle
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can update their own pagos zelle" ON pagos_zelle
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pagos zelle" ON pagos_zelle
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Para notas_credito_caja
DROP POLICY IF EXISTS "Users can insert notas credito in their company" ON notas_credito_caja;
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON notas_credito_caja;
DROP POLICY IF EXISTS "Users can update their own notas credito" ON notas_credito_caja;
DROP POLICY IF EXISTS "Users can delete their own notas credito" ON notas_credito_caja;

CREATE POLICY "Users can insert notas credito in their company" ON notas_credito_caja
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view notas credito from their company" ON notas_credito_caja
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can update their own notas credito" ON notas_credito_caja
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notas credito" ON notas_credito_caja
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Para creditos_caja (ya corregida en la migración anterior, pero asegurémonos)
DROP POLICY IF EXISTS "Users can insert creditos in their company" ON creditos_caja;
DROP POLICY IF EXISTS "Users can view creditos from their company" ON creditos_caja;

CREATE POLICY "Users can insert creditos in their company" ON creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view creditos from their company" ON creditos_caja
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- Para cajas
DROP POLICY IF EXISTS "Users can insert cajas" ON cajas;
DROP POLICY IF EXISTS "Users can view cajas from their company" ON cajas;
DROP POLICY IF EXISTS "Users can update their own cajas" ON cajas;

CREATE POLICY "Users can insert cajas" ON cajas
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view cajas from their company" ON cajas
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can update their own cajas" ON cajas
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);