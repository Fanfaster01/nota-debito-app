-- Migración para añadir campos necesarios para el módulo de Cuentas por Pagar

-- 1. Agregar campos a la tabla facturas
ALTER TABLE facturas 
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE,
ADD COLUMN IF NOT EXISTS estado_pago VARCHAR(30) DEFAULT 'pendiente' CHECK (estado_pago IN ('pendiente', 'pagada', 'pendiente_aprobacion', 'vencida')),
ADD COLUMN IF NOT EXISTS fecha_pago DATE,
ADD COLUMN IF NOT EXISTS notas_pago TEXT,
ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(20) DEFAULT 'deposito' CHECK (tipo_pago IN ('deposito', 'efectivo'));

-- 2. Agregar campo tipo_cambio a proveedores
ALTER TABLE proveedores 
ADD COLUMN IF NOT EXISTS tipo_cambio VARCHAR(10) DEFAULT 'USD' CHECK (tipo_cambio IN ('USD', 'EUR', 'PAR'));

-- 3. Crear tabla de formatos TXT bancarios (global para todas las empresas)
CREATE TABLE IF NOT EXISTS formatos_txt_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_banco VARCHAR(100) NOT NULL,
    codigo_banco VARCHAR(10),
    descripcion TEXT,
    formato_template JSONB NOT NULL,
    campos_requeridos JSONB,
    separador VARCHAR(5) DEFAULT ',',
    extension_archivo VARCHAR(5) DEFAULT 'txt',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nombre_banco, codigo_banco)
);

-- 4. Crear tabla de recibos de pago
CREATE TABLE IF NOT EXISTS recibos_pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_recibo VARCHAR(20) NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    tipo_recibo VARCHAR(20) NOT NULL CHECK (tipo_recibo IN ('individual', 'lote')),
    tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('deposito', 'efectivo')),
    facturas_ids JSONB NOT NULL, -- Array de IDs de facturas incluidas
    monto_total_bs NUMERIC(15,2) NOT NULL,
    monto_total_usd NUMERIC(15,2),
    banco_destino VARCHAR(100),
    formato_txt_id UUID REFERENCES formatos_txt_bancarios(id),
    archivo_txt_generado BOOLEAN DEFAULT false,
    notas TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(numero_recibo, company_id)
);

-- 5. Crear tabla bancos_depositos si no existe (relación proveedor-banco)
CREATE TABLE IF NOT EXISTS bancos_depositos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
    banco_nombre VARCHAR(100) NOT NULL,
    tipo_cuenta VARCHAR(20) NOT NULL CHECK (tipo_cuenta IN ('corriente', 'ahorro')),
    numero_cuenta VARCHAR(30) NOT NULL,
    titular_cuenta VARCHAR(255),
    es_favorita BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proveedor_id, numero_cuenta)
);

-- 6. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_vencimiento ON facturas(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_facturas_estado_pago ON facturas(estado_pago);
CREATE INDEX IF NOT EXISTS idx_facturas_company_estado ON facturas(company_id, estado_pago);
CREATE INDEX IF NOT EXISTS idx_facturas_vencimiento_estado ON facturas(fecha_vencimiento, estado_pago);
CREATE INDEX IF NOT EXISTS idx_recibos_pago_company ON recibos_pago(company_id);
CREATE INDEX IF NOT EXISTS idx_recibos_pago_numero ON recibos_pago(numero_recibo, company_id);
CREATE INDEX IF NOT EXISTS idx_proveedores_tipo_cambio ON proveedores(tipo_cambio);
-- Index condicional para bancos_depositos - solo si las columnas existen
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bancos_depositos' AND column_name = 'proveedor_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bancos_depositos' AND column_name = 'es_favorita'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_bancos_depositos_favorita ON bancos_depositos(proveedor_id, es_favorita);
    END IF;
END $$;

-- 7. Función para generar número de recibo secuencial por empresa
CREATE OR REPLACE FUNCTION generate_numero_recibo(p_company_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    next_number INTEGER;
    numero_recibo VARCHAR(20);
BEGIN
    -- Obtener el siguiente número secuencial para la empresa
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_recibo FROM 5) AS INTEGER)), 0) + 1
    INTO next_number
    FROM recibos_pago 
    WHERE company_id = p_company_id 
    AND numero_recibo ~ '^REC-[0-9]+$';
    
    -- Formatear el número con ceros a la izquierda
    numero_recibo := 'REC-' || LPAD(next_number::TEXT, 5, '0');
    
    RETURN numero_recibo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Función para actualizar estado de facturas vencidas automáticamente
CREATE OR REPLACE FUNCTION update_facturas_vencidas()
RETURNS void AS $$
BEGIN
    UPDATE facturas 
    SET estado_pago = 'vencida',
        updated_at = NOW()
    WHERE estado_pago = 'pendiente' 
    AND fecha_vencimiento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger para actualizar updated_at en las tablas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las nuevas tablas
DROP TRIGGER IF EXISTS update_formatos_txt_bancarios_updated_at ON formatos_txt_bancarios;
CREATE TRIGGER update_formatos_txt_bancarios_updated_at
    BEFORE UPDATE ON formatos_txt_bancarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recibos_pago_updated_at ON recibos_pago;
CREATE TRIGGER update_recibos_pago_updated_at
    BEFORE UPDATE ON recibos_pago
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para bancos_depositos solo si la tabla tiene la estructura correcta
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bancos_depositos' AND column_name = 'updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS update_bancos_depositos_updated_at ON bancos_depositos;
        CREATE TRIGGER update_bancos_depositos_updated_at
            BEFORE UPDATE ON bancos_depositos
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 10. RLS (Row Level Security) para las nuevas tablas
ALTER TABLE formatos_txt_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE recibos_pago ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS para bancos_depositos solo si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bancos_depositos') THEN
        ALTER TABLE bancos_depositos ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Políticas para formatos_txt_bancarios (global, todos pueden leer, solo admin/master pueden modificar)
CREATE POLICY "Todos pueden ver formatos TXT" ON formatos_txt_bancarios
    FOR SELECT USING (true);

CREATE POLICY "Solo admin/master pueden crear formatos TXT" ON formatos_txt_bancarios
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_view 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

CREATE POLICY "Solo admin/master pueden actualizar formatos TXT" ON formatos_txt_bancarios
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_view 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

-- Políticas para recibos_pago (por empresa)
CREATE POLICY "Ver recibos de pago de la empresa" ON recibos_pago
    FOR SELECT USING (
        company_id = (SELECT company_id FROM users WHERE id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM users_view 
            WHERE id = auth.uid() 
            AND role = 'master'
        )
    );

CREATE POLICY "Solo admin/master pueden crear recibos" ON recibos_pago
    FOR INSERT WITH CHECK (
        (company_id = (SELECT company_id FROM users WHERE id = auth.uid()) OR
         EXISTS (
             SELECT 1 FROM users_view 
             WHERE id = auth.uid() 
             AND role = 'master'
         )) AND
        EXISTS (
            SELECT 1 FROM users_view 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

CREATE POLICY "Solo admin/master pueden actualizar recibos" ON recibos_pago
    FOR UPDATE USING (
        (company_id = (SELECT company_id FROM users WHERE id = auth.uid()) OR
         EXISTS (
             SELECT 1 FROM users_view 
             WHERE id = auth.uid() 
             AND role = 'master'
         )) AND
        EXISTS (
            SELECT 1 FROM users_view 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'master')
        )
    );

-- Políticas para bancos_depositos (solo si la tabla tiene la estructura correcta)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bancos_depositos' AND column_name = 'proveedor_id'
    ) THEN
        -- Eliminar políticas existentes si existen
        DROP POLICY IF EXISTS "Ver bancos de proveedores de la empresa" ON bancos_depositos;
        DROP POLICY IF EXISTS "Gestionar bancos de proveedores de la empresa" ON bancos_depositos;
        
        -- Crear nuevas políticas
        CREATE POLICY "Ver bancos de proveedores de la empresa" ON bancos_depositos
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM proveedores p
                    WHERE p.id = bancos_depositos.proveedor_id
                    AND (p.company_id = (SELECT company_id FROM users WHERE id = auth.uid()) OR
                         EXISTS (
                             SELECT 1 FROM users_view 
                             WHERE id = auth.uid() 
                             AND role = 'master'
                         ))
                )
            );

        CREATE POLICY "Gestionar bancos de proveedores de la empresa" ON bancos_depositos
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM proveedores p
                    WHERE p.id = bancos_depositos.proveedor_id
                    AND (p.company_id = (SELECT company_id FROM users WHERE id = auth.uid()) OR
                         EXISTS (
                             SELECT 1 FROM users_view 
                             WHERE id = auth.uid() 
                             AND role = 'master'
                         ))
                )
            );
    END IF;
END $$;

-- 11. Insertar algunos formatos TXT básicos de ejemplo
INSERT INTO formatos_txt_bancarios (nombre_banco, codigo_banco, descripcion, formato_template, campos_requeridos) VALUES
('Banco de Venezuela', '0102', 'Formato estándar BDV', 
 '{"estructura": ["numero_cuenta", "monto", "referencia", "rif_beneficiario"], "separador": ","}',
 '["numero_cuenta", "monto", "referencia"]'),
('Banesco', '0134', 'Formato estándar Banesco',
 '{"estructura": ["tipo_cuenta", "numero_cuenta", "monto", "descripcion"], "separador": ";"}',
 '["numero_cuenta", "monto"]'),
('Banco Mercantil', '0105', 'Formato estándar Mercantil',
 '{"estructura": ["numero_cuenta", "monto_bs", "referencia", "nombre_beneficiario"], "separador": "|"}',
 '["numero_cuenta", "monto_bs", "nombre_beneficiario"]');

COMMENT ON TABLE facturas IS 'Tabla de facturas con campos para cuentas por pagar';
COMMENT ON TABLE formatos_txt_bancarios IS 'Formatos de archivos TXT para diferentes bancos';
COMMENT ON TABLE recibos_pago IS 'Recibos de pago generados para facturas';
COMMENT ON COLUMN facturas.fecha_vencimiento IS 'Fecha de vencimiento de la factura';
COMMENT ON COLUMN facturas.estado_pago IS 'Estado del pago: pendiente, pagada, pendiente_aprobacion, vencida';
COMMENT ON COLUMN facturas.tipo_pago IS 'Tipo de pago: deposito o efectivo';
COMMENT ON COLUMN proveedores.tipo_cambio IS 'Tipo de cambio del proveedor: USD, EUR o PAR (paralelo)';