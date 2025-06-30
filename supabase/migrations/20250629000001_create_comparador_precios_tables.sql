-- Migración para crear las tablas del sistema de comparación de precios
-- 20250629000001_create_comparador_precios_tables.sql

-- Tabla de listas de precios cargadas
CREATE TABLE IF NOT EXISTS listas_precio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
    proveedor_nombre VARCHAR(255) NOT NULL,
    fecha_lista DATE NOT NULL,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    moneda VARCHAR(3) NOT NULL CHECK (moneda IN ('USD', 'BS')),
    tasa_cambio DECIMAL(10, 2),
    archivo_original TEXT NOT NULL, -- URL del archivo en storage
    formato_archivo VARCHAR(10) NOT NULL CHECK (formato_archivo IN ('xlsx', 'xls', 'csv')),
    estado_procesamiento VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_procesamiento IN ('pendiente', 'procesando', 'completado', 'error')),
    productos_extraidos INTEGER DEFAULT 0,
    configuracion_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos extraídos de las listas
CREATE TABLE IF NOT EXISTS productos_lista (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lista_precio_id UUID NOT NULL REFERENCES listas_precio(id) ON DELETE CASCADE,
    codigo_original VARCHAR(100),
    nombre_original TEXT NOT NULL,
    nombre_normalizado TEXT,
    presentacion VARCHAR(100),
    unidad_medida VARCHAR(50),
    precio_unitario DECIMAL(12, 2) NOT NULL,
    precio_moneda_original DECIMAL(12, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL CHECK (moneda IN ('USD', 'BS')),
    categoria VARCHAR(100),
    marca VARCHAR(100),
    observaciones TEXT,
    confianza_extraccion INTEGER CHECK (confianza_extraccion >= 0 AND confianza_extraccion <= 100),
    matching_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla maestra de productos
CREATE TABLE IF NOT EXISTS productos_maestro (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    nombres_busqueda TEXT[], -- Array de variaciones del nombre
    presentacion VARCHAR(100) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    marca VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, codigo)
);

-- Tabla de configuración por proveedor
CREATE TABLE IF NOT EXISTS configuracion_proveedor (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    proveedor_id UUID REFERENCES proveedores(id) ON DELETE CASCADE,
    proveedor_nombre VARCHAR(255) NOT NULL,
    formato_esperado JSONB NOT NULL DEFAULT '{}'::jsonb,
    reglas_normalizacion JSONB DEFAULT '{}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, proveedor_id)
);

-- Tabla de comparaciones realizadas
CREATE TABLE IF NOT EXISTS comparaciones_precios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fecha_comparacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    listas_comparadas UUID[] NOT NULL,
    total_productos INTEGER DEFAULT 0,
    productos_matcheados INTEGER DEFAULT 0,
    tasa_matcheo DECIMAL(5, 2) DEFAULT 0,
    estado_comparacion VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_comparacion IN ('pendiente', 'procesando', 'completado', 'error')),
    resultados_id VARCHAR(255), -- ID del archivo de resultados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de resultados de comparación
CREATE TABLE IF NOT EXISTS resultados_comparacion (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comparacion_id UUID NOT NULL REFERENCES comparaciones_precios(id) ON DELETE CASCADE,
    producto_maestro_id UUID REFERENCES productos_maestro(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(255) NOT NULL,
    presentacion VARCHAR(100),
    precios JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de precios por proveedor
    mejor_precio JSONB NOT NULL, -- {proveedorId, proveedorNombre, precio, moneda}
    diferencia_porcentual DECIMAL(5, 2),
    alerta_precio VARCHAR(20) CHECK (alerta_precio IN ('subida_anormal', 'bajada_anormal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de registro de uso de IA
CREATE TABLE IF NOT EXISTS procesamiento_ia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lista_precio_id UUID REFERENCES listas_precio(id) ON DELETE CASCADE,
    tipo_operacion VARCHAR(20) NOT NULL CHECK (tipo_operacion IN ('extraccion', 'matching')),
    modelo VARCHAR(50) NOT NULL,
    tokens_usados INTEGER NOT NULL,
    costo_estimado DECIMAL(10, 4),
    tiempo_procesamiento INTEGER, -- en milisegundos
    exitoso BOOLEAN DEFAULT true,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_listas_precio_company_estado ON listas_precio(company_id, estado_procesamiento);
CREATE INDEX idx_listas_precio_proveedor ON listas_precio(proveedor_id);
CREATE INDEX idx_listas_precio_fecha ON listas_precio(fecha_lista DESC);

CREATE INDEX idx_productos_lista_lista_id ON productos_lista(lista_precio_id);
CREATE INDEX idx_productos_lista_matching ON productos_lista(matching_id);
CREATE INDEX idx_productos_lista_nombre ON productos_lista(nombre_normalizado);

CREATE INDEX idx_productos_maestro_company ON productos_maestro(company_id);
CREATE INDEX idx_productos_maestro_codigo ON productos_maestro(company_id, codigo);
CREATE INDEX idx_productos_maestro_busqueda ON productos_maestro USING GIN(nombres_busqueda);

CREATE INDEX idx_comparaciones_company ON comparaciones_precios(company_id);
CREATE INDEX idx_comparaciones_fecha ON comparaciones_precios(fecha_comparacion DESC);

CREATE INDEX idx_resultados_comparacion_id ON resultados_comparacion(comparacion_id);
CREATE INDEX idx_resultados_producto ON resultados_comparacion(producto_maestro_id);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listas_precio_updated_at BEFORE UPDATE ON listas_precio
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_maestro_updated_at BEFORE UPDATE ON productos_maestro
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_proveedor_updated_at BEFORE UPDATE ON configuracion_proveedor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparaciones_precios_updated_at BEFORE UPDATE ON comparaciones_precios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE listas_precio ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_lista ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_maestro ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_proveedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparaciones_precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados_comparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE procesamiento_ia ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (ajustar según necesidades)
CREATE POLICY listas_precio_company_policy ON listas_precio
    FOR ALL USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY productos_lista_company_policy ON productos_lista
    FOR ALL USING (lista_precio_id IN (
        SELECT id FROM listas_precio WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY productos_maestro_company_policy ON productos_maestro
    FOR ALL USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY configuracion_proveedor_company_policy ON configuracion_proveedor
    FOR ALL USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY comparaciones_precios_company_policy ON comparaciones_precios
    FOR ALL USING (company_id IN (
        SELECT company_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY resultados_comparacion_company_policy ON resultados_comparacion
    FOR ALL USING (comparacion_id IN (
        SELECT id FROM comparaciones_precios WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY procesamiento_ia_company_policy ON procesamiento_ia
    FOR ALL USING (lista_precio_id IN (
        SELECT id FROM listas_precio WHERE company_id IN (
            SELECT company_id FROM users WHERE id = auth.uid()
        )
    ));