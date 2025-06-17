-- Agregar campo tipo_cambio a la tabla proveedores
ALTER TABLE public.proveedores 
ADD COLUMN IF NOT EXISTS tipo_cambio VARCHAR(3) DEFAULT 'PAR' CHECK (tipo_cambio IN ('USD', 'EUR', 'PAR'));

-- Crear índice para el campo tipo_cambio
CREATE INDEX IF NOT EXISTS idx_proveedores_tipo_cambio ON public.proveedores(tipo_cambio);

-- Comentarios para documentar el campo
COMMENT ON COLUMN public.proveedores.tipo_cambio IS 'Tipo de cambio que maneja el proveedor: USD (Dólares), EUR (Euros), PAR (Paralelo)';

-- Crear tabla para cuentas bancarias de proveedores (para pagos de facturas)
CREATE TABLE IF NOT EXISTS public.proveedores_cuentas_bancarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES public.proveedores(id) ON DELETE CASCADE,
    banco_nombre VARCHAR(100) NOT NULL,
    numero_cuenta VARCHAR(30) NOT NULL,
    titular_cuenta VARCHAR(255),
    es_favorita BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proveedor_id, numero_cuenta)
);

-- Crear índices para la nueva tabla
CREATE INDEX IF NOT EXISTS idx_proveedores_cuentas_bancarias_proveedor_id ON public.proveedores_cuentas_bancarias(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_cuentas_bancarias_activo ON public.proveedores_cuentas_bancarias(activo);

-- Comentarios
COMMENT ON TABLE public.proveedores_cuentas_bancarias IS 'Cuentas bancarias de proveedores para el pago de facturas';
COMMENT ON COLUMN public.proveedores_cuentas_bancarias.es_favorita IS 'Cuenta bancaria preferida para pagos por defecto';