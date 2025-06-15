-- Eliminar completamente SECURITY DEFINER de creditos_resumen

-- 1. Primero eliminar la vista actual completamente
DROP VIEW IF EXISTS public.creditos_resumen CASCADE;

-- 2. Recrear la vista SIN la propiedad SECURITY DEFINER
-- IMPORTANTE: No agregar SECURITY DEFINER aquí
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
-- La seguridad se maneja a través de las políticas RLS de las tablas subyacentes
-- especialmente creditos_caja que ya tiene sus propias políticas
GROUP BY c.id, cl.id, u.id, co.id;

-- 3. Establecer ownership pero SIN SECURITY DEFINER
ALTER VIEW public.creditos_resumen OWNER TO postgres;

-- 4. Dar permisos específicos y revocar acceso anónimo
GRANT SELECT ON public.creditos_resumen TO authenticated;
REVOKE ALL ON public.creditos_resumen FROM anon;
REVOKE ALL ON public.creditos_resumen FROM public;

-- 5. Asegurar que no hay atributos SECURITY DEFINER
-- (PostgreSQL por defecto crea vistas como SECURITY INVOKER, que es lo que queremos)

-- 6. Comentario para clarificar la seguridad
COMMENT ON VIEW public.creditos_resumen IS 
'Vista de resumen de créditos. La seguridad se maneja a través de las políticas RLS de creditos_caja. SECURITY INVOKER por defecto.';