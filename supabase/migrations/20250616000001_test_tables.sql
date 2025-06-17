-- Test script to verify tables exist
-- This will fail if tables don't exist, helping us diagnose

-- Check if recibos_pago table exists and has correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'recibos_pago' 
ORDER BY ordinal_position;

-- Check if formatos_txt_bancarios exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'formatos_txt_bancarios';

-- Check if facturas has the new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'facturas' 
AND column_name IN ('fecha_vencimiento', 'estado_pago', 'tipo_pago');

-- Check if generate_numero_recibo function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'generate_numero_recibo';