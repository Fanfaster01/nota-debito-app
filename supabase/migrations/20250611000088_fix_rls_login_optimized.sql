-- Corregir políticas RLS siguiendo mejores prácticas para evitar bloqueos de login
-- Basado en documentación oficial de Supabase y casos comunes

-- === LIMPIAR POLÍTICAS ANTERIORES ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view users in company" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Admins can view companies" ON public.companies;

-- === TABLA USERS - POLÍTICA UNIFICADA ===
-- Una sola política SELECT para evitar evaluaciones múltiples
CREATE POLICY "Users can view users" ON public.users
    FOR SELECT TO authenticated
    USING (
        -- Usuario siempre puede ver su propio perfil (optimizado con subquery)
        id = (SELECT auth.uid())
        OR
        -- Lógica para admin/master en una sola evaluación
        EXISTS (
            SELECT 1 FROM public.users auth_user
            WHERE auth_user.id = (SELECT auth.uid())
            AND (
                -- Master puede ver todos
                auth_user.role = 'master'
                OR
                -- Admin puede ver usuarios de su compañía
                (auth_user.role = 'admin' AND auth_user.company_id = users.company_id)
            )
        )
    );

-- Política INSERT para auto-creación (crítica para el login)
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Solo pueden crear su propio perfil
        id = (SELECT auth.uid())
    );

-- Política UPDATE para actualizar propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (id = (SELECT auth.uid()))
    WITH CHECK (id = (SELECT auth.uid()));

-- === TABLA COMPANIES - POLÍTICA UNIFICADA ===
CREATE POLICY "Users can view companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        -- Verificar en una sola consulta con subquery optimizada
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = (SELECT auth.uid())
            AND (
                -- Usuario normal ve su compañía
                (u.company_id = companies.id)
                OR
                -- Admin ve compañías activas
                (u.role = 'admin' AND companies.is_active = true)
                OR
                -- Master ve todas
                (u.role = 'master')
            )
        )
    );

-- === POLÍTICA ANÓNIMA PARA COMPANIES (si es necesaria) ===
CREATE POLICY "Public can view active companies" ON public.companies
    FOR SELECT TO anon
    USING (is_active = true);

-- === AGREGAR ÍNDICES PARA MEJORAR PERFORMANCE ===
-- Índice en users.id que es frecuentemente usado con auth.uid()
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- Índice compuesto para búsquedas de admin/master
CREATE INDEX IF NOT EXISTS idx_users_role_company ON public.users(role, company_id);

-- Comentarios
COMMENT ON POLICY "Users can view users" ON public.users IS 
'Política SELECT unificada optimizada: reduce evaluaciones múltiples y usa subqueries para cachear auth.uid()';

COMMENT ON POLICY "Users can create own profile" ON public.users IS 
'Política INSERT: crítica para auto-creación durante login';

COMMENT ON POLICY "Users can update own profile" ON public.users IS 
'Política UPDATE: usuarios pueden actualizar su propio perfil';

COMMENT ON POLICY "Users can view companies" ON public.companies IS 
'Política SELECT unificada: evita múltiples evaluaciones con EXISTS optimizado';

COMMENT ON POLICY "Public can view active companies" ON public.companies IS 
'Política SELECT anon: permite ver compañías activas sin autenticación';