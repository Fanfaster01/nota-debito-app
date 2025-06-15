-- Optimización de funciones que usan auth.uid() para mejor rendimiento
-- Reemplazar auth.uid() con (SELECT auth.uid()) en funciones y views

-- =======================
-- OPTIMIZAR FUNCIÓN get_user_company_id
-- =======================

-- Ya está optimizada en migración anterior, pero verificar que esté usando SELECT
CREATE OR REPLACE FUNCTION get_user_company_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM users WHERE id = user_id;
$$;

-- =======================
-- OPTIMIZAR VIEW users_view si existe
-- =======================

-- Recrear users_view con optimización si existe
DROP VIEW IF EXISTS public.users_view;
CREATE VIEW public.users_view AS
SELECT 
    u.id, 
    u.email, 
    u.full_name, 
    u.role,
    u.company_id,
    u.is_active,
    u.created_at, 
    u.updated_at,
    c.name as company_name,
    c.rif as company_rif
FROM public.users u
LEFT JOIN public.companies c ON u.company_id = c.id
WHERE u.id = (SELECT auth.uid()) 
   OR EXISTS (
       SELECT 1 FROM public.users current_usr 
       WHERE current_usr.id = (SELECT auth.uid()) 
       AND current_usr.role IN ('master', 'admin')
   );

-- =======================
-- POLÍTICAS RESTANTES CRÍTICAS
-- =======================

-- Optimizar políticas de facturas
DROP POLICY IF EXISTS "Users can view facturas from their company" ON public.facturas;
CREATE POLICY "Users can view facturas from their company" ON public.facturas
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Optimizar políticas de notas_credito
DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito;
CREATE POLICY "Users can view notas credito from their company" ON public.notas_credito
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Optimizar políticas de notas_debito
DROP POLICY IF EXISTS "Users can view notas debito from their company" ON public.notas_debito;
CREATE POLICY "Users can view notas debito from their company" ON public.notas_debito
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

-- Optimizar políticas de abonos_credito si existen
DROP POLICY IF EXISTS "Users can view own abonos" ON public.abonos_credito;
CREATE POLICY "Users can view own abonos" ON public.abonos_credito
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.creditos_caja c
            WHERE c.id = abonos_credito.credito_id
            AND c.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Users can insert own abonos" ON public.abonos_credito;
CREATE POLICY "Users can insert own abonos" ON public.abonos_credito
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1 FROM public.creditos_caja c
            WHERE c.id = abonos_credito.credito_id
            AND c.company_id = get_user_company_id((SELECT auth.uid()))
        )
    );

DROP POLICY IF EXISTS "Users can update own abonos" ON public.abonos_credito;
CREATE POLICY "Users can update own abonos" ON public.abonos_credito
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own abonos" ON public.abonos_credito;
CREATE POLICY "Users can delete own abonos" ON public.abonos_credito
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =======================
-- POLÍTICA ESPECIAL PARA MASTER USERS
-- =======================

-- Crear política global para masters (pueden ver todo)
DROP POLICY IF EXISTS "Masters can view all data" ON public.users;
CREATE POLICY "Masters can view all data" ON public.users
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = id 
        OR EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'master'
        )
    );

-- Asegurar que la función get_user_company_id tenga permisos
GRANT EXECUTE ON FUNCTION get_user_company_id(uuid) TO authenticated;

-- Comentario para documentar la optimización
-- Optimización RLS parte 3: funciones, views y políticas restantes - todas usando (SELECT auth.uid())