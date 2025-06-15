-- Crear tabla para almacenar alertas leídas por usuario
CREATE TABLE alertas_leidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- RLS (Row Level Security)
ALTER TABLE alertas_leidas ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias alertas leídas
CREATE POLICY "Users can view their own read alerts" ON alertas_leidas
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Política para que los usuarios puedan insertar sus propias alertas leídas
CREATE POLICY "Users can insert their own read alerts" ON alertas_leidas
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Política para que los usuarios puedan eliminar sus propias alertas leídas
CREATE POLICY "Users can delete their own read alerts" ON alertas_leidas
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Política adicional para administradores master
CREATE POLICY "Masters can view all read alerts" ON alertas_leidas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'master'
    )
  );