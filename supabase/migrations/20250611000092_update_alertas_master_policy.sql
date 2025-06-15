-- Actualizar política de master para evitar recursión
DROP POLICY IF EXISTS "Masters can manage all read alerts" ON alertas_leidas;

CREATE POLICY "Masters can manage all read alerts" ON alertas_leidas
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'master');