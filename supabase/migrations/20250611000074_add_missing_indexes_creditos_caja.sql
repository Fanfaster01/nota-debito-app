-- Agregar índice faltante para clave foránea en creditos_caja
-- Mejorar rendimiento de consultas que usan la relación con users (user_id)

-- Índice para creditos_caja.user_id (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_creditos_caja_user_id 
    ON public.creditos_caja(user_id);

-- Índice compuesto para consultas frecuentes (usuario + estado)
CREATE INDEX IF NOT EXISTS idx_creditos_caja_user_estado 
    ON public.creditos_caja(user_id, estado);

-- Índice compuesto para consultas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_creditos_caja_user_fecha 
    ON public.creditos_caja(user_id, fecha_hora);

-- Índice compuesto para consultas por usuario y compañía
CREATE INDEX IF NOT EXISTS idx_creditos_caja_user_company 
    ON public.creditos_caja(user_id, company_id);

-- Comentarios de documentación
COMMENT ON INDEX idx_creditos_caja_user_id IS 
'Índice para clave foránea user_id - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_creditos_caja_user_estado IS 
'Índice compuesto para consultas de créditos por usuario y estado - optimiza filtros de estado.';

COMMENT ON INDEX idx_creditos_caja_user_fecha IS 
'Índice compuesto para consultas de créditos por usuario y fecha - optimiza reportes temporales.';

COMMENT ON INDEX idx_creditos_caja_user_company IS 
'Índice compuesto para consultas de créditos por usuario y compañía - optimiza filtros por usuario.';