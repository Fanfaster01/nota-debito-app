-- Eliminar índices duplicados para fecha en abonos_credito
-- Mantener solo uno de los índices idénticos para la columna de fecha

-- Eliminar el índice duplicado (mantener el más descriptivo)
DROP INDEX IF EXISTS public.idx_abonos_credito_fecha;

-- Mantener idx_abonos_credito_fecha_pago ya que especifica claramente la columna

-- Comentario de documentación
COMMENT ON INDEX idx_abonos_credito_fecha_pago IS 
'Índice para fecha_pago - optimiza consultas de abonos por rango de fechas y reportes temporales.';