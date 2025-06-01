-- Crear vista pública para usuarios que sea accesible
CREATE OR REPLACE VIEW public.users_view AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  created_at,
  updated_at
FROM auth.users;

-- Dar permisos de lectura a usuarios autenticados
GRANT SELECT ON public.users_view TO authenticated;

-- Crear función para obtener información del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_info(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  full_name text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$;

-- Dar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO authenticated;