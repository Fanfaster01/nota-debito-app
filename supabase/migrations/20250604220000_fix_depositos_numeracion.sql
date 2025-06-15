-- Actualizar ejemplos de bancos con números solo numéricos
UPDATE public.bancos_depositos SET numero_cuenta = '01020000000000000000' WHERE nombre = 'Banco de Venezuela';
UPDATE public.bancos_depositos SET numero_cuenta = '01340000000000000000' WHERE nombre = 'Banesco';
UPDATE public.bancos_depositos SET numero_cuenta = '01050000000000000000' WHERE nombre = 'Banco Mercantil';
UPDATE public.bancos_depositos SET numero_cuenta = '01080000000000000000' WHERE nombre = 'BBVA Provincial';
UPDATE public.bancos_depositos SET numero_cuenta = '01750000000000000000' WHERE nombre = 'Banco Bicentenario';
UPDATE public.bancos_depositos SET numero_cuenta = '01140000000000000000' WHERE nombre = 'Bancaribe';
UPDATE public.bancos_depositos SET numero_cuenta = '01150000000000000000' WHERE nombre = 'Banco Exterior';

-- Eliminar la columna numero_recibo SERIAL existente
ALTER TABLE public.depositos_bancarios DROP COLUMN numero_recibo;

-- Agregar nueva columna numero_recibo como INTEGER
ALTER TABLE public.depositos_bancarios ADD COLUMN numero_recibo INTEGER NOT NULL DEFAULT 1;

-- Crear función para generar número de recibo correlativo por compañía
CREATE OR REPLACE FUNCTION public.generate_numero_recibo()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Obtener el siguiente número para la compañía
    SELECT COALESCE(MAX(numero_recibo), 0) + 1
    INTO next_number
    FROM public.depositos_bancarios
    WHERE company_id = NEW.company_id;
    
    -- Asignar el número
    NEW.numero_recibo = next_number;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para generar número automáticamente
CREATE TRIGGER trigger_generate_numero_recibo
    BEFORE INSERT ON public.depositos_bancarios
    FOR EACH ROW EXECUTE FUNCTION public.generate_numero_recibo();

-- Crear índice único para evitar duplicados por compañía
CREATE UNIQUE INDEX idx_depositos_bancarios_numero_recibo_company 
ON public.depositos_bancarios(company_id, numero_recibo);

-- Actualizar comentario
COMMENT ON COLUMN public.depositos_bancarios.numero_recibo IS 'Número correlativo del recibo de depósito por compañía (formato: 0001, 0002, etc.)';

-- Agregar constraint para asegurar que numero_cuenta sea solo numérico
ALTER TABLE public.bancos_depositos ADD CONSTRAINT check_numero_cuenta_numeric 
CHECK (numero_cuenta ~ '^[0-9]+$');

-- Actualizar políticas para restringir acceso solo a Master y Admin (no usuarios normales)
-- Eliminar políticas que permiten acceso a usuarios normales
DROP POLICY IF EXISTS "Users can view bancos_depositos" ON public.bancos_depositos;
DROP POLICY IF EXISTS "Users can view own company depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can insert own company depositos_bancarios" ON public.depositos_bancarios;
DROP POLICY IF EXISTS "Users can update own company depositos_bancarios" ON public.depositos_bancarios;

-- Crear nueva política para Admin (solo Admin, no usuarios normales)
CREATE POLICY "Admins can view bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('master', 'admin')
        )
    );

-- Admin solo puede ver depósitos de su compañía
CREATE POLICY "Admins can view own company depositos_bancarios" ON public.depositos_bancarios
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    );

-- Admin puede insertar depósitos solo para su compañía
CREATE POLICY "Admins can insert own company depositos_bancarios" ON public.depositos_bancarios
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
        AND user_id = auth.uid()
    );

-- Admin puede actualizar solo depósitos de su compañía
CREATE POLICY "Admins can update own company depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND company_id = depositos_bancarios.company_id
        )
    );