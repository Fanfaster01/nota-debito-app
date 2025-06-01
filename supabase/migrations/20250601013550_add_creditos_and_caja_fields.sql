-- Agregar campo monto_apertura_usd a la tabla cajas
ALTER TABLE cajas 
ADD COLUMN IF NOT EXISTS monto_apertura_usd NUMERIC(10, 2) DEFAULT 0 NOT NULL;

-- Agregar campos para totales de creditos si no existen
ALTER TABLE cajas 
ADD COLUMN IF NOT EXISTS total_creditos_bs NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS total_creditos_usd NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS cantidad_creditos INTEGER DEFAULT 0 NOT NULL;

-- Agregar campos para totales de notas de credito si no existen
ALTER TABLE cajas 
ADD COLUMN IF NOT EXISTS total_notas_credito NUMERIC(10, 2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS cantidad_notas_credito INTEGER DEFAULT 0 NOT NULL;

-- Crear tabla creditos_caja
CREATE TABLE IF NOT EXISTS creditos_caja (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
    numero_factura TEXT NOT NULL,
    nombre_cliente TEXT NOT NULL,
    telefono_cliente TEXT NOT NULL,
    monto_bs NUMERIC(10, 2) NOT NULL,
    monto_usd NUMERIC(10, 2) NOT NULL,
    tasa NUMERIC(10, 2) NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES companies(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indices para mejorar el rendimiento
CREATE INDEX idx_creditos_caja_caja_id ON creditos_caja(caja_id);
CREATE INDEX idx_creditos_caja_company_id ON creditos_caja(company_id);
CREATE INDEX idx_creditos_caja_fecha_hora ON creditos_caja(fecha_hora);
CREATE INDEX idx_creditos_caja_estado ON creditos_caja(estado);

-- Indice unico para numero de factura por empresa
CREATE UNIQUE INDEX idx_creditos_caja_numero_factura_company ON creditos_caja(numero_factura, company_id);

-- RLS (Row Level Security)
ALTER TABLE creditos_caja ENABLE ROW LEVEL SECURITY;

-- Politica para insertar (usuarios autenticados pueden insertar en su empresa)
CREATE POLICY "Users can insert creditos in their company" ON creditos_caja
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND company_id IN (
        SELECT company_id FROM auth.users WHERE id = auth.uid()
    ));

-- Politica para ver (usuarios pueden ver creditos de su empresa)
CREATE POLICY "Users can view creditos from their company" ON creditos_caja
    FOR SELECT TO authenticated
    USING (company_id IN (
        SELECT company_id FROM auth.users WHERE id = auth.uid()
    ));

-- Politica para actualizar (usuarios pueden actualizar creditos que crearon)
CREATE POLICY "Users can update their own creditos" ON creditos_caja
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Politica para eliminar (usuarios pueden eliminar creditos que crearon)
CREATE POLICY "Users can delete their own creditos" ON creditos_caja
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_creditos_caja_updated_at
    BEFORE UPDATE ON creditos_caja
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();