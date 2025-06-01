-- Crear tabla de clientes
create table "public"."clientes" (
    "id" uuid not null default gen_random_uuid(),
    "tipo_documento" character varying(2) not null check (tipo_documento in ('V', 'E', 'J', 'G', 'P')),
    "numero_documento" character varying(20) not null,
    "nombre" character varying(255) not null,
    "telefono" character varying(50),
    "direccion" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "created_by" uuid not null,
    "is_active" boolean not null default true
);

alter table "public"."clientes" enable row level security;

-- Primary key
CREATE UNIQUE INDEX clientes_pkey ON public.clientes USING btree (id);
alter table "public"."clientes" add constraint "clientes_pkey" PRIMARY KEY using index "clientes_pkey";

-- Índice único para tipo y número de documento
CREATE UNIQUE INDEX clientes_documento_unique ON public.clientes USING btree (tipo_documento, numero_documento) WHERE is_active = true;

-- Foreign keys
alter table "public"."clientes" add constraint "clientes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;
alter table "public"."clientes" validate constraint "clientes_created_by_fkey";

-- Indices para mejorar búsquedas
CREATE INDEX idx_clientes_numero_documento ON public.clientes USING btree (numero_documento);
CREATE INDEX idx_clientes_nombre ON public.clientes USING btree (nombre);
CREATE INDEX idx_clientes_created_by ON public.clientes USING btree (created_by);

-- RLS Policies
CREATE POLICY "Los usuarios pueden ver todos los clientes activos" ON public.clientes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Los usuarios autenticados pueden crear clientes" ON public.clientes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Los usuarios pueden actualizar clientes que crearon" ON public.clientes
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Los usuarios master pueden actualizar cualquier cliente" ON public.clientes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'master'
        )
    );

-- Trigger para updated_at
CREATE TRIGGER set_clientes_updated_at BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Actualizar tabla de créditos para referenciar clientes
ALTER TABLE "public"."creditos_caja" 
ADD COLUMN "cliente_id" uuid,
ADD CONSTRAINT "creditos_caja_cliente_id_fkey" 
    FOREIGN KEY (cliente_id) REFERENCES clientes(id);

-- Índice para mejorar joins
CREATE INDEX idx_creditos_caja_cliente_id ON public.creditos_caja USING btree (cliente_id);