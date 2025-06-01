-- Asegurarnos de eliminar TODAS las políticas viejas de creditos_caja
DROP POLICY IF EXISTS "Users can insert creditos in their company" ON creditos_caja;
DROP POLICY IF EXISTS "Users can view creditos from their company" ON creditos_caja;
DROP POLICY IF EXISTS "Users can update their own creditos" ON creditos_caja;
DROP POLICY IF EXISTS "Users can delete their own creditos" ON creditos_caja;

-- Esperar un momento para asegurar que se eliminen
DO $$ BEGIN PERFORM pg_sleep(0.1); END $$;

-- Crear nuevas políticas sin referencias a auth.users
CREATE POLICY "Users can insert creditos" ON creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view creditos" ON creditos_caja
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update creditos" ON creditos_caja
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete creditos" ON creditos_caja
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- También verificar que la tabla clientes tenga las políticas correctas
DROP POLICY IF EXISTS "Users can insert clientes" ON clientes;
DROP POLICY IF EXISTS "Users can view clientes" ON clientes;
DROP POLICY IF EXISTS "Users can update clientes" ON clientes;

CREATE POLICY "Users can insert clientes" ON clientes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view clientes" ON clientes
    FOR SELECT TO authenticated
    USING (true); -- Los clientes pueden ser vistos por todos los usuarios autenticados

CREATE POLICY "Users can update clientes" ON clientes
    FOR UPDATE TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);