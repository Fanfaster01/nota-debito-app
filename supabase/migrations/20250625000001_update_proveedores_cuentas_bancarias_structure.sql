-- Migración para actualizar estructura de proveedores_cuentas_bancarias
-- Agregar campo banco_id y actualizar estructura para usar referencia a tabla bancos

-- Paso 1: Agregar campo banco_id como opcional primero
ALTER TABLE public.proveedores_cuentas_bancarias 
ADD COLUMN IF NOT EXISTS banco_id UUID REFERENCES public.bancos(id);

-- Paso 2: Crear índice para banco_id
CREATE INDEX IF NOT EXISTS idx_proveedores_cuentas_bancarias_banco_id 
ON public.proveedores_cuentas_bancarias(banco_id);

-- Paso 3: Intentar mapear los bancos existentes por nombre
-- (Este paso es opcional y puede requerir intervención manual según los datos)
UPDATE public.proveedores_cuentas_bancarias pcb
SET banco_id = b.id
FROM public.bancos b
WHERE pcb.banco_id IS NULL 
AND b.nombre = pcb.banco_nombre 
AND b.is_active = true;

-- Paso 4: Para registros que no encontraron coincidencia, 
-- los manejaremos en el código de la aplicación

-- Comentarios para el nuevo campo
COMMENT ON COLUMN public.proveedores_cuentas_bancarias.banco_id 
IS 'Referencia al banco de la tabla bancos. Se mantiene banco_nombre por compatibilidad.';