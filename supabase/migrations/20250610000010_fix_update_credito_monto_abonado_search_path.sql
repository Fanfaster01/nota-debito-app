-- Corregir Function Search Path Mutable para update_credito_monto_abonado

-- 1. Recrear la función con search_path fijo
CREATE OR REPLACE FUNCTION public.update_credito_monto_abonado()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER  -- Usar SECURITY INVOKER para mejor seguridad
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.creditos_caja
    SET 
      monto_abonado = COALESCE(monto_abonado, 0) + NEW.monto_bs,
      cantidad_abonos = COALESCE(cantidad_abonos, 0) + 1,
      fecha_ultimo_pago = NEW.fecha_pago
    WHERE id = NEW.credito_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.creditos_caja
    SET 
      monto_abonado = GREATEST(COALESCE(monto_abonado, 0) - OLD.monto_bs, 0),
      cantidad_abonos = GREATEST(COALESCE(cantidad_abonos, 0) - 1, 0),
      fecha_ultimo_pago = (
        SELECT MAX(fecha_pago) 
        FROM public.abonos_credito 
        WHERE credito_id = OLD.credito_id
      )
    WHERE id = OLD.credito_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 2. Comentario para documentar la seguridad y funcionalidad
COMMENT ON FUNCTION public.update_credito_monto_abonado() IS 
'Función trigger para actualizar monto_abonado en creditos_caja cuando se insertan/eliminan abonos. SET search_path = public, pg_temp para seguridad.';

-- 3. Asegurar permisos apropiados (las funciones trigger no necesitan permisos explícitos para funcionar)
-- pero es buena práctica tenerlos definidos
GRANT EXECUTE ON FUNCTION public.update_credito_monto_abonado() TO authenticated;

-- 4. Verificar que el trigger siga funcionando correctamente
-- El trigger tr_update_credito_monto_abonado en la tabla abonos_credito
-- seguirá funcionando con la función corregida

-- 5. Opcional: Si queremos ser extra seguros, podemos recrear el trigger también
DROP TRIGGER IF EXISTS tr_update_credito_monto_abonado ON public.abonos_credito;
CREATE TRIGGER tr_update_credito_monto_abonado
    AFTER INSERT OR DELETE ON public.abonos_credito
    FOR EACH ROW
    EXECUTE FUNCTION public.update_credito_monto_abonado();