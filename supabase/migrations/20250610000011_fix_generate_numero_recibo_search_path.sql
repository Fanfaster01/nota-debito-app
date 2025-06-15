-- Corregir Function Search Path Mutable para generate_numero_recibo

-- 1. Recrear la función con search_path fijo
CREATE OR REPLACE FUNCTION public.generate_numero_recibo()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY INVOKER  -- Usar SECURITY INVOKER para mejor seguridad
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Obtener el siguiente número para la compañía
    -- Usar referencia explícita al esquema public
    SELECT COALESCE(MAX(numero_recibo), 0) + 1
    INTO next_number
    FROM public.depositos_bancarios
    WHERE company_id = NEW.company_id;
    
    -- Verificar que el número no sea NULL (por seguridad)
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    -- Asignar el número
    NEW.numero_recibo = next_number;
    
    RETURN NEW;
END;
$$;

-- 2. Comentario para documentar la seguridad y funcionalidad
COMMENT ON FUNCTION public.generate_numero_recibo() IS 
'Función trigger para generar números de recibo correlativos por compañía en depositos_bancarios. SET search_path = public, pg_temp para seguridad.';

-- 3. Asegurar permisos apropiados
GRANT EXECUTE ON FUNCTION public.generate_numero_recibo() TO authenticated;

-- 4. Verificar que el trigger siga funcionando correctamente
-- El trigger trigger_generate_numero_recibo en depositos_bancarios
-- seguirá funcionando con la función corregida

-- 5. Opcional: Recrear el trigger para asegurar consistencia
DROP TRIGGER IF EXISTS trigger_generate_numero_recibo ON public.depositos_bancarios;
CREATE TRIGGER trigger_generate_numero_recibo
    BEFORE INSERT ON public.depositos_bancarios
    FOR EACH ROW 
    EXECUTE FUNCTION public.generate_numero_recibo();

-- 6. Crear función adicional más robusta para casos especiales
CREATE OR REPLACE FUNCTION public.get_next_numero_recibo(company_uuid uuid)
RETURNS INTEGER
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = public, pg_temp  -- Fijar search_path para seguridad
AS $$
    SELECT COALESCE(MAX(numero_recibo), 0) + 1
    FROM public.depositos_bancarios
    WHERE company_id = company_uuid;
$$;

-- 7. Comentario para la función adicional
COMMENT ON FUNCTION public.get_next_numero_recibo(uuid) IS 
'Función para obtener el siguiente número de recibo para una compañía específica. SET search_path = public, pg_temp para seguridad.';

-- 8. Permisos para la función adicional
GRANT EXECUTE ON FUNCTION public.get_next_numero_recibo(uuid) TO authenticated;