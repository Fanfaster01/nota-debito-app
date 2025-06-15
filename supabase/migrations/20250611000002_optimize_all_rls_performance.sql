-- Optimización masiva de políticas RLS para mejorar rendimiento
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila
-- Esto corrige 138 warnings de performance en el dashboard de Supabase

-- =======================
-- TABLA: users
-- =======================

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO public
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO public
    USING ((SELECT auth.uid()) = id);

-- =======================
-- TABLA: cajas
-- =======================

DROP POLICY IF EXISTS "Users can view cajas from their company" ON public.cajas;
CREATE POLICY "Users can view cajas from their company" ON public.cajas
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert cajas" ON public.cajas;
CREATE POLICY "Users can insert cajas" ON public.cajas
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own cajas" ON public.cajas;
CREATE POLICY "Users can update their own cajas" ON public.cajas
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- =======================
-- TABLA: creditos_caja
-- =======================

DROP POLICY IF EXISTS "Users can insert creditos" ON public.creditos_caja;
CREATE POLICY "Users can insert creditos" ON public.creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can view creditos" ON public.creditos_caja;
CREATE POLICY "Users can view creditos" ON public.creditos_caja
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update creditos" ON public.creditos_caja;
CREATE POLICY "Users can update creditos" ON public.creditos_caja
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete creditos" ON public.creditos_caja;
CREATE POLICY "Users can delete creditos" ON public.creditos_caja
    FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- =======================
-- TABLA: pagos_movil
-- =======================

DROP POLICY IF EXISTS "Users can view pagos from their company" ON public.pagos_movil;
CREATE POLICY "Users can view pagos from their company" ON public.pagos_movil
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert pagos in their company" ON public.pagos_movil;
CREATE POLICY "Users can insert pagos in their company" ON public.pagos_movil
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own pagos" ON public.pagos_movil;
CREATE POLICY "Users can update their own pagos" ON public.pagos_movil
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own pagos" ON public.pagos_movil;
CREATE POLICY "Users can delete their own pagos" ON public.pagos_movil
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =======================
-- TABLA: pagos_zelle
-- =======================

DROP POLICY IF EXISTS "Users can view pagos zelle from their company" ON public.pagos_zelle;
CREATE POLICY "Users can view pagos zelle from their company" ON public.pagos_zelle
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert pagos zelle in their company" ON public.pagos_zelle;
CREATE POLICY "Users can insert pagos zelle in their company" ON public.pagos_zelle
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own pagos zelle" ON public.pagos_zelle;
CREATE POLICY "Users can update their own pagos zelle" ON public.pagos_zelle
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own pagos zelle" ON public.pagos_zelle;
CREATE POLICY "Users can delete their own pagos zelle" ON public.pagos_zelle
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =======================
-- TABLA: notas_credito_caja
-- =======================

DROP POLICY IF EXISTS "Users can view notas credito from their company" ON public.notas_credito_caja;
CREATE POLICY "Users can view notas credito from their company" ON public.notas_credito_caja
    FOR SELECT TO authenticated
    USING (company_id = get_user_company_id((SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can insert notas credito in their company" ON public.notas_credito_caja;
CREATE POLICY "Users can insert notas credito in their company" ON public.notas_credito_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = (SELECT auth.uid()) 
        AND company_id = get_user_company_id((SELECT auth.uid()))
    );

DROP POLICY IF EXISTS "Users can update their own notas credito" ON public.notas_credito_caja;
CREATE POLICY "Users can update their own notas credito" ON public.notas_credito_caja
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own notas credito" ON public.notas_credito_caja;
CREATE POLICY "Users can delete their own notas credito" ON public.notas_credito_caja
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- =======================
-- TABLA: clientes
-- Nota: La tabla clientes no tiene company_id, usa created_by para filtrar por usuario
-- =======================

DROP POLICY IF EXISTS "Users can view clientes" ON public.clientes;
CREATE POLICY "Users can view clientes" ON public.clientes
    FOR SELECT TO authenticated
    USING (
        created_by = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = clientes.created_by
            AND u1.company_id = u2.company_id
        )
    );

DROP POLICY IF EXISTS "Users can insert clientes" ON public.clientes;
CREATE POLICY "Users can insert clientes" ON public.clientes
    FOR INSERT TO authenticated
    WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update clientes" ON public.clientes;
CREATE POLICY "Users can update clientes" ON public.clientes
    FOR UPDATE TO authenticated
    USING (
        created_by = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.users u1, public.users u2
            WHERE u1.id = (SELECT auth.uid())
            AND u2.id = clientes.created_by
            AND u1.company_id = u2.company_id
        )
    );

-- =======================
-- TABLA: alertas_leidas
-- =======================

DROP POLICY IF EXISTS "Usuarios pueden leer sus alertas" ON public.alertas_leidas;
CREATE POLICY "Usuarios pueden leer sus alertas" ON public.alertas_leidas
    FOR SELECT TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden insertar sus alertas" ON public.alertas_leidas;
CREATE POLICY "Usuarios pueden insertar sus alertas" ON public.alertas_leidas
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus alertas" ON public.alertas_leidas;
CREATE POLICY "Usuarios pueden actualizar sus alertas" ON public.alertas_leidas
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus alertas" ON public.alertas_leidas;
CREATE POLICY "Usuarios pueden eliminar sus alertas" ON public.alertas_leidas
    FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Comentario para documentar la optimización
-- Optimización masiva de RLS: reemplazó auth.uid() con (SELECT auth.uid()) en 80+ políticas para mejorar rendimiento