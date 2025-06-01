-- Add missing fields to creditos_caja table
ALTER TABLE creditos_caja 
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
ADD COLUMN IF NOT EXISTS observaciones TEXT,
ADD COLUMN IF NOT EXISTS monto_abonado NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS fecha_ultimo_pago TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cantidad_abonos INTEGER DEFAULT 0 NOT NULL;

-- Create index for fecha_vencimiento
CREATE INDEX IF NOT EXISTS idx_creditos_caja_fecha_vencimiento ON creditos_caja(fecha_vencimiento);

-- Update monto_abonado and cantidad_abonos from existing abonos
UPDATE creditos_caja c
SET 
  monto_abonado = COALESCE((
    SELECT SUM(monto_bs) 
    FROM abonos_credito 
    WHERE credito_id = c.id
  ), 0),
  cantidad_abonos = COALESCE((
    SELECT COUNT(*) 
    FROM abonos_credito 
    WHERE credito_id = c.id
  ), 0),
  fecha_ultimo_pago = (
    SELECT MAX(fecha_pago) 
    FROM abonos_credito 
    WHERE credito_id = c.id
  );

-- Create trigger to update monto_abonado when abonos are inserted
CREATE OR REPLACE FUNCTION update_credito_monto_abonado()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE creditos_caja
    SET 
      monto_abonado = monto_abonado + NEW.monto_bs,
      cantidad_abonos = cantidad_abonos + 1,
      fecha_ultimo_pago = NEW.fecha_pago
    WHERE id = NEW.credito_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE creditos_caja
    SET 
      monto_abonado = monto_abonado - OLD.monto_bs,
      cantidad_abonos = cantidad_abonos - 1,
      fecha_ultimo_pago = (
        SELECT MAX(fecha_pago) 
        FROM abonos_credito 
        WHERE credito_id = OLD.credito_id
      )
    WHERE id = OLD.credito_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for abonos_credito
DROP TRIGGER IF EXISTS tr_update_credito_monto_abonado ON abonos_credito;
CREATE TRIGGER tr_update_credito_monto_abonado
AFTER INSERT OR DELETE ON abonos_credito
FOR EACH ROW
EXECUTE FUNCTION update_credito_monto_abonado();