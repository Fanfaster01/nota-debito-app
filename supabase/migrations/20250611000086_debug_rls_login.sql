-- Políticas temporales ultra-permisivas para diagnosticar problemas de login
-- IMPORTANTE: Estas son solo para diagnóstico, NO para producción

-- Política temporal muy permisiva para users
DROP POLICY IF EXISTS "Users can view users" ON public.users;
CREATE POLICY "Debug login users policy" ON public.users
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Política temporal muy permisiva para companies  
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Debug login companies policy" ON public.companies
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Comentarios
COMMENT ON POLICY "Debug login users policy" ON public.users IS 
'TEMPORAL DIAGNÓSTICO: Política ultra-permisiva para identificar problemas de login - REVERTIR INMEDIATAMENTE';

COMMENT ON POLICY "Debug login companies policy" ON public.companies IS 
'TEMPORAL DIAGNÓSTICO: Política ultra-permisiva para identificar problemas de login - REVERTIR INMEDIATAMENTE';