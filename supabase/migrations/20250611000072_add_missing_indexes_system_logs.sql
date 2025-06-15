-- Agregar índice faltante para clave foránea en system_logs
-- Mejorar rendimiento de consultas que usan la relación con users

-- Índice para system_logs.user_id (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id 
    ON public.system_logs(user_id);

-- Índice compuesto para consultas frecuentes (usuario + fecha)
CREATE INDEX IF NOT EXISTS idx_system_logs_user_date 
    ON public.system_logs(user_id, created_at);

-- Índice compuesto para consultas de logs por usuario y acción
CREATE INDEX IF NOT EXISTS idx_system_logs_user_action 
    ON public.system_logs(user_id, action);

-- Comentarios de documentación
COMMENT ON INDEX idx_system_logs_user_id IS 
'Índice para clave foránea user_id - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_system_logs_user_date IS 
'Índice compuesto para consultas de logs por usuario y fecha - optimiza reportes de actividad.';

COMMENT ON INDEX idx_system_logs_user_action IS 
'Índice compuesto para consultas de logs por usuario y acción - optimiza auditorías específicas.';