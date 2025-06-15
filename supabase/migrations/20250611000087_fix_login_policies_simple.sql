-- Corregir políticas RLS que bloquean el login
-- Usar políticas más simples y directas que funcionen durante el proceso de autenticación

-- === TABLA USERS ===
DROP POLICY IF EXISTS "Debug login users policy" ON public.users;

-- Política simple para SELECT en users
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

-- Política para que admins y masters puedan ver otros usuarios
CREATE POLICY "Admins can view users in company" ON public.users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role IN ('admin', 'master')
            AND (
                admin_user.role = 'master' -- Master ve todos
                OR admin_user.company_id = users.company_id -- Admin ve su compañía
            )
        )
    );

-- === TABLA COMPANIES ===
DROP POLICY IF EXISTS "Debug login companies policy" ON public.companies;

-- Política simple para SELECT en companies
CREATE POLICY "Users can view own company" ON public.companies
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT company_id FROM public.users 
            WHERE id = auth.uid() AND company_id IS NOT NULL
        )
    );

-- Política para admins y masters
CREATE POLICY "Admins can view companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid()
            AND admin_user.role IN ('admin', 'master')
            AND (
                admin_user.role = 'master' -- Master ve todas
                OR (admin_user.role = 'admin' AND is_active = true) -- Admin ve activas
            )
        )
    );

-- === MANTENER POLÍTICA DE INSERCIÓN PARA AUTO-CREACIÓN ===
-- (Ya existe de migración anterior, pero verificamos)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can create own profile'
    ) THEN
        CREATE POLICY "Users can create own profile" ON public.users
            FOR INSERT TO authenticated
            WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- Comentarios
COMMENT ON POLICY "Users can view own profile" ON public.users IS 
'Política SELECT básica: Usuario puede ver su propio perfil usando auth.uid() directo';

COMMENT ON POLICY "Admins can view users in company" ON public.users IS 
'Política SELECT admin: Admin ve usuarios de su compañía, Master ve todos';

COMMENT ON POLICY "Users can view own company" ON public.companies IS 
'Política SELECT básica: Usuario puede ver su propia compañía';

COMMENT ON POLICY "Admins can view companies" ON public.companies IS 
'Política SELECT admin: Admin ve compañías activas, Master ve todas';