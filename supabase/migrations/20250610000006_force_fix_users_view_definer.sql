-- Solución forzada para eliminar SECURITY DEFINER de users_view

-- 1. Verificar y eliminar CUALQUIER vista que pueda existir con ese nombre
DROP VIEW IF EXISTS public.users_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.users_view CASCADE;

-- 2. Limpiar cualquier función relacionada que pueda tener SECURITY DEFINER
DROP FUNCTION IF EXISTS public.users_view() CASCADE;

-- 3. Crear la vista de manera completamente nueva y explícitamente sin SECURITY DEFINER
-- Importante: Forzar explícitamente SECURITY INVOKER
CREATE VIEW public.users_view
WITH (security_invoker = true)  -- Forzar explícitamente SECURITY INVOKER
AS
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

-- 4. Establecer permisos específicos
ALTER VIEW public.users_view OWNER TO postgres;
GRANT SELECT ON public.users_view TO authenticated;

-- 5. Revocar explícitamente todos los otros permisos
REVOKE ALL ON public.users_view FROM anon;
REVOKE ALL ON public.users_view FROM public;

-- 6. Agregar comentario de documentación
COMMENT ON VIEW public.users_view IS 
'Vista de usuarios con SECURITY INVOKER explícito. Usa public.users (no auth.users) y respeta RLS.';

-- 7. Verificar que las funciones relacionadas también sean SECURITY INVOKER
-- Recrear get_current_user para asegurar consistencia
DROP FUNCTION IF EXISTS public.get_current_user() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY INVOKER  -- Cambiar de DEFINER a INVOKER
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

-- 8. Recrear get_user_details también como SECURITY INVOKER
DROP FUNCTION IF EXISTS public.get_user_details(uuid) CASCADE;

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
SECURITY INVOKER  -- Cambiar de DEFINER a INVOKER
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

-- 9. Establecer permisos para las funciones
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(uuid) TO authenticated;

-- 10. Revocar permisos de anon
REVOKE ALL ON FUNCTION public.get_current_user() FROM anon;
REVOKE ALL ON FUNCTION public.get_user_details(uuid) FROM anon;