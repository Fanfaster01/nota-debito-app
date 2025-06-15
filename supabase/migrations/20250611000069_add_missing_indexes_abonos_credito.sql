-- Agregar índices faltantes para claves foráneas en abonos_credito
-- Mejorar rendimiento de consultas que usan estas relaciones

-- Índice para abonos_credito.banco_id (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_banco_id 
    ON public.abonos_credito(banco_id);

-- Verificar otros índices importantes que puedan faltar
-- Índice para credito_id (ya debería existir, pero verificamos)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_credito_id 
    ON public.abonos_credito(credito_id);

-- Índice para user_id (para consultas por usuario)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_user_id 
    ON public.abonos_credito(user_id);

-- Índice para company_id (para consultas por compañía)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_company_id 
    ON public.abonos_credito(company_id);

-- Índice para fecha_pago (para consultas por fecha)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_fecha_pago 
    ON public.abonos_credito(fecha_pago);

-- Índice compuesto para consultas frecuentes (credito + fecha)
CREATE INDEX IF NOT EXISTS idx_abonos_credito_credito_fecha 
    ON public.abonos_credito(credito_id, fecha_pago);

-- Comentarios de documentación
COMMENT ON INDEX idx_abonos_credito_banco_id IS 
'Índice para clave foránea banco_id - mejora rendimiento de consultas con JOINs a bancos.';

COMMENT ON INDEX idx_abonos_credito_credito_fecha IS 
'Índice compuesto para consultas de abonos por crédito y fecha - optimiza reportes y búsquedas.';