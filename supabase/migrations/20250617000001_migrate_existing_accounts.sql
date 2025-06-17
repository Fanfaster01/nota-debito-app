-- Migrar cuentas bancarias existentes a la nueva tabla
INSERT INTO public.proveedores_cuentas_bancarias (
    proveedor_id,
    banco_nombre,
    numero_cuenta,
    titular_cuenta,
    es_favorita,
    activo,
    created_at,
    updated_at
)
SELECT 
    p.id as proveedor_id,
    COALESCE(b.nombre, 'Banco no especificado') as banco_nombre,
    p.numero_cuenta,
    p.nombre as titular_cuenta, -- Usar nombre del proveedor como titular por defecto
    true as es_favorita, -- Marcar como favorita al ser la única
    true as activo,
    p.created_at,
    p.updated_at
FROM public.proveedores p
LEFT JOIN public.bancos b ON p.banco_id = b.id
WHERE p.numero_cuenta IS NOT NULL 
  AND p.numero_cuenta != ''
  AND p.is_active = true;

-- Comentario sobre la migración
COMMENT ON TABLE public.proveedores_cuentas_bancarias IS 'Cuentas bancarias de proveedores migradas desde la estructura anterior';