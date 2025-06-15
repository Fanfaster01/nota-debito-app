-- Corregir Function Search Path Mutable para get_user_company_id

-- 1. Recrear la función con search_path fijo y mejor seguridad
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER  -- Cambiar de DEFINER a INVOKER para mejor seguridad
STABLE
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
  SELECT company_id FROM public.users WHERE id = user_id;
$$;

-- 2. Asegurar permisos apropiados
GRANT EXECUTE ON FUNCTION public.get_user_company_id(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_user_company_id(uuid) FROM anon;

-- 3. Crear una versión adicional más segura que solo permita obtener la company_id del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- 4. Dar permisos a la nueva función
GRANT EXECUTE ON FUNCTION public.get_current_user_company_id() TO authenticated;
REVOKE ALL ON FUNCTION public.get_current_user_company_id() FROM anon;

-- 5. Comentarios para documentar la seguridad
COMMENT ON FUNCTION public.get_user_company_id(uuid) IS 
'Obtiene company_id de un usuario. SET search_path = public, pg_temp para seguridad. SECURITY INVOKER.';

COMMENT ON FUNCTION public.get_current_user_company_id() IS 
'Obtiene company_id del usuario actual autenticado. SET search_path = public, pg_temp para seguridad.';

-- 6. Opcional: Crear función adicional que valide permisos antes de devolver company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id_secure(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
DECLARE
    target_company_id uuid;
    current_user_role text;
    current_user_company_id uuid;
BEGIN
    -- Solo permitir acceso si:
    -- 1. Es el mismo usuario
    -- 2. Es admin/master con permisos apropiados
    
    IF target_user_id = auth.uid() THEN
        -- Usuario accediendo a su propia company_id
        SELECT company_id INTO target_company_id 
        FROM public.users 
        WHERE id = target_user_id;
        
        RETURN target_company_id;
    END IF;
    
    -- Verificar si el usuario actual es admin/master
    SELECT role, company_id INTO current_user_role, current_user_company_id
    FROM public.users 
    WHERE id = auth.uid();
    
    IF current_user_role = 'master' THEN
        -- Masters pueden ver cualquier company_id
        SELECT company_id INTO target_company_id 
        FROM public.users 
        WHERE id = target_user_id;
        
        RETURN target_company_id;
    ELSIF current_user_role = 'admin' THEN
        -- Admins solo pueden ver usuarios de su misma compañía
        SELECT company_id INTO target_company_id 
        FROM public.users 
        WHERE id = target_user_id 
        AND company_id = current_user_company_id;
        
        RETURN target_company_id;
    ELSE
        -- Usuarios normales no pueden ver company_id de otros
        RAISE EXCEPTION 'Access denied: insufficient permissions';
    END IF;
END;
$$;

-- 7. Dar permisos a la función segura
GRANT EXECUTE ON FUNCTION public.get_user_company_id_secure(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_user_company_id_secure(uuid) FROM anon;