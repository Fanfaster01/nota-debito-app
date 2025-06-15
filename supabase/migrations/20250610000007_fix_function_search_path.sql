-- Corregir Function Search Path Mutable para todas las funciones

-- 1. Corregir handle_updated_at con search_path fijo
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2. Corregir update_credito_status con search_path fijo
CREATE OR REPLACE FUNCTION public.update_credito_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
  -- Actualizar monto abonado y fecha de último pago
  UPDATE creditos_caja
  SET 
    monto_abonado = COALESCE(monto_abonado, 0) + NEW.monto_bs,
    fecha_ultimo_pago = NEW.fecha_pago,
    estado = CASE 
      WHEN COALESCE(monto_abonado, 0) + NEW.monto_bs >= monto_bs THEN 'pagado'
      ELSE 'pendiente'
    END
  WHERE id = NEW.credito_id;
  
  RETURN NEW;
END;
$$;

-- 3. Corregir get_current_user con search_path fijo
CREATE OR REPLACE FUNCTION public.get_current_user()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
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

-- 4. Corregir get_user_details con search_path fijo
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
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
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

-- 5. Corregir get_user_info con search_path fijo (si existe)
CREATE OR REPLACE FUNCTION public.get_user_info(user_id uuid)
RETURNS TABLE(
  id uuid,
  email text,
  full_name text
) 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
  -- Solo permitir que los usuarios obtengan su propia información
  IF user_id != auth.uid() THEN
    -- Verificar si es admin/master que puede ver otros usuarios de su compañía
    IF NOT EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'master')
    ) THEN
      RAISE EXCEPTION 'Access denied';
    END IF;
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::text,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email)::text as full_name
  FROM auth.users u
  WHERE u.id = user_id;
END;
$$;

-- 6. Corregir cualquier otra función trigger que pueda existir
-- Función genérica para triggers de updated_at con search_path fijo
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 7. Comentarios para documentar la seguridad
COMMENT ON FUNCTION public.handle_updated_at() IS 
'Función trigger para actualizar updated_at. SET search_path = public, pg_temp para seguridad.';

COMMENT ON FUNCTION public.update_credito_status() IS 
'Función trigger para actualizar estado de créditos. SET search_path = public, pg_temp para seguridad.';

COMMENT ON FUNCTION public.get_current_user() IS 
'Función para obtener usuario actual. SET search_path = public, pg_temp para seguridad.';

-- 8. Verificar permisos (ya establecidos anteriormente, pero reforzamos)
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_details(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO authenticated;