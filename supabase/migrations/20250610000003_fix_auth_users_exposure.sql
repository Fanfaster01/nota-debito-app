-- Solución completa para la exposición de auth.users

-- 1. Eliminar la vista problemática
DROP VIEW IF EXISTS public.users_view CASCADE;

-- 2. Crear una nueva vista que NO exponga auth.users directamente
-- En su lugar, usa la tabla public.users que ya contiene la información necesaria
CREATE VIEW public.users_view AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.created_at,
  u.updated_at
FROM public.users u
WHERE 
  -- Solo mostrar datos del usuario actual o si es admin/master de la compañía
  (
    u.id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users current_usr 
      WHERE current_usr.id = auth.uid() 
      AND current_usr.role IN ('admin', 'master')
      AND (
        current_usr.role = 'master' 
        OR current_usr.company_id = u.company_id
      )
    )
  );

-- 3. Crear función auxiliar para obtener usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo devolver información del usuario actual autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.full_name,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = auth.uid();
END;
$$;

-- 3. Crear una función adicional para obtener información específica de usuarios (para admins)
CREATE OR REPLACE FUNCTION public.get_user_details(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text,
  company_id uuid,
  is_active boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar permisos: solo el mismo usuario o admins de la misma compañía
  IF target_user_id != auth.uid() THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'master')
      AND (
        u.role = 'master' 
        OR u.company_id = (SELECT company_id FROM public.users WHERE id = target_user_id)
      )
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    u.full_name,
    u.role::text,
    u.company_id,
    u.is_active
  FROM public.users u
  WHERE u.id = target_user_id;
END;
$$;

-- 4. Configurar permisos seguros para la vista
ALTER VIEW public.users_view OWNER TO postgres;
GRANT SELECT ON public.users_view TO authenticated;
-- NO dar permisos a anon para prevenir exposición
REVOKE ALL ON public.users_view FROM anon;

-- 5. Dar permisos solo a usuarios autenticados para las funciones
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(uuid) TO authenticated;

-- 6. Revocar cualquier permiso que pueda tener anon
REVOKE ALL ON FUNCTION public.get_current_user() FROM anon;
REVOKE ALL ON FUNCTION public.get_user_details(uuid) FROM anon;