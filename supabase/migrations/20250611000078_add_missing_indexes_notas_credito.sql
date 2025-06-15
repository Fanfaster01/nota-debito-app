-- Agregar índice faltante para clave foránea en notas_credito
-- Mejorar rendimiento de consultas que usan la relación con users (created_by)

-- Índice para notas_credito.created_by (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_notas_credito_created_by 
    ON public.notas_credito(created_by);

-- Índice compuesto para consultas frecuentes (creador + compañía)
CREATE INDEX IF NOT EXISTS idx_notas_credito_created_by_company 
    ON public.notas_credito(created_by, company_id);

-- Índice compuesto para consultas por creador y fecha
CREATE INDEX IF NOT EXISTS idx_notas_credito_created_by_fecha 
    ON public.notas_credito(created_by, fecha);

-- Índice para fecha (si no existe)
CREATE INDEX IF NOT EXISTS idx_notas_credito_fecha 
    ON public.notas_credito(fecha);

-- Comentarios de documentación
COMMENT ON INDEX idx_notas_credito_created_by IS 
'Índice para clave foránea created_by - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_notas_credito_created_by_company IS 
'Índice compuesto para consultas de notas de crédito por creador y compañía - optimiza filtros por usuario.';

COMMENT ON INDEX idx_notas_credito_created_by_fecha IS 
'Índice compuesto para consultas de notas de crédito por creador y fecha - optimiza reportes temporales.';

COMMENT ON INDEX idx_notas_credito_fecha IS 
'Índice para fecha - optimiza consultas y reportes por rango de fechas.';