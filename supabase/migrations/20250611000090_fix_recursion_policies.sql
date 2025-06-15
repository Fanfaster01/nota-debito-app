-- Corregir políticas RLS para evitar recursión infinita
-- El problema es que las políticas de users consultaban la misma tabla users

-- === LIMPIAR POLÍTICAS TEMPORALES ===
DROP POLICY IF EXISTS "Simple users select" ON public.users;
DROP POLICY IF EXISTS "Simple users insert" ON public.users;
DROP POLICY IF EXISTS "Simple companies select" ON public.companies;

-- === CREAR FUNCIÓN PARA OBTENER ROL SIN RECURSIÓN ===
-- Esta función usa SECURITY DEFINER para evitar RLS al verificar el rol
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM public.users
    WHERE id = user_id;
    
    RETURN user_role_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función para obtener company_id sin recursión
CREATE OR REPLACE FUNCTION get_user_company_id(user_id uuid)
RETURNS uuid AS $$
DECLARE
    company_id_value uuid;
BEGIN
    SELECT company_id INTO company_id_value
    FROM public.users
    WHERE id = user_id;
    
    RETURN company_id_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- === POLÍTICAS PARA USERS SIN RECURSIÓN ===
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Admins can view company users" ON public.users
    FOR SELECT TO authenticated
    USING (
        -- Usar la función para evitar recursión
        get_user_role(auth.uid()) = 'admin' 
        AND company_id = get_user_company_id(auth.uid())
    );

CREATE POLICY "Masters can view all users" ON public.users
    FOR SELECT TO authenticated
    USING (get_user_role(auth.uid()) = 'master');

-- Política INSERT para auto-creación
CREATE POLICY "Users can create own profile" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- Política UPDATE para actualizar propio perfil
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- === POLÍTICAS PARA COMPANIES SIN RECURSIÓN ===
CREATE POLICY "Users can view own company" ON public.companies
    FOR SELECT TO authenticated
    USING (id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can view active companies" ON public.companies
    FOR SELECT TO authenticated
    USING (
        get_user_role(auth.uid()) = 'admin' 
        AND is_active = true
    );

CREATE POLICY "Masters can view all companies" ON public.companies
    FOR SELECT TO authenticated
    USING (get_user_role(auth.uid()) = 'master');

-- Política para anónimos
CREATE POLICY "Public can view active companies" ON public.companies
    FOR SELECT TO anon
    USING (is_active = true);

-- Comentarios
COMMENT ON FUNCTION get_user_role IS 
'Función SECURITY DEFINER para obtener el rol del usuario sin causar recursión en RLS';

COMMENT ON FUNCTION get_user_company_id IS 
'Función SECURITY DEFINER para obtener el company_id del usuario sin causar recursión en RLS';

COMMENT ON POLICY "Users can view own profile" ON public.users IS 
'Política básica: usuario ve su propio perfil';

COMMENT ON POLICY "Admins can view company users" ON public.users IS 
'Política admin: ve usuarios de su compañía usando funciones sin recursión';

COMMENT ON POLICY "Masters can view all users" ON public.users IS 
'Política master: ve todos los usuarios usando función sin recursión';