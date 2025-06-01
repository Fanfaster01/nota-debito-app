-- Agregar columna monto_apertura_usd a la tabla cajas
ALTER TABLE public.cajas 
ADD COLUMN IF NOT EXISTS monto_apertura_usd DECIMAL(15,2) DEFAULT 0;

-- Agregar comentario a la nueva columna
COMMENT ON COLUMN public.cajas.monto_apertura_usd IS 'Monto de apertura en dólares estadounidenses para el fondo de caja';

-- Actualizar registros existentes (opcional)
-- Si quieres que las cajas existentes tengan 0 en monto_apertura_usd, no es necesario hacer nada
-- ya que el DEFAULT 0 se encarga de eso

-- Verificar que la columna se agregó correctamente
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'cajas' 
-- AND column_name = 'monto_apertura_usd';