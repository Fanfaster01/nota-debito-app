-- Add missing estado column to creditos_caja table
-- This column is referenced in the trigger function but was never added to the table

DO $$ 
BEGIN
    -- Add estado column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'creditos_caja' AND column_name = 'estado') THEN
        ALTER TABLE creditos_caja ADD COLUMN estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado'));
        
        -- Update existing records based on whether they are fully paid
        UPDATE creditos_caja 
        SET estado = CASE 
            WHEN COALESCE(monto_abonado, 0) >= monto_bs THEN 'pagado'
            ELSE 'pendiente'
        END;
        
        -- Make the column NOT NULL after setting default values
        ALTER TABLE creditos_caja ALTER COLUMN estado SET NOT NULL;
    END IF;
END $$;

-- Create index for estado column for better query performance
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_creditos_caja_estado') THEN
        CREATE INDEX idx_creditos_caja_estado ON creditos_caja(estado);
    END IF;
END $$;