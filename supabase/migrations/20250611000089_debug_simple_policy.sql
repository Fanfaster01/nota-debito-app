-- Política temporal ultra simple para diagnosticar el problema
-- SOLO PARA DEBUG - REVERTIR DESPUÉS

-- Eliminar todas las políticas actuales de users
DROP POLICY IF EXISTS "Users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- Crear una sola política simple para SELECT
CREATE POLICY "Simple users select" ON public.users
    FOR SELECT 
    TO authenticated
    USING (true); -- Temporalmente permitir todo

-- Mantener la política de INSERT para auto-creación
CREATE POLICY "Simple users insert" ON public.users
    FOR INSERT 
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Eliminar políticas de companies
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Public can view active companies" ON public.companies;

-- Crear política simple para companies
CREATE POLICY "Simple companies select" ON public.companies
    FOR SELECT 
    TO authenticated
    USING (true); -- Temporalmente permitir todo

-- Comentarios
COMMENT ON POLICY "Simple users select" ON public.users IS 
'TEMPORAL DEBUG: Política ultra permisiva para diagnosticar - REVERTIR';

COMMENT ON POLICY "Simple companies select" ON public.companies IS 
'TEMPORAL DEBUG: Política ultra permisiva para diagnosticar - REVERTIR';