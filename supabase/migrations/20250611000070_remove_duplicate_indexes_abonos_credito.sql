-- Eliminar índices duplicados en abonos_credito
-- Mantener solo uno de los índices idénticos para credito_id

-- Eliminar el índice duplicado (mantener el más descriptivo)
DROP INDEX IF EXISTS public.idx_abonos_credito_credito;

-- Mantener idx_abonos_credito_credito_id ya que tiene un nombre más claro

-- Comentario de documentación
COMMENT ON INDEX idx_abonos_credito_credito_id IS 
'Índice principal para clave foránea credito_id - mejora rendimiento de consultas con JOINs a creditos_caja.';