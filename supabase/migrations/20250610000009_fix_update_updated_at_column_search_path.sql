-- Corregir Function Search Path Mutable para update_updated_at_column

-- 1. Recrear la función con search_path fijo
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER  -- Usar SECURITY INVOKER para mejor seguridad
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 2. Comentario para documentar la seguridad
COMMENT ON FUNCTION public.update_updated_at_column() IS 
'Función trigger para actualizar updated_at. SET search_path = public, pg_temp para seguridad. Usada por múltiples triggers.';

-- 3. Asegurar permisos apropiados (las funciones trigger no necesitan permisos explícitos)
-- pero es buena práctica documentar su uso
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- 4. Opcional: Crear una versión alternativa más explícita si es necesaria
CREATE OR REPLACE FUNCTION public.trigger_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
    -- Función alternativa con nombre más descriptivo
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Comentario para la función alternativa
COMMENT ON FUNCTION public.trigger_update_timestamp() IS 
'Función trigger alternativa para actualizar updated_at. SET search_path = public, pg_temp para seguridad.';

-- 6. Verificar que todos los triggers existentes sigan funcionando
-- La función update_updated_at_column() se usa en:
-- - bancos, cajas, companies, facturas, notas_credito, notas_credito_caja
-- - notas_debito, pagos_movil, pagos_zelle, proveedores, system_settings, users
-- - cierres_caja, creditos_caja, clientes

-- Todos estos triggers seguirán funcionando con la función corregida