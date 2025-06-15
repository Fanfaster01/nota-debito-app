-- Políticas temporales para diagnosticar problemas de login
-- NOTA: Estas son políticas de diagnóstico, no para producción

-- Política temporal muy permisiva para users
DROP POLICY IF EXISTS "Users can view users" ON public.users;
CREATE POLICY "Debug users policy" ON public.users
    FOR SELECT TO authenticated
    USING (true); -- Permitir todo temporalmente

-- Política temporal muy permisiva para companies
DROP POLICY IF EXISTS "Users can view companies" ON public.companies;
CREATE POLICY "Debug companies policy" ON public.companies
    FOR SELECT TO authenticated
    USING (true); -- Permitir todo temporalmente

-- Comentarios
COMMENT ON POLICY "Debug users policy" ON public.users IS 
'TEMPORAL: Política de diagnóstico permisiva - REVERTIR DESPUÉS DE IDENTIFICAR EL PROBLEMA';

COMMENT ON POLICY "Debug companies policy" ON public.companies IS 
'TEMPORAL: Política de diagnóstico permisiva - REVERTIR DESPUÉS DE IDENTIFICAR EL PROBLEMA';