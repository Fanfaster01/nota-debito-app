-- Corregir problemas de seguridad identificados por Supabase Linter

-- 1. Recrear users_view sin SECURITY DEFINER y con RLS apropiado
DROP VIEW IF EXISTS public.users_view CASCADE;

CREATE VIEW public.users_view AS
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
  created_at,
  updated_at
FROM auth.users
WHERE id = auth.uid(); -- Solo mostrar datos del usuario actual

-- RLS para users_view - solo usuarios autenticados pueden ver sus propios datos
ALTER VIEW public.users_view OWNER TO postgres;
GRANT SELECT ON public.users_view TO authenticated;
-- NO dar permisos a anon para prevenir exposición

-- 2. Recrear creditos_resumen sin SECURITY DEFINER 
-- Recrear la vista usando la definición original pero sin SECURITY DEFINER
DROP VIEW IF EXISTS public.creditos_resumen CASCADE;

CREATE VIEW public.creditos_resumen AS
SELECT 
  c.id,
  c.caja_id,
  c.cliente_id,
  c.numero_factura,
  c.nombre_cliente,
  c.telefono_cliente,
  c.monto_bs,
  c.monto_usd,
  c.tasa,
  c.estado,
  c.fecha_hora,
  c.user_id,
  c.company_id,
  c.fecha_vencimiento,
  c.monto_abonado,
  c.fecha_ultimo_pago,
  c.observaciones,
  cl.nombre as cliente_nombre,
  cl.tipo_documento as cliente_tipo_documento,
  cl.numero_documento as cliente_numero_documento,
  cl.telefono as cliente_telefono,
  COALESCE(c.monto_abonado, 0) as total_abonado,
  c.monto_bs - COALESCE(c.monto_abonado, 0) as saldo_pendiente,
  CASE 
    WHEN c.estado = 'pagado' THEN 'Pagado'
    WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'Vencido'
    WHEN c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '7 days' THEN 'Por vencer'
    ELSE 'Vigente'
  END as estado_vencimiento,
  COUNT(a.id) as cantidad_abonos,
  u.full_name as usuario_nombre,
  co.name as empresa_nombre
FROM creditos_caja c
LEFT JOIN clientes cl ON c.cliente_id = cl.id
LEFT JOIN abonos_credito a ON c.id = a.credito_id
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN companies co ON c.company_id = co.id
-- Aplicar filtros de seguridad basados en RLS de creditos_caja
WHERE 
  (
    -- Users can view their own credits
    c.user_id = auth.uid()
    OR
    -- Admins can view credits from their company
    (
      EXISTS (
        SELECT 1 FROM public.users usr 
        WHERE usr.id = auth.uid() 
        AND usr.role IN ('admin', 'master')
        AND (usr.role = 'master' OR usr.company_id = c.company_id)
      )
    )
  )
GROUP BY c.id, cl.id, u.id, co.id;

-- Dar permisos apropiados (sin SECURITY DEFINER)
ALTER VIEW public.creditos_resumen OWNER TO postgres;
GRANT SELECT ON public.creditos_resumen TO authenticated;

-- 3. Actualizar función get_user_info para ser más segura
DROP FUNCTION IF EXISTS public.get_user_info(uuid);

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

-- Dar permisos solo a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.get_user_info(uuid) TO authenticated;