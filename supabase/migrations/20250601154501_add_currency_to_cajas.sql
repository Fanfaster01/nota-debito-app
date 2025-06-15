-- Agregar campo de moneda a la tabla cajas (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='cajas' AND column_name='tipo_moneda') THEN
        ALTER TABLE public.cajas ADD COLUMN tipo_moneda VARCHAR(3) DEFAULT 'USD' CHECK (tipo_moneda IN ('USD', 'EUR'));
    END IF;
END $$;

-- Actualizar comentario de la tabla
COMMENT ON COLUMN public.cajas.tipo_moneda IS 'Tipo de moneda para la tasa del día: USD (dólar) o EUR (euro)';

-- Actualizar registros existentes para que tengan USD por defecto
UPDATE public.cajas SET tipo_moneda = 'USD' WHERE tipo_moneda IS NULL;