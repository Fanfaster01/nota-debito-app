-- Agregar índice faltante para clave foránea en proveedores
-- Mejorar rendimiento de consultas que usan la relación con users (created_by)

-- Índice para proveedores.created_by (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_proveedores_created_by 
    ON public.proveedores(created_by);

-- Índice compuesto para consultas frecuentes (creador + activo)
CREATE INDEX IF NOT EXISTS idx_proveedores_created_by_active 
    ON public.proveedores(created_by, is_active);

-- Índice compuesto para consultas por creador y compañía
CREATE INDEX IF NOT EXISTS idx_proveedores_created_by_company 
    ON public.proveedores(created_by, company_id);

-- Comentarios de documentación
COMMENT ON INDEX idx_proveedores_created_by IS 
'Índice para clave foránea created_by - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_proveedores_created_by_active IS 
'Índice compuesto para consultas de proveedores por creador y estado activo - optimiza listados.';

COMMENT ON INDEX idx_proveedores_created_by_company IS 
'Índice compuesto para consultas de proveedores por creador y compañía - optimiza filtros por usuario.';