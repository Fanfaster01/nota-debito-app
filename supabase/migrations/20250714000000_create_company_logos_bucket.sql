-- Crear bucket para logos de empresas
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir lectura pública
CREATE POLICY "Logos son públicos" ON storage.objects
FOR SELECT USING (bucket_id = 'company-logos');

-- Política para permitir upload a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden subir logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

-- Política para permitir actualizar logos a usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden actualizar logos" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'company-logos' 
  AND auth.role() = 'authenticated'
);

-- Agregar columna logo_url a companies si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'companies' 
    AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE companies ADD COLUMN logo_url TEXT;
  END IF;
END $$;