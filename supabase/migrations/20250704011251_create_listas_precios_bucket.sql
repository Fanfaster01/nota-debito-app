-- Migration to create storage bucket and policies for price lists
-- 20250704011251_create_listas_precios_bucket.sql

-- Create bucket to store price list files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listas-precios',
  'listas-precios', 
  false,
  31457280, -- 30MB in bytes
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'text/csv', -- .csv
    'application/pdf', -- .pdf
    'image/png', -- .png
    'image/jpeg', -- .jpg, .jpeg
    'image/webp', -- .webp
    'image/heic', -- .heic
    'image/heif' -- .heif
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow companies to upload files to their folder
CREATE POLICY "Users can upload files to their company folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'listas-precios' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT companies.id::text 
    FROM companies 
    JOIN users ON users.company_id = companies.id 
    WHERE users.id = auth.uid()
  )
);

-- Policy to allow companies to read files from their folder
CREATE POLICY "Users can view files from their company folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'listas-precios' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT companies.id::text 
    FROM companies 
    JOIN users ON users.company_id = companies.id 
    WHERE users.id = auth.uid()
  )
);

-- Policy to allow companies to delete files from their folder
CREATE POLICY "Users can delete files from their company folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'listas-precios' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT companies.id::text 
    FROM companies 
    JOIN users ON users.company_id = companies.id 
    WHERE users.id = auth.uid()
  )
);

-- Policy for master users (can access all files)
CREATE POLICY "Master users can manage all files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'listas-precios' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'master'
  )
);