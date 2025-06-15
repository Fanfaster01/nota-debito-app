-- Add company_id column to proveedores table
-- This column was missing but referenced in policies

-- 1. Add the company_id column to proveedores table
ALTER TABLE public.proveedores 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;

-- 2. Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_proveedores_company_id ON public.proveedores(company_id);

-- 3. Update existing proveedores to assign them to companies based on created_by user
-- This assumes proveedores should belong to the same company as their creator
UPDATE public.proveedores p
SET company_id = u.company_id
FROM public.users u
WHERE p.created_by = u.id
AND p.company_id IS NULL;

-- 4. For proveedores without created_by, assign them to the first company (fallback)
-- This is a safe default for migration purposes
UPDATE public.proveedores
SET company_id = (SELECT id FROM public.companies ORDER BY created_at LIMIT 1)
WHERE company_id IS NULL AND created_by IS NULL;

-- 5. Make company_id NOT NULL after populating the data
-- Only do this if all proveedores have been assigned a company
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.proveedores WHERE company_id IS NULL) THEN
        ALTER TABLE public.proveedores ALTER COLUMN company_id SET NOT NULL;
    END IF;
END $$;

-- 6. Add comment for documentation
COMMENT ON COLUMN public.proveedores.company_id IS 'Company that owns this provider record';