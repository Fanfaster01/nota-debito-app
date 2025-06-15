-- Corregir la referencia de alertas_leidas de auth.users a public.users

-- Primero eliminar la tabla existente (si no tiene datos importantes)
DROP TABLE IF EXISTS alertas_leidas CASCADE;

-- Recrear la tabla con la referencia correcta
CREATE TABLE alertas_leidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  alerta_id TEXT NOT NULL,
  fecha_leida TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índice único para evitar duplicados
  UNIQUE(user_id, company_id, alerta_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_alertas_leidas_user_company ON alertas_leidas(user_id, company_id);
CREATE INDEX idx_alertas_leidas_alerta_id ON alertas_leidas(alerta_id);
CREATE INDEX idx_alertas_leidas_fecha ON alertas_leidas(fecha_leida);

-- RLS (Row Level Security)
ALTER TABLE alertas_leidas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias alertas leídas
CREATE POLICY "Users can view their own read alerts" ON alertas_leidas
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Política para que los usuarios puedan insertar sus propias alertas leídas
CREATE POLICY "Users can insert their own read alerts" ON alertas_leidas
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política para que los usuarios puedan actualizar sus propias alertas leídas
CREATE POLICY "Users can update their own read alerts" ON alertas_leidas
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Política para que los usuarios puedan eliminar sus propias alertas leídas
CREATE POLICY "Users can delete their own read alerts" ON alertas_leidas
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Política adicional para administradores master
CREATE POLICY "Masters can manage all read alerts" ON alertas_leidas
  FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'master');

-- Comentarios
COMMENT ON TABLE alertas_leidas IS 'Tabla para almacenar el estado de lectura de alertas por usuario';
COMMENT ON COLUMN alertas_leidas.alerta_id IS 'ID único de la alerta (generado en el frontend)';
COMMENT ON COLUMN alertas_leidas.fecha_leida IS 'Fecha y hora cuando se marcó como leída';