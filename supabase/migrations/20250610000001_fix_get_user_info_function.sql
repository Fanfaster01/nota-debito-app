-- Corregir función get_user_info para que los tipos coincidan
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
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text as full_name
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$;