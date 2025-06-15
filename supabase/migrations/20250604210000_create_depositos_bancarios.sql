-- Crear tabla de bancos para depósitos (diferente a la tabla bancos existente)
CREATE TABLE public.bancos_depositos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    numero_cuenta VARCHAR(30) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla de depósitos bancarios
CREATE TABLE public.depositos_bancarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_recibo SERIAL,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    banco_id UUID NOT NULL REFERENCES public.bancos_depositos(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    monto_bs DECIMAL(15,2) NOT NULL CHECK (monto_bs > 0),
    fecha_deposito DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para optimizar consultas
CREATE INDEX idx_depositos_bancarios_company_id ON public.depositos_bancarios(company_id);
CREATE INDEX idx_depositos_bancarios_banco_id ON public.depositos_bancarios(banco_id);
CREATE INDEX idx_depositos_bancarios_fecha ON public.depositos_bancarios(fecha_deposito);
CREATE INDEX idx_depositos_bancarios_user_id ON public.depositos_bancarios(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER handle_bancos_depositos_updated_at
    BEFORE UPDATE ON public.bancos_depositos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_depositos_bancarios_updated_at
    BEFORE UPDATE ON public.depositos_bancarios
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.bancos_depositos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depositos_bancarios ENABLE ROW LEVEL SECURITY;

-- Políticas para bancos_depositos
-- Master puede ver todos los bancos
CREATE POLICY "Masters can view all bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Admin y usuarios pueden ver todos los bancos (son globales)
CREATE POLICY "Users can view bancos_depositos" ON public.bancos_depositos
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'user')
        )
    );

-- Solo Master puede insertar, actualizar y eliminar bancos
CREATE POLICY "Masters can manage bancos_depositos" ON public.bancos_depositos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Políticas para depositos_bancarios
-- Master puede ver todos los depósitos
CREATE POLICY "Masters can view all depositos_bancarios" ON public.depositos_bancarios
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Admin y usuarios solo pueden ver depósitos de su compañía
CREATE POLICY "Users can view own company depositos_bancarios" ON public.depositos_bancarios
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'user')
            AND company_id = depositos_bancarios.company_id
        )
    );

-- Master puede insertar depósitos para cualquier compañía
CREATE POLICY "Masters can insert depositos_bancarios" ON public.depositos_bancarios
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Admin y usuarios pueden insertar depósitos solo para su compañía
CREATE POLICY "Users can insert own company depositos_bancarios" ON public.depositos_bancarios
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'user')
            AND company_id = depositos_bancarios.company_id
        )
        AND user_id = auth.uid()
    );

-- Master puede actualizar todos los depósitos
CREATE POLICY "Masters can update depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Admin y usuarios pueden actualizar solo depósitos de su compañía
CREATE POLICY "Users can update own company depositos_bancarios" ON public.depositos_bancarios
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'user')
            AND company_id = depositos_bancarios.company_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'user')
            AND company_id = depositos_bancarios.company_id
        )
    );

-- Solo Master puede eliminar depósitos
CREATE POLICY "Masters can delete depositos_bancarios" ON public.depositos_bancarios
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'master'
        )
    );

-- Insertar algunos bancos de ejemplo (bancos venezolanos comunes)
INSERT INTO public.bancos_depositos (nombre, numero_cuenta) VALUES
('Banco de Venezuela', '0102-0000-00-0000000000'),
('Banesco', '0134-0000-00-0000000000'),
('Banco Mercantil', '0105-0000-00-0000000000'),
('BBVA Provincial', '0108-0000-00-0000000000'),
('Banco Bicentenario', '0175-0000-00-0000000000'),
('Bancaribe', '0114-0000-00-0000000000'),
('Banco Exterior', '0115-0000-00-0000000000');

-- Comentarios para documentación
COMMENT ON TABLE public.bancos_depositos IS 'Tabla de bancos para generar recibos de depósitos bancarios';
COMMENT ON TABLE public.depositos_bancarios IS 'Tabla de depósitos bancarios realizados por las empresas';
COMMENT ON COLUMN public.depositos_bancarios.numero_recibo IS 'Número correlativo del recibo de depósito';
COMMENT ON COLUMN public.depositos_bancarios.monto_bs IS 'Monto del depósito en bolívares';
COMMENT ON COLUMN public.depositos_bancarios.fecha_deposito IS 'Fecha del depósito bancario';