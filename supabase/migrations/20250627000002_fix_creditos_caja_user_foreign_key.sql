-- Fix foreign key relationship for creditos_caja.user_id to point to public.users instead of auth.users
-- This will allow proper joins in PostgREST queries

DO $$ 
BEGIN
    -- Drop the existing foreign key constraint that points to auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'creditos_caja_user_id_fkey' 
        AND table_name = 'creditos_caja'
    ) THEN
        ALTER TABLE creditos_caja DROP CONSTRAINT creditos_caja_user_id_fkey;
    END IF;
    
    -- Add new foreign key constraint that points to public.users
    ALTER TABLE creditos_caja 
    ADD CONSTRAINT creditos_caja_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
    
    -- Do the same for abonos_credito table
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'abonos_credito_user_id_fkey' 
        AND table_name = 'abonos_credito'
    ) THEN
        ALTER TABLE abonos_credito DROP CONSTRAINT abonos_credito_user_id_fkey;
    END IF;
    
    ALTER TABLE abonos_credito 
    ADD CONSTRAINT abonos_credito_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id);
    
END $$;