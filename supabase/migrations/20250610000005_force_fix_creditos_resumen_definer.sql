-- Solución forzada para eliminar SECURITY DEFINER de creditos_resumen

-- 1. Verificar y eliminar CUALQUIER vista que pueda existir con ese nombre
DROP VIEW IF EXISTS public.creditos_resumen CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.creditos_resumen CASCADE;

-- 2. Limpiar cualquier función relacionada que pueda tener SECURITY DEFINER
DROP FUNCTION IF EXISTS public.creditos_resumen() CASCADE;

-- 3. Crear la vista de manera completamente nueva y explícitamente sin SECURITY DEFINER
-- Importante: PostgreSQL por defecto crea vistas como SECURITY INVOKER
CREATE VIEW public.creditos_resumen
WITH (security_invoker = true)  -- Forzar explícitamente SECURITY INVOKER
AS
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
GROUP BY c.id, cl.id, u.id, co.id;

-- 4. Establecer permisos específicos
ALTER VIEW public.creditos_resumen OWNER TO postgres;
GRANT SELECT ON public.creditos_resumen TO authenticated;

-- 5. Revocar explícitamente todos los otros permisos
REVOKE ALL ON public.creditos_resumen FROM anon;
REVOKE ALL ON public.creditos_resumen FROM public;

-- 6. Verificar que no se pueda acceder como usuario anónimo
-- La seguridad se maneja a través de las políticas RLS de creditos_caja

-- 7. Agregar comentario de documentación
COMMENT ON VIEW public.creditos_resumen IS 
'Vista de resumen de créditos con SECURITY INVOKER explícito. Respeta RLS de tablas subyacentes.';

-- 8. Como alternativa, si el problema persiste, podemos eliminar completamente la vista
-- y crear una función que devuelva los mismos datos pero sin ser detectada como "vista"
-- Descomenta las siguientes líneas si el problema persiste:

/*
-- Alternativa: Crear función en lugar de vista
DROP VIEW IF EXISTS public.creditos_resumen CASCADE;

CREATE OR REPLACE FUNCTION public.get_creditos_resumen()
RETURNS TABLE (
  id uuid,
  caja_id uuid,
  cliente_id uuid,
  numero_factura text,
  nombre_cliente text,
  telefono_cliente text,
  monto_bs numeric,
  monto_usd numeric,
  tasa numeric,
  estado text,
  fecha_hora timestamptz,
  user_id uuid,
  company_id uuid,
  fecha_vencimiento date,
  monto_abonado numeric,
  fecha_ultimo_pago timestamptz,
  observaciones text,
  cliente_nombre text,
  cliente_tipo_documento text,
  cliente_numero_documento text,
  cliente_telefono text,
  total_abonado numeric,
  saldo_pendiente numeric,
  estado_vencimiento text,
  cantidad_abonos bigint,
  usuario_nombre text,
  empresa_nombre text
)
LANGUAGE sql
SECURITY INVOKER  -- Explícitamente SECURITY INVOKER
AS $$
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
  GROUP BY c.id, cl.id, u.id, co.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_creditos_resumen() TO authenticated;
*/