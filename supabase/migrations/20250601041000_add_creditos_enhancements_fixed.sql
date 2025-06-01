-- Agregar campos adicionales a creditos_caja (solo si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creditos_caja' AND column_name = 'fecha_vencimiento') THEN
        ALTER TABLE creditos_caja ADD COLUMN fecha_vencimiento DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creditos_caja' AND column_name = 'monto_abonado') THEN
        ALTER TABLE creditos_caja ADD COLUMN monto_abonado DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creditos_caja' AND column_name = 'fecha_ultimo_pago') THEN
        ALTER TABLE creditos_caja ADD COLUMN fecha_ultimo_pago TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creditos_caja' AND column_name = 'observaciones') THEN
        ALTER TABLE creditos_caja ADD COLUMN observaciones TEXT;
    END IF;
END $$;

-- Crear tabla para registrar abonos/pagos parciales (solo si no existe)
CREATE TABLE IF NOT EXISTS abonos_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credito_id UUID NOT NULL REFERENCES creditos_caja(id) ON DELETE CASCADE,
  monto_bs DECIMAL(15,2) NOT NULL,
  monto_usd DECIMAL(15,2) NOT NULL,
  tasa DECIMAL(10,2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'pago_movil', 'zelle', 'punto_venta', 'deposito')),
  referencia VARCHAR(100),
  banco_id UUID REFERENCES bancos(id),
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  observaciones TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices solo si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_creditos_caja_fecha_vencimiento') THEN
        CREATE INDEX idx_creditos_caja_fecha_vencimiento ON creditos_caja(fecha_vencimiento);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_abonos_credito_credito') THEN
        CREATE INDEX idx_abonos_credito_credito ON abonos_credito(credito_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_abonos_credito_fecha') THEN
        CREATE INDEX idx_abonos_credito_fecha ON abonos_credito(fecha_pago);
    END IF;
END $$;

-- RLS para abonos_credito
ALTER TABLE abonos_credito ENABLE ROW LEVEL SECURITY;

-- Políticas para abonos_credito (crear solo si no existen)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view abonos from their company' AND tablename = 'abonos_credito') THEN
        CREATE POLICY "Users can view abonos from their company" ON abonos_credito
          FOR SELECT USING (
            company_id IN (
              SELECT company_id FROM users WHERE id = auth.uid()
              UNION
              SELECT id FROM companies WHERE auth.uid() IN (
                SELECT id FROM users WHERE role = 'master'
              )
            )
          );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create abonos for their company' AND tablename = 'abonos_credito') THEN
        CREATE POLICY "Users can create abonos for their company" ON abonos_credito
          FOR INSERT WITH CHECK (
            company_id IN (
              SELECT company_id FROM users WHERE id = auth.uid()
            )
          );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own abonos' AND tablename = 'abonos_credito') THEN
        CREATE POLICY "Users can update their own abonos" ON abonos_credito
          FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;

-- Función para actualizar el estado del crédito cuando se completa el pago
CREATE OR REPLACE FUNCTION update_credito_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar monto abonado y fecha de último pago
  UPDATE creditos_caja
  SET 
    monto_abonado = COALESCE(monto_abonado, 0) + NEW.monto_bs,
    fecha_ultimo_pago = NEW.fecha_pago,
    estado = CASE 
      WHEN COALESCE(monto_abonado, 0) + NEW.monto_bs >= monto_bs THEN 'pagado'
      ELSE 'pendiente'
    END
  WHERE id = NEW.credito_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado del crédito (eliminar si existe y recrear)
DROP TRIGGER IF EXISTS trigger_update_credito_status ON abonos_credito;
CREATE TRIGGER trigger_update_credito_status
AFTER INSERT ON abonos_credito
FOR EACH ROW
EXECUTE FUNCTION update_credito_status();

-- Vista para obtener resumen de créditos con información calculada
DROP VIEW IF EXISTS creditos_resumen;
CREATE VIEW creditos_resumen AS
SELECT 
  c.*,
  cl.nombre as cliente_nombre,
  cl.tipo_documento as cliente_tipo_documento,
  cl.numero_documento as cliente_numero_documento,
  cl.telefono as cliente_telefono,
  COALESCE(c.monto_abonado, 0) as total_abonado,
  c.monto_bs - COALESCE(c.monto_abonado, 0) as saldo_pendiente,
  CASE 
    WHEN c.estado = 'pagado' THEN 'Pagado'
    WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
    WHEN c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'Por vencer'
    ELSE 'Vigente'
  END as estado_vencimiento,
  COUNT(a.id) as cantidad_abonos,
  u.full_name as usuario_nombre,
  co.name as empresa_nombre
FROM creditos_caja c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN abonos_credito a ON c.id = a.credito_id
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN companies co ON c.company_id = co.id
GROUP BY c.id, cl.id, u.id, co.id;