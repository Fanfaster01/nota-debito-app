-- Agregar índices faltantes para claves foráneas en nota_debito_notas_credito
-- Mejorar rendimiento de consultas que usan estas relaciones
-- Nota: Ya existe un índice compuesto UNIQUE (nota_debito_id, nota_credito_id)
-- pero necesitamos índices individuales para consultas inversas

-- Índice para nota_credito_id (foreign key sin índice individual)
CREATE INDEX IF NOT EXISTS idx_nota_debito_notas_credito_nota_credito_id 
    ON public.nota_debito_notas_credito(nota_credito_id);

-- Índice para nota_debito_id (para consultas inversas)
CREATE INDEX IF NOT EXISTS idx_nota_debito_notas_credito_nota_debito_id 
    ON public.nota_debito_notas_credito(nota_debito_id);

-- Comentarios de documentación
COMMENT ON INDEX idx_nota_debito_notas_credito_nota_credito_id IS 
'Índice para clave foránea nota_credito_id - mejora rendimiento de consultas inversas desde notas de crédito.';

COMMENT ON INDEX idx_nota_debito_notas_credito_nota_debito_id IS 
'Índice para clave foránea nota_debito_id - mejora rendimiento de consultas desde notas de débito.';