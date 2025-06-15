-- Eliminar política duplicada que persiste en nota_debito_notas_credito
-- Esta política FOR ALL se solapa con las políticas específicas por operación

-- Eliminar la política FOR ALL que causa el solapamiento
DROP POLICY IF EXISTS "Company users can manage nota_debito_notas_credito" ON public.nota_debito_notas_credito;

-- Verificar que solo queden las políticas específicas por operación:
-- - Users can view nota_debito_notas_credito (SELECT)
-- - Users can insert nota_debito_notas_credito (INSERT) 
-- - Users can update nota_debito_notas_credito (UPDATE)
-- - Users can delete nota_debito_notas_credito (DELETE)

-- Comentario de documentación
COMMENT ON TABLE public.nota_debito_notas_credito IS 
'Tabla de relación entre notas de débito y crédito. Usa políticas específicas por operación para mejor rendimiento.';