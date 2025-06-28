-- Crear tabla system_settings si no existe
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB,
    category VARCHAR(100) DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla system_logs si no existe
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar configuraciones por defecto si no existen
INSERT INTO system_settings (key, value, category, description)
VALUES 
    ('app_name', '"Admin DSL"', 'general', 'Nombre de la aplicación'),
    ('default_iva_rate', '16', 'general', 'Tasa de IVA por defecto (%)'),
    ('default_retention_rate', '75', 'general', 'Tasa de retención por defecto (%)'),
    ('max_users_per_company', '50', 'general', 'Máximo de usuarios por empresa'),
    ('email_notifications', 'true', 'notifications', 'Habilitar notificaciones por email'),
    ('invoice_reminders', 'true', 'notifications', 'Habilitar recordatorios de facturas'),
    ('system_alerts', 'true', 'notifications', 'Habilitar alertas del sistema'),
    ('user_registration_alerts', 'true', 'notifications', 'Habilitar alertas de registro de usuarios'),
    ('auto_backup_enabled', 'true', 'backup', 'Habilitar backup automático'),
    ('backup_frequency', '"weekly"', 'backup', 'Frecuencia de backup automático'),
    ('last_backup_date', '"Nunca"', 'backup', 'Fecha del último backup'),
    ('last_backup_size', '"N/A"', 'backup', 'Tamaño del último backup')
ON CONFLICT (key) DO NOTHING;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);

-- RLS (Row Level Security) - solo usuarios master pueden acceder
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Política para system_settings (solo master)
CREATE POLICY "system_settings_master_only" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'master'
        )
    );

-- Política para system_logs (solo master)
CREATE POLICY "system_logs_master_only" ON system_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'master'
        )
    );