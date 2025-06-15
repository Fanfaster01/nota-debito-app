-- Agregar índice faltante para clave foránea en pagos_movil
-- Mejorar rendimiento de consultas que usan la relación con users (user_id)

-- Índice para pagos_movil.user_id (foreign key sin índice)
CREATE INDEX IF NOT EXISTS idx_pagos_movil_user_id 
    ON public.pagos_movil(user_id);

-- Índice compuesto para consultas frecuentes (usuario + fecha)
CREATE INDEX IF NOT EXISTS idx_pagos_movil_user_fecha 
    ON public.pagos_movil(user_id, fecha_hora);

-- Índice compuesto para consultas por usuario y compañía
CREATE INDEX IF NOT EXISTS idx_pagos_movil_user_company 
    ON public.pagos_movil(user_id, company_id);

-- Índice compuesto para consultas por usuario y caja
CREATE INDEX IF NOT EXISTS idx_pagos_movil_user_caja 
    ON public.pagos_movil(user_id, caja_id);

-- Comentarios de documentación
COMMENT ON INDEX idx_pagos_movil_user_id IS 
'Índice para clave foránea user_id - mejora rendimiento de consultas con JOINs a users.';

COMMENT ON INDEX idx_pagos_movil_user_fecha IS 
'Índice compuesto para consultas de pagos móviles por usuario y fecha - optimiza reportes temporales.';

COMMENT ON INDEX idx_pagos_movil_user_company IS 
'Índice compuesto para consultas de pagos móviles por usuario y compañía - optimiza filtros por usuario.';

COMMENT ON INDEX idx_pagos_movil_user_caja IS 
'Índice compuesto para consultas de pagos móviles por usuario y caja - optimiza consultas por cajero.';