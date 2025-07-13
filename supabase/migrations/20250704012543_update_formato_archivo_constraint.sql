-- Migration to update formato_archivo constraint to support all file formats
-- 20250704012543_update_formato_archivo_constraint.sql

-- Drop the existing check constraint
ALTER TABLE listas_precio DROP CONSTRAINT IF EXISTS listas_precio_formato_archivo_check;

-- Add the new constraint with all supported formats
ALTER TABLE listas_precio ADD CONSTRAINT listas_precio_formato_archivo_check 
CHECK (formato_archivo IN (
  'xlsx', 'xls', 'csv', 'pdf', 
  'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'
));