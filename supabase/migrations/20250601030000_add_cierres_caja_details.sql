-- Crear tabla para almacenar los detalles del cierre de caja
create table "public"."cierres_caja" (
    "id" uuid not null default gen_random_uuid(),
    "caja_id" uuid not null,
    "efectivo_dolares" numeric(15,2) default 0,
    "efectivo_euros" numeric(15,2) default 0,
    "efectivo_bs" numeric(15,2) default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."cierres_caja" enable row level security;

-- Crear tabla para los cierres de punto de venta
create table "public"."cierres_punto_venta" (
    "id" uuid not null default gen_random_uuid(),
    "caja_id" uuid not null,
    "banco_id" uuid not null,
    "monto_bs" numeric(15,2) not null,
    "monto_usd" numeric(15,2) not null,
    "numero_lote" character varying(50) not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);

alter table "public"."cierres_punto_venta" enable row level security;

-- Primary keys
CREATE UNIQUE INDEX cierres_caja_pkey ON public.cierres_caja USING btree (id);
alter table "public"."cierres_caja" add constraint "cierres_caja_pkey" PRIMARY KEY using index "cierres_caja_pkey";

CREATE UNIQUE INDEX cierres_punto_venta_pkey ON public.cierres_punto_venta USING btree (id);
alter table "public"."cierres_punto_venta" add constraint "cierres_punto_venta_pkey" PRIMARY KEY using index "cierres_punto_venta_pkey";

-- Foreign keys
alter table "public"."cierres_caja" add constraint "cierres_caja_caja_id_fkey" FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE not valid;
alter table "public"."cierres_caja" validate constraint "cierres_caja_caja_id_fkey";

alter table "public"."cierres_punto_venta" add constraint "cierres_punto_venta_caja_id_fkey" FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE not valid;
alter table "public"."cierres_punto_venta" validate constraint "cierres_punto_venta_caja_id_fkey";

alter table "public"."cierres_punto_venta" add constraint "cierres_punto_venta_banco_id_fkey" FOREIGN KEY (banco_id) REFERENCES bancos(id) not valid;
alter table "public"."cierres_punto_venta" validate constraint "cierres_punto_venta_banco_id_fkey";

-- Indices para mejorar performance
CREATE INDEX idx_cierres_caja_caja_id ON public.cierres_caja USING btree (caja_id);
CREATE INDEX idx_cierres_punto_venta_caja_id ON public.cierres_punto_venta USING btree (caja_id);
CREATE INDEX idx_cierres_punto_venta_banco_id ON public.cierres_punto_venta USING btree (banco_id);

-- RLS Policies para cierres_caja
CREATE POLICY "Los usuarios pueden ver los cierres de caja de su empresa" ON public.cierres_caja
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cajas c
            JOIN users u ON u.id = auth.uid()
            WHERE c.id = cierres_caja.caja_id
            AND c.company_id = u.company_id
        )
    );

CREATE POLICY "Los usuarios pueden crear cierres de caja" ON public.cierres_caja
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = auth.uid()
            AND c.estado = 'abierta'
        )
    );

CREATE POLICY "Los usuarios pueden actualizar sus cierres de caja" ON public.cierres_caja
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_caja.caja_id
            AND c.user_id = auth.uid()
            AND c.estado = 'abierta'
        )
    );

-- RLS Policies para cierres_punto_venta
CREATE POLICY "Los usuarios pueden ver los cierres POS de su empresa" ON public.cierres_punto_venta
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cajas c
            JOIN users u ON u.id = auth.uid()
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.company_id = u.company_id
        )
    );

CREATE POLICY "Los usuarios pueden crear cierres POS" ON public.cierres_punto_venta
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = auth.uid()
            AND c.estado = 'abierta'
        )
    );

CREATE POLICY "Los usuarios pueden actualizar sus cierres POS" ON public.cierres_punto_venta
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = auth.uid()
            AND c.estado = 'abierta'
        )
    );

CREATE POLICY "Los usuarios pueden eliminar sus cierres POS" ON public.cierres_punto_venta
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM cajas c
            WHERE c.id = cierres_punto_venta.caja_id
            AND c.user_id = auth.uid()
            AND c.estado = 'abierta'
        )
    );

-- Triggers para updated_at
CREATE TRIGGER set_cierres_caja_updated_at BEFORE UPDATE ON public.cierres_caja
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_cierres_punto_venta_updated_at BEFORE UPDATE ON public.cierres_punto_venta
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();