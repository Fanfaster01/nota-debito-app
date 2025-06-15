-- Agregar índice faltante para clave foránea en facturas
-- Mejorar rendimiento de consultas que usan la relación con users (created_by)

-- Índice para facturas.created_by (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_facturas_created_by 
    ON public.facturas(created_by);

-- Índice compuesto para consultas frecuentes (creador + compañía)
CREATE INDEX IF NOT EXISTS idx_facturas_created_by_company 
    ON public.facturas(created_by, company_id);

-- Índice compuesto para consultas por creador y fecha
CREATE INDEX IF NOT EXISTS idx_facturas_created_by_fecha 
    ON public.facturas(created_by, fecha);

-- Índice para fecha (si no existe)
CREATE INDEX IF NOT EXISTS idx_facturas_fecha 
    ON public.facturas(fecha);

-- Índice para cliente_rif (para búsquedas por cliente)
CREATE INDEX IF NOT EXISTS idx_facturas_cliente_rif 
    ON public.facturas(cliente_rif);

-- Índice para proveedor_rif (para búsquedas por proveedor)
CREATE INDEX IF NOT EXISTS idx_facturas_proveedor_rif 
    ON public.facturas(proveedor_rif);

-- Comentarios de documentación
COMMENT ON INDEX idx_facturas_created_by IS 
'Índice para clave foránea created_by - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_facturas_created_by_company IS 
'Índice compuesto para consultas de facturas por creador y compañía - optimiza filtros por usuario.';

COMMENT ON INDEX idx_facturas_created_by_fecha IS 
'Índice compuesto para consultas de facturas por creador y fecha - optimiza reportes temporales.';

COMMENT ON INDEX idx_facturas_fecha IS 
'Índice para fecha - optimiza consultas y reportes por rango de fechas.';

COMMENT ON INDEX idx_facturas_cliente_rif IS 
'Índice para cliente_rif - optimiza búsquedas y filtros por cliente.';

COMMENT ON INDEX idx_facturas_proveedor_rif IS 
'Índice para proveedor_rif - optimiza búsquedas y filtros por proveedor.';