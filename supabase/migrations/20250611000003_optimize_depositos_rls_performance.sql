-- Optimización de políticas RLS para depositos_bancarios
-- Reemplazar auth.uid() con (SELECT auth.uid()) para evitar re-evaluación por fila

-- =======================
-- TABLA: depositos_bancarios
-- =======================

-- Policy 1: Admins can view own company depositos_bancarios
DROP POLICY IF EXISTS "Admins can view own company depositos_bancarios" ON public.depositos_bancarios;
CREATE POLICY "Admins can view own company depositos_bancarios" ON public.depositos_bancarios
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    );

-- Policy 2: Admins can insert own company depositos_bancarios
DROP POLICY IF EXISTS "Admins can insert own company depositos_bancarios" ON public.depositos_bancarios;
CREATE POLICY "Admins can insert own company depositos_bancarios" ON public.depositos_bancarios
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
        AND user_id = (SELECT auth.uid())
    );

-- Policy 3: Admins can update own company depositos_bancarios
DROP POLICY IF EXISTS "Admins can update own company depositos_bancarios" ON public.depositos_bancarios;
CREATE POLICY "Admins can update own company depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    );

-- =======================
-- TABLA: bancos_depositos
-- =======================

-- Policy: Admins can view bancos_depositos
DROP POLICY IF EXISTS "Admins can view bancos_depositos" ON public.bancos_depositos;
CREATE POLICY "Admins can view bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role IN ('master', 'admin')
        )
    );

-- =======================
-- TABLA: cierres_caja
-- Nota: cierres_caja no tiene user_id directo, usa relación a través de cajas
-- =======================

-- Optimizar políticas de cierres_caja usando relación con cajas
DROP POLICY IF EXISTS "Users can view own cierres" ON public.cierres_caja;
CREATE POLICY "Users can view own cierres" ON public.cierres_caja
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cajas 
            WHERE cajas.id = cierres_caja.caja_id 
            AND cajas.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can insert own cierres" ON public.cierres_caja;
CREATE POLICY "Users can insert own cierres" ON public.cierres_caja
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cajas 
            WHERE cajas.id = cierres_caja.caja_id 
            AND cajas.user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can update own cierres" ON public.cierres_caja;
CREATE POLICY "Users can update own cierres" ON public.cierres_caja
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.cajas 
            WHERE cajas.id = cierres_caja.caja_id 
            AND cajas.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cajas 
            WHERE cajas.id = cierres_caja.caja_id 
            AND cajas.user_id = (SELECT auth.uid())
        )
    );

-- =======================
-- TABLA: companies
-- =======================

-- Policy: Users can view their company
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id = (
            SELECT company_id 
            FROM public.users 
            WHERE id = (SELECT auth.uid())
        )
    );

-- Policy: Masters can manage companies
DROP POLICY IF EXISTS "Masters can manage companies" ON public.companies;
CREATE POLICY "Masters can manage companies" ON public.companies
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = (SELECT auth.uid()) 
            AND role = 'master'
        )
    );

-- Comentario para documentar la optimización
-- Optimización RLS parte 2: depositos_bancarios, companies, cierres_caja - reemplazó auth.uid() con (SELECT auth.uid())