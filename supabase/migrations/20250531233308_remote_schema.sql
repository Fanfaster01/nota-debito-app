create type "public"."user_role" as enum ('master', 'admin', 'user');

create table "public"."bancos" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(100) not null,
    "codigo" character varying(4) not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_active" boolean not null default true
);


alter table "public"."bancos" enable row level security;

create table "public"."cajas" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "company_id" uuid not null,
    "fecha" date not null,
    "hora_apertura" timestamp with time zone not null,
    "hora_cierre" timestamp with time zone,
    "monto_apertura" numeric(15,2) default 0,
    "monto_cierre" numeric(15,2),
    "total_pagos_movil" numeric(15,2) default 0,
    "cantidad_pagos_movil" integer default 0,
    "estado" character varying(20) default 'abierta'::character varying,
    "observaciones" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "tasa_dia" numeric(10,2) default 0,
    "total_zelle_usd" numeric(15,2) default 0,
    "total_zelle_bs" numeric(15,2) default 0,
    "cantidad_zelle" integer default 0,
    "total_notas_credito" numeric(15,2) default 0,
    "cantidad_notas_credito" integer default 0,
    "monto_apertura_usd" numeric(15,2) default 0
);


alter table "public"."cajas" enable row level security;

create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(255) not null,
    "rif" character varying(20) not null,
    "address" text not null,
    "phone" character varying(20),
    "email" character varying(255),
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_active" boolean not null default true
);


alter table "public"."companies" enable row level security;

create table "public"."facturas" (
    "id" uuid not null default gen_random_uuid(),
    "numero" character varying(50) not null,
    "numero_control" character varying(50) not null,
    "fecha" date not null,
    "proveedor_nombre" character varying(255) not null,
    "proveedor_rif" character varying(20) not null,
    "proveedor_direccion" text not null,
    "cliente_nombre" character varying(255) not null,
    "cliente_rif" character varying(20) not null,
    "cliente_direccion" text not null,
    "sub_total" numeric(15,2) not null,
    "monto_exento" numeric(15,2) not null,
    "base_imponible" numeric(15,2) not null,
    "alicuota_iva" numeric(5,2) not null,
    "iva" numeric(15,2) not null,
    "total" numeric(15,2) not null,
    "tasa_cambio" numeric(10,2) not null,
    "monto_usd" numeric(15,2) not null,
    "porcentaje_retencion" numeric(5,2) not null,
    "retencion_iva" numeric(15,2) not null,
    "company_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."facturas" enable row level security;

create table "public"."nota_debito_notas_credito" (
    "id" uuid not null default gen_random_uuid(),
    "nota_debito_id" uuid not null,
    "nota_credito_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."nota_debito_notas_credito" enable row level security;

create table "public"."notas_credito" (
    "id" uuid not null default gen_random_uuid(),
    "numero" character varying(50) not null,
    "numero_control" character varying(50) not null,
    "fecha" date not null,
    "factura_afectada" character varying(50) not null,
    "sub_total" numeric(15,2) not null,
    "monto_exento" numeric(15,2) not null,
    "base_imponible" numeric(15,2) not null,
    "alicuota_iva" numeric(5,2) not null,
    "iva" numeric(15,2) not null,
    "total" numeric(15,2) not null,
    "tasa_cambio" numeric(10,2) not null,
    "monto_usd" numeric(15,2) not null,
    "porcentaje_retencion" numeric(5,2) not null,
    "retencion_iva" numeric(15,2) not null,
    "factura_id" uuid not null,
    "company_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."notas_credito" enable row level security;

create table "public"."notas_credito_caja" (
    "id" uuid not null default gen_random_uuid(),
    "caja_id" uuid not null,
    "numero_nota_credito" character varying(50) not null,
    "factura_afectada" character varying(50) not null,
    "monto_bs" numeric(15,2) not null,
    "nombre_cliente" character varying(255) not null,
    "explicacion" text not null,
    "fecha_hora" timestamp with time zone default CURRENT_TIMESTAMP,
    "user_id" uuid not null,
    "company_id" uuid not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP
);


alter table "public"."notas_credito_caja" enable row level security;

create table "public"."notas_debito" (
    "id" uuid not null default gen_random_uuid(),
    "numero" character varying(50) not null,
    "fecha" date not null,
    "factura_id" uuid not null,
    "tasa_cambio_original" numeric(10,2) not null,
    "tasa_cambio_pago" numeric(10,2) not null,
    "monto_usd_neto" numeric(15,2) not null,
    "diferencial_cambiario_con_iva" numeric(15,2) not null,
    "base_imponible_diferencial" numeric(15,2) not null,
    "iva_diferencial" numeric(15,2) not null,
    "retencion_iva_diferencial" numeric(15,2) not null,
    "monto_neto_pagar_nota_debito" numeric(15,2) not null,
    "monto_final_pagar" numeric(15,2) not null,
    "company_id" uuid not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."notas_debito" enable row level security;

create table "public"."pagos_movil" (
    "id" uuid not null default gen_random_uuid(),
    "caja_id" uuid not null,
    "monto" numeric(15,2) not null,
    "fecha_hora" timestamp with time zone not null default timezone('utc'::text, now()),
    "nombre_cliente" character varying(255) not null,
    "telefono" character varying(20) not null,
    "numero_referencia" character varying(50) not null,
    "user_id" uuid not null,
    "company_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."pagos_movil" enable row level security;

create table "public"."pagos_zelle" (
    "id" uuid not null default gen_random_uuid(),
    "caja_id" uuid not null,
    "monto_usd" numeric(15,2) not null,
    "tasa" numeric(10,2) not null,
    "monto_bs" numeric(15,2) not null,
    "fecha_hora" timestamp with time zone not null default timezone('utc'::text, now()),
    "nombre_cliente" character varying(255) not null,
    "telefono" character varying(20) not null,
    "user_id" uuid not null,
    "company_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."pagos_zelle" enable row level security;

create table "public"."proveedores" (
    "id" uuid not null default gen_random_uuid(),
    "nombre" character varying(255) not null,
    "rif" character varying(20) not null,
    "direccion" text not null,
    "telefono" character varying(20),
    "email" character varying(255),
    "contacto" character varying(255),
    "created_by" uuid,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_active" boolean not null default true,
    "porcentaje_retencion" numeric(5,2) default 75.00,
    "numero_cuenta" character varying(20),
    "banco_id" uuid
);


alter table "public"."proveedores" enable row level security;

create table "public"."system_logs" (
    "id" uuid not null default gen_random_uuid(),
    "action" character varying(255) not null,
    "details" jsonb,
    "user_id" uuid,
    "created_at" timestamp with time zone default now()
);


alter table "public"."system_logs" enable row level security;

create table "public"."system_settings" (
    "id" uuid not null default gen_random_uuid(),
    "key" character varying(255) not null,
    "value" jsonb not null,
    "category" character varying(100) not null,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."system_settings" enable row level security;

create table "public"."users" (
    "id" uuid not null,
    "email" character varying(255) not null,
    "full_name" character varying(255),
    "role" user_role not null default 'user'::user_role,
    "company_id" uuid,
    "permissions" text[],
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "is_active" boolean not null default true
);


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX bancos_codigo_key ON public.bancos USING btree (codigo);

CREATE UNIQUE INDEX bancos_pkey ON public.bancos USING btree (id);

CREATE UNIQUE INDEX cajas_pkey ON public.cajas USING btree (id);

CREATE UNIQUE INDEX cajas_user_id_fecha_key ON public.cajas USING btree (user_id, fecha);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX companies_rif_key ON public.companies USING btree (rif);

CREATE UNIQUE INDEX facturas_numero_company_id_key ON public.facturas USING btree (numero, company_id);

CREATE UNIQUE INDEX facturas_pkey ON public.facturas USING btree (id);

CREATE INDEX idx_bancos_codigo ON public.bancos USING btree (codigo);

CREATE INDEX idx_cajas_company_id ON public.cajas USING btree (company_id);

CREATE INDEX idx_cajas_estado ON public.cajas USING btree (estado);

CREATE INDEX idx_cajas_fecha ON public.cajas USING btree (fecha);

CREATE INDEX idx_cajas_user_id ON public.cajas USING btree (user_id);

CREATE INDEX idx_facturas_company_id ON public.facturas USING btree (company_id);

CREATE INDEX idx_facturas_numero ON public.facturas USING btree (numero);

CREATE INDEX idx_notas_credito_caja_caja_id ON public.notas_credito_caja USING btree (caja_id);

CREATE INDEX idx_notas_credito_caja_company_id ON public.notas_credito_caja USING btree (company_id);

CREATE INDEX idx_notas_credito_caja_fecha_hora ON public.notas_credito_caja USING btree (fecha_hora);

CREATE INDEX idx_notas_credito_caja_user_id ON public.notas_credito_caja USING btree (user_id);

CREATE INDEX idx_notas_credito_company_id ON public.notas_credito USING btree (company_id);

CREATE INDEX idx_notas_credito_factura_id ON public.notas_credito USING btree (factura_id);

CREATE INDEX idx_notas_debito_company_id ON public.notas_debito USING btree (company_id);

CREATE INDEX idx_notas_debito_factura_id ON public.notas_debito USING btree (factura_id);

CREATE INDEX idx_pagos_movil_caja_id ON public.pagos_movil USING btree (caja_id);

CREATE INDEX idx_pagos_movil_company_id ON public.pagos_movil USING btree (company_id);

CREATE INDEX idx_pagos_movil_fecha_hora ON public.pagos_movil USING btree (fecha_hora);

CREATE INDEX idx_pagos_zelle_caja_id ON public.pagos_zelle USING btree (caja_id);

CREATE INDEX idx_pagos_zelle_company_id ON public.pagos_zelle USING btree (company_id);

CREATE INDEX idx_pagos_zelle_fecha_hora ON public.pagos_zelle USING btree (fecha_hora);

CREATE INDEX idx_proveedores_banco_id ON public.proveedores USING btree (banco_id);

CREATE INDEX idx_proveedores_is_active ON public.proveedores USING btree (is_active);

CREATE INDEX idx_proveedores_nombre ON public.proveedores USING btree (nombre);

CREATE INDEX idx_proveedores_rif ON public.proveedores USING btree (rif);

CREATE INDEX idx_system_logs_action ON public.system_logs USING btree (action);

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at);

CREATE INDEX idx_system_settings_category ON public.system_settings USING btree (category);

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (key);

CREATE INDEX idx_users_company_id ON public.users USING btree (company_id);

CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE UNIQUE INDEX nota_debito_notas_credito_nota_debito_id_nota_credito_id_key ON public.nota_debito_notas_credito USING btree (nota_debito_id, nota_credito_id);

CREATE UNIQUE INDEX nota_debito_notas_credito_pkey ON public.nota_debito_notas_credito USING btree (id);

CREATE UNIQUE INDEX notas_credito_caja_pkey ON public.notas_credito_caja USING btree (id);

CREATE UNIQUE INDEX notas_credito_numero_company_id_key ON public.notas_credito USING btree (numero, company_id);

CREATE UNIQUE INDEX notas_credito_pkey ON public.notas_credito USING btree (id);

CREATE UNIQUE INDEX notas_debito_numero_company_id_key ON public.notas_debito USING btree (numero, company_id);

CREATE UNIQUE INDEX notas_debito_pkey ON public.notas_debito USING btree (id);

CREATE UNIQUE INDEX pagos_movil_pkey ON public.pagos_movil USING btree (id);

CREATE UNIQUE INDEX pagos_zelle_pkey ON public.pagos_zelle USING btree (id);

CREATE UNIQUE INDEX proveedores_pkey ON public.proveedores USING btree (id);

CREATE UNIQUE INDEX proveedores_rif_key ON public.proveedores USING btree (rif);

CREATE UNIQUE INDEX system_logs_pkey ON public.system_logs USING btree (id);

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);

CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."bancos" add constraint "bancos_pkey" PRIMARY KEY using index "bancos_pkey";

alter table "public"."cajas" add constraint "cajas_pkey" PRIMARY KEY using index "cajas_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."facturas" add constraint "facturas_pkey" PRIMARY KEY using index "facturas_pkey";

alter table "public"."nota_debito_notas_credito" add constraint "nota_debito_notas_credito_pkey" PRIMARY KEY using index "nota_debito_notas_credito_pkey";

alter table "public"."notas_credito" add constraint "notas_credito_pkey" PRIMARY KEY using index "notas_credito_pkey";

alter table "public"."notas_credito_caja" add constraint "notas_credito_caja_pkey" PRIMARY KEY using index "notas_credito_caja_pkey";

alter table "public"."notas_debito" add constraint "notas_debito_pkey" PRIMARY KEY using index "notas_debito_pkey";

alter table "public"."pagos_movil" add constraint "pagos_movil_pkey" PRIMARY KEY using index "pagos_movil_pkey";

alter table "public"."pagos_zelle" add constraint "pagos_zelle_pkey" PRIMARY KEY using index "pagos_zelle_pkey";

alter table "public"."proveedores" add constraint "proveedores_pkey" PRIMARY KEY using index "proveedores_pkey";

alter table "public"."system_logs" add constraint "system_logs_pkey" PRIMARY KEY using index "system_logs_pkey";

alter table "public"."system_settings" add constraint "system_settings_pkey" PRIMARY KEY using index "system_settings_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."bancos" add constraint "bancos_codigo_key" UNIQUE using index "bancos_codigo_key";

alter table "public"."cajas" add constraint "cajas_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."cajas" validate constraint "cajas_company_id_fkey";

alter table "public"."cajas" add constraint "cajas_estado_check" CHECK (((estado)::text = ANY ((ARRAY['abierta'::character varying, 'cerrada'::character varying])::text[]))) not valid;

alter table "public"."cajas" validate constraint "cajas_estado_check";

alter table "public"."cajas" add constraint "cajas_user_id_fecha_key" UNIQUE using index "cajas_user_id_fecha_key";

alter table "public"."cajas" add constraint "cajas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."cajas" validate constraint "cajas_user_id_fkey";

alter table "public"."companies" add constraint "companies_rif_key" UNIQUE using index "companies_rif_key";

alter table "public"."facturas" add constraint "facturas_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."facturas" validate constraint "facturas_company_id_fkey";

alter table "public"."facturas" add constraint "facturas_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."facturas" validate constraint "facturas_created_by_fkey";

alter table "public"."facturas" add constraint "facturas_numero_company_id_key" UNIQUE using index "facturas_numero_company_id_key";

alter table "public"."nota_debito_notas_credito" add constraint "nota_debito_notas_credito_nota_credito_id_fkey" FOREIGN KEY (nota_credito_id) REFERENCES notas_credito(id) ON DELETE CASCADE not valid;

alter table "public"."nota_debito_notas_credito" validate constraint "nota_debito_notas_credito_nota_credito_id_fkey";

alter table "public"."nota_debito_notas_credito" add constraint "nota_debito_notas_credito_nota_debito_id_fkey" FOREIGN KEY (nota_debito_id) REFERENCES notas_debito(id) ON DELETE CASCADE not valid;

alter table "public"."nota_debito_notas_credito" validate constraint "nota_debito_notas_credito_nota_debito_id_fkey";

alter table "public"."nota_debito_notas_credito" add constraint "nota_debito_notas_credito_nota_debito_id_nota_credito_id_key" UNIQUE using index "nota_debito_notas_credito_nota_debito_id_nota_credito_id_key";

alter table "public"."notas_credito" add constraint "notas_credito_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."notas_credito" validate constraint "notas_credito_company_id_fkey";

alter table "public"."notas_credito" add constraint "notas_credito_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."notas_credito" validate constraint "notas_credito_created_by_fkey";

alter table "public"."notas_credito" add constraint "notas_credito_factura_id_fkey" FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE not valid;

alter table "public"."notas_credito" validate constraint "notas_credito_factura_id_fkey";

alter table "public"."notas_credito" add constraint "notas_credito_numero_company_id_key" UNIQUE using index "notas_credito_numero_company_id_key";

alter table "public"."notas_credito_caja" add constraint "notas_credito_caja_caja_id_fkey" FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE not valid;

alter table "public"."notas_credito_caja" validate constraint "notas_credito_caja_caja_id_fkey";

alter table "public"."notas_credito_caja" add constraint "notas_credito_caja_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) not valid;

alter table "public"."notas_credito_caja" validate constraint "notas_credito_caja_company_id_fkey";

alter table "public"."notas_credito_caja" add constraint "notas_credito_caja_monto_bs_check" CHECK ((monto_bs > (0)::numeric)) not valid;

alter table "public"."notas_credito_caja" validate constraint "notas_credito_caja_monto_bs_check";

alter table "public"."notas_credito_caja" add constraint "notas_credito_caja_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."notas_credito_caja" validate constraint "notas_credito_caja_user_id_fkey";

alter table "public"."notas_debito" add constraint "notas_debito_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."notas_debito" validate constraint "notas_debito_company_id_fkey";

alter table "public"."notas_debito" add constraint "notas_debito_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."notas_debito" validate constraint "notas_debito_created_by_fkey";

alter table "public"."notas_debito" add constraint "notas_debito_factura_id_fkey" FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE not valid;

alter table "public"."notas_debito" validate constraint "notas_debito_factura_id_fkey";

alter table "public"."notas_debito" add constraint "notas_debito_numero_company_id_key" UNIQUE using index "notas_debito_numero_company_id_key";

alter table "public"."pagos_movil" add constraint "pagos_movil_caja_id_fkey" FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE not valid;

alter table "public"."pagos_movil" validate constraint "pagos_movil_caja_id_fkey";

alter table "public"."pagos_movil" add constraint "pagos_movil_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."pagos_movil" validate constraint "pagos_movil_company_id_fkey";

alter table "public"."pagos_movil" add constraint "pagos_movil_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."pagos_movil" validate constraint "pagos_movil_user_id_fkey";

alter table "public"."pagos_zelle" add constraint "pagos_zelle_caja_id_fkey" FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE not valid;

alter table "public"."pagos_zelle" validate constraint "pagos_zelle_caja_id_fkey";

alter table "public"."pagos_zelle" add constraint "pagos_zelle_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."pagos_zelle" validate constraint "pagos_zelle_company_id_fkey";

alter table "public"."pagos_zelle" add constraint "pagos_zelle_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."pagos_zelle" validate constraint "pagos_zelle_user_id_fkey";

alter table "public"."proveedores" add constraint "proveedores_banco_id_fkey" FOREIGN KEY (banco_id) REFERENCES bancos(id) not valid;

alter table "public"."proveedores" validate constraint "proveedores_banco_id_fkey";

alter table "public"."proveedores" add constraint "proveedores_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."proveedores" validate constraint "proveedores_created_by_fkey";

alter table "public"."proveedores" add constraint "proveedores_rif_key" UNIQUE using index "proveedores_rif_key";

alter table "public"."system_logs" add constraint "system_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."system_logs" validate constraint "system_logs_user_id_fkey";

alter table "public"."system_settings" add constraint "system_settings_key_key" UNIQUE using index "system_settings_key_key";

alter table "public"."users" add constraint "users_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL not valid;

alter table "public"."users" validate constraint "users_company_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."bancos" to "anon";

grant insert on table "public"."bancos" to "anon";

grant references on table "public"."bancos" to "anon";

grant select on table "public"."bancos" to "anon";

grant trigger on table "public"."bancos" to "anon";

grant truncate on table "public"."bancos" to "anon";

grant update on table "public"."bancos" to "anon";

grant delete on table "public"."bancos" to "authenticated";

grant insert on table "public"."bancos" to "authenticated";

grant references on table "public"."bancos" to "authenticated";

grant select on table "public"."bancos" to "authenticated";

grant trigger on table "public"."bancos" to "authenticated";

grant truncate on table "public"."bancos" to "authenticated";

grant update on table "public"."bancos" to "authenticated";

grant delete on table "public"."bancos" to "service_role";

grant insert on table "public"."bancos" to "service_role";

grant references on table "public"."bancos" to "service_role";

grant select on table "public"."bancos" to "service_role";

grant trigger on table "public"."bancos" to "service_role";

grant truncate on table "public"."bancos" to "service_role";

grant update on table "public"."bancos" to "service_role";

grant delete on table "public"."cajas" to "anon";

grant insert on table "public"."cajas" to "anon";

grant references on table "public"."cajas" to "anon";

grant select on table "public"."cajas" to "anon";

grant trigger on table "public"."cajas" to "anon";

grant truncate on table "public"."cajas" to "anon";

grant update on table "public"."cajas" to "anon";

grant delete on table "public"."cajas" to "authenticated";

grant insert on table "public"."cajas" to "authenticated";

grant references on table "public"."cajas" to "authenticated";

grant select on table "public"."cajas" to "authenticated";

grant trigger on table "public"."cajas" to "authenticated";

grant truncate on table "public"."cajas" to "authenticated";

grant update on table "public"."cajas" to "authenticated";

grant delete on table "public"."cajas" to "service_role";

grant insert on table "public"."cajas" to "service_role";

grant references on table "public"."cajas" to "service_role";

grant select on table "public"."cajas" to "service_role";

grant trigger on table "public"."cajas" to "service_role";

grant truncate on table "public"."cajas" to "service_role";

grant update on table "public"."cajas" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."facturas" to "anon";

grant insert on table "public"."facturas" to "anon";

grant references on table "public"."facturas" to "anon";

grant select on table "public"."facturas" to "anon";

grant trigger on table "public"."facturas" to "anon";

grant truncate on table "public"."facturas" to "anon";

grant update on table "public"."facturas" to "anon";

grant delete on table "public"."facturas" to "authenticated";

grant insert on table "public"."facturas" to "authenticated";

grant references on table "public"."facturas" to "authenticated";

grant select on table "public"."facturas" to "authenticated";

grant trigger on table "public"."facturas" to "authenticated";

grant truncate on table "public"."facturas" to "authenticated";

grant update on table "public"."facturas" to "authenticated";

grant delete on table "public"."facturas" to "service_role";

grant insert on table "public"."facturas" to "service_role";

grant references on table "public"."facturas" to "service_role";

grant select on table "public"."facturas" to "service_role";

grant trigger on table "public"."facturas" to "service_role";

grant truncate on table "public"."facturas" to "service_role";

grant update on table "public"."facturas" to "service_role";

grant delete on table "public"."nota_debito_notas_credito" to "anon";

grant insert on table "public"."nota_debito_notas_credito" to "anon";

grant references on table "public"."nota_debito_notas_credito" to "anon";

grant select on table "public"."nota_debito_notas_credito" to "anon";

grant trigger on table "public"."nota_debito_notas_credito" to "anon";

grant truncate on table "public"."nota_debito_notas_credito" to "anon";

grant update on table "public"."nota_debito_notas_credito" to "anon";

grant delete on table "public"."nota_debito_notas_credito" to "authenticated";

grant insert on table "public"."nota_debito_notas_credito" to "authenticated";

grant references on table "public"."nota_debito_notas_credito" to "authenticated";

grant select on table "public"."nota_debito_notas_credito" to "authenticated";

grant trigger on table "public"."nota_debito_notas_credito" to "authenticated";

grant truncate on table "public"."nota_debito_notas_credito" to "authenticated";

grant update on table "public"."nota_debito_notas_credito" to "authenticated";

grant delete on table "public"."nota_debito_notas_credito" to "service_role";

grant insert on table "public"."nota_debito_notas_credito" to "service_role";

grant references on table "public"."nota_debito_notas_credito" to "service_role";

grant select on table "public"."nota_debito_notas_credito" to "service_role";

grant trigger on table "public"."nota_debito_notas_credito" to "service_role";

grant truncate on table "public"."nota_debito_notas_credito" to "service_role";

grant update on table "public"."nota_debito_notas_credito" to "service_role";

grant delete on table "public"."notas_credito" to "anon";

grant insert on table "public"."notas_credito" to "anon";

grant references on table "public"."notas_credito" to "anon";

grant select on table "public"."notas_credito" to "anon";

grant trigger on table "public"."notas_credito" to "anon";

grant truncate on table "public"."notas_credito" to "anon";

grant update on table "public"."notas_credito" to "anon";

grant delete on table "public"."notas_credito" to "authenticated";

grant insert on table "public"."notas_credito" to "authenticated";

grant references on table "public"."notas_credito" to "authenticated";

grant select on table "public"."notas_credito" to "authenticated";

grant trigger on table "public"."notas_credito" to "authenticated";

grant truncate on table "public"."notas_credito" to "authenticated";

grant update on table "public"."notas_credito" to "authenticated";

grant delete on table "public"."notas_credito" to "service_role";

grant insert on table "public"."notas_credito" to "service_role";

grant references on table "public"."notas_credito" to "service_role";

grant select on table "public"."notas_credito" to "service_role";

grant trigger on table "public"."notas_credito" to "service_role";

grant truncate on table "public"."notas_credito" to "service_role";

grant update on table "public"."notas_credito" to "service_role";

grant delete on table "public"."notas_credito_caja" to "anon";

grant insert on table "public"."notas_credito_caja" to "anon";

grant references on table "public"."notas_credito_caja" to "anon";

grant select on table "public"."notas_credito_caja" to "anon";

grant trigger on table "public"."notas_credito_caja" to "anon";

grant truncate on table "public"."notas_credito_caja" to "anon";

grant update on table "public"."notas_credito_caja" to "anon";

grant delete on table "public"."notas_credito_caja" to "authenticated";

grant insert on table "public"."notas_credito_caja" to "authenticated";

grant references on table "public"."notas_credito_caja" to "authenticated";

grant select on table "public"."notas_credito_caja" to "authenticated";

grant trigger on table "public"."notas_credito_caja" to "authenticated";

grant truncate on table "public"."notas_credito_caja" to "authenticated";

grant update on table "public"."notas_credito_caja" to "authenticated";

grant delete on table "public"."notas_credito_caja" to "service_role";

grant insert on table "public"."notas_credito_caja" to "service_role";

grant references on table "public"."notas_credito_caja" to "service_role";

grant select on table "public"."notas_credito_caja" to "service_role";

grant trigger on table "public"."notas_credito_caja" to "service_role";

grant truncate on table "public"."notas_credito_caja" to "service_role";

grant update on table "public"."notas_credito_caja" to "service_role";

grant delete on table "public"."notas_debito" to "anon";

grant insert on table "public"."notas_debito" to "anon";

grant references on table "public"."notas_debito" to "anon";

grant select on table "public"."notas_debito" to "anon";

grant trigger on table "public"."notas_debito" to "anon";

grant truncate on table "public"."notas_debito" to "anon";

grant update on table "public"."notas_debito" to "anon";

grant delete on table "public"."notas_debito" to "authenticated";

grant insert on table "public"."notas_debito" to "authenticated";

grant references on table "public"."notas_debito" to "authenticated";

grant select on table "public"."notas_debito" to "authenticated";

grant trigger on table "public"."notas_debito" to "authenticated";

grant truncate on table "public"."notas_debito" to "authenticated";

grant update on table "public"."notas_debito" to "authenticated";

grant delete on table "public"."notas_debito" to "service_role";

grant insert on table "public"."notas_debito" to "service_role";

grant references on table "public"."notas_debito" to "service_role";

grant select on table "public"."notas_debito" to "service_role";

grant trigger on table "public"."notas_debito" to "service_role";

grant truncate on table "public"."notas_debito" to "service_role";

grant update on table "public"."notas_debito" to "service_role";

grant delete on table "public"."pagos_movil" to "anon";

grant insert on table "public"."pagos_movil" to "anon";

grant references on table "public"."pagos_movil" to "anon";

grant select on table "public"."pagos_movil" to "anon";

grant trigger on table "public"."pagos_movil" to "anon";

grant truncate on table "public"."pagos_movil" to "anon";

grant update on table "public"."pagos_movil" to "anon";

grant delete on table "public"."pagos_movil" to "authenticated";

grant insert on table "public"."pagos_movil" to "authenticated";

grant references on table "public"."pagos_movil" to "authenticated";

grant select on table "public"."pagos_movil" to "authenticated";

grant trigger on table "public"."pagos_movil" to "authenticated";

grant truncate on table "public"."pagos_movil" to "authenticated";

grant update on table "public"."pagos_movil" to "authenticated";

grant delete on table "public"."pagos_movil" to "service_role";

grant insert on table "public"."pagos_movil" to "service_role";

grant references on table "public"."pagos_movil" to "service_role";

grant select on table "public"."pagos_movil" to "service_role";

grant trigger on table "public"."pagos_movil" to "service_role";

grant truncate on table "public"."pagos_movil" to "service_role";

grant update on table "public"."pagos_movil" to "service_role";

grant delete on table "public"."pagos_zelle" to "anon";

grant insert on table "public"."pagos_zelle" to "anon";

grant references on table "public"."pagos_zelle" to "anon";

grant select on table "public"."pagos_zelle" to "anon";

grant trigger on table "public"."pagos_zelle" to "anon";

grant truncate on table "public"."pagos_zelle" to "anon";

grant update on table "public"."pagos_zelle" to "anon";

grant delete on table "public"."pagos_zelle" to "authenticated";

grant insert on table "public"."pagos_zelle" to "authenticated";

grant references on table "public"."pagos_zelle" to "authenticated";

grant select on table "public"."pagos_zelle" to "authenticated";

grant trigger on table "public"."pagos_zelle" to "authenticated";

grant truncate on table "public"."pagos_zelle" to "authenticated";

grant update on table "public"."pagos_zelle" to "authenticated";

grant delete on table "public"."pagos_zelle" to "service_role";

grant insert on table "public"."pagos_zelle" to "service_role";

grant references on table "public"."pagos_zelle" to "service_role";

grant select on table "public"."pagos_zelle" to "service_role";

grant trigger on table "public"."pagos_zelle" to "service_role";

grant truncate on table "public"."pagos_zelle" to "service_role";

grant update on table "public"."pagos_zelle" to "service_role";

grant delete on table "public"."proveedores" to "anon";

grant insert on table "public"."proveedores" to "anon";

grant references on table "public"."proveedores" to "anon";

grant select on table "public"."proveedores" to "anon";

grant trigger on table "public"."proveedores" to "anon";

grant truncate on table "public"."proveedores" to "anon";

grant update on table "public"."proveedores" to "anon";

grant delete on table "public"."proveedores" to "authenticated";

grant insert on table "public"."proveedores" to "authenticated";

grant references on table "public"."proveedores" to "authenticated";

grant select on table "public"."proveedores" to "authenticated";

grant trigger on table "public"."proveedores" to "authenticated";

grant truncate on table "public"."proveedores" to "authenticated";

grant update on table "public"."proveedores" to "authenticated";

grant delete on table "public"."proveedores" to "service_role";

grant insert on table "public"."proveedores" to "service_role";

grant references on table "public"."proveedores" to "service_role";

grant select on table "public"."proveedores" to "service_role";

grant trigger on table "public"."proveedores" to "service_role";

grant truncate on table "public"."proveedores" to "service_role";

grant update on table "public"."proveedores" to "service_role";

grant delete on table "public"."system_logs" to "anon";

grant insert on table "public"."system_logs" to "anon";

grant references on table "public"."system_logs" to "anon";

grant select on table "public"."system_logs" to "anon";

grant trigger on table "public"."system_logs" to "anon";

grant truncate on table "public"."system_logs" to "anon";

grant update on table "public"."system_logs" to "anon";

grant delete on table "public"."system_logs" to "authenticated";

grant insert on table "public"."system_logs" to "authenticated";

grant references on table "public"."system_logs" to "authenticated";

grant select on table "public"."system_logs" to "authenticated";

grant trigger on table "public"."system_logs" to "authenticated";

grant truncate on table "public"."system_logs" to "authenticated";

grant update on table "public"."system_logs" to "authenticated";

grant delete on table "public"."system_logs" to "service_role";

grant insert on table "public"."system_logs" to "service_role";

grant references on table "public"."system_logs" to "service_role";

grant select on table "public"."system_logs" to "service_role";

grant trigger on table "public"."system_logs" to "service_role";

grant truncate on table "public"."system_logs" to "service_role";

grant update on table "public"."system_logs" to "service_role";

grant delete on table "public"."system_settings" to "anon";

grant insert on table "public"."system_settings" to "anon";

grant references on table "public"."system_settings" to "anon";

grant select on table "public"."system_settings" to "anon";

grant trigger on table "public"."system_settings" to "anon";

grant truncate on table "public"."system_settings" to "anon";

grant update on table "public"."system_settings" to "anon";

grant delete on table "public"."system_settings" to "authenticated";

grant insert on table "public"."system_settings" to "authenticated";

grant references on table "public"."system_settings" to "authenticated";

grant select on table "public"."system_settings" to "authenticated";

grant trigger on table "public"."system_settings" to "authenticated";

grant truncate on table "public"."system_settings" to "authenticated";

grant update on table "public"."system_settings" to "authenticated";

grant delete on table "public"."system_settings" to "service_role";

grant insert on table "public"."system_settings" to "service_role";

grant references on table "public"."system_settings" to "service_role";

grant select on table "public"."system_settings" to "service_role";

grant trigger on table "public"."system_settings" to "service_role";

grant truncate on table "public"."system_settings" to "service_role";

grant update on table "public"."system_settings" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

create policy "Admin and master can manage bancos"
on "public"."bancos"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role]))))));


create policy "Users can view bancos"
on "public"."bancos"
as permissive
for select
to public
using (true);


create policy "Users can manage own cajas"
on "public"."cajas"
as permissive
for all
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])) AND (users.company_id = cajas.company_id))))))
with check (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])) AND (users.company_id = cajas.company_id))))));


create policy "Users can update own cajas"
on "public"."cajas"
as permissive
for update
to public
using (((auth.uid() = user_id) AND ((estado)::text = 'abierta'::text)));


create policy "Users can view own cajas"
on "public"."cajas"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])) AND ((users.role = 'master'::user_role) OR (users.company_id = cajas.company_id)))))));


create policy "Master users can manage companies"
on "public"."companies"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'master'::user_role)))));


create policy "Users can view company data"
on "public"."companies"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.company_id = companies.id)))));


create policy "Company users can manage facturas"
on "public"."facturas"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.company_id = facturas.company_id)))));


create policy "Company users can manage nota_debito_notas_credito"
on "public"."nota_debito_notas_credito"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM (notas_debito nd
     JOIN users u ON ((u.id = auth.uid())))
  WHERE ((nd.id = nota_debito_notas_credito.nota_debito_id) AND (u.company_id = nd.company_id)))));


create policy "Company users can manage notas_credito"
on "public"."notas_credito"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.company_id = notas_credito.company_id)))));


create policy "Usuarios pueden actualizar sus notas de crédito"
on "public"."notas_credito_caja"
as permissive
for update
to authenticated
using (((user_id = auth.uid()) AND (company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid())))));


create policy "Usuarios pueden crear notas de crédito"
on "public"."notas_credito_caja"
as permissive
for insert
to authenticated
with check (((company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid()))) AND (user_id = auth.uid())));


create policy "Usuarios pueden eliminar sus notas de crédito"
on "public"."notas_credito_caja"
as permissive
for delete
to authenticated
using (((user_id = auth.uid()) AND (company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid())))));


create policy "Usuarios pueden ver notas de crédito de su compañía"
on "public"."notas_credito_caja"
as permissive
for select
to authenticated
using ((company_id IN ( SELECT users.company_id
   FROM users
  WHERE (users.id = auth.uid()))));


create policy "Company users can manage notas_debito"
on "public"."notas_debito"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.company_id = notas_debito.company_id)))));


create policy "Users can create pagos_movil"
on "public"."pagos_movil"
as permissive
for insert
to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_movil.caja_id) AND (cajas.user_id = auth.uid()) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can delete own pagos_movil"
on "public"."pagos_movil"
as permissive
for delete
to public
using (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_movil.caja_id) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can update own pagos_movil"
on "public"."pagos_movil"
as permissive
for update
to public
using (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_movil.caja_id) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can view pagos_movil"
on "public"."pagos_movil"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])) AND ((users.role = 'master'::user_role) OR (users.company_id = pagos_movil.company_id)))))));


create policy "Users can create pagos_zelle"
on "public"."pagos_zelle"
as permissive
for insert
to public
with check (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_zelle.caja_id) AND (cajas.user_id = auth.uid()) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can delete own pagos_zelle"
on "public"."pagos_zelle"
as permissive
for delete
to public
using (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_zelle.caja_id) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can update own pagos_zelle"
on "public"."pagos_zelle"
as permissive
for update
to public
using (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM cajas
  WHERE ((cajas.id = pagos_zelle.caja_id) AND ((cajas.estado)::text = 'abierta'::text))))));


create policy "Users can view pagos_zelle"
on "public"."pagos_zelle"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])) AND ((users.role = 'master'::user_role) OR (users.company_id = pagos_zelle.company_id)))))));


create policy "Admin and master can manage proveedores"
on "public"."proveedores"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role]))))));


create policy "Authenticated users can create proveedores"
on "public"."proveedores"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can view active proveedores"
on "public"."proveedores"
as permissive
for select
to public
using (((auth.role() = 'authenticated'::text) AND (is_active = true)));


create policy "Only master users can delete proveedores"
on "public"."proveedores"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'master'::user_role)))));


create policy "Users can update own proveedores or admin/master"
on "public"."proveedores"
as permissive
for update
to public
using (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = ANY (ARRAY['master'::user_role, 'admin'::user_role])))))));


create policy "Users can view proveedores"
on "public"."proveedores"
as permissive
for select
to public
using (true);


create policy "All users can insert logs"
on "public"."system_logs"
as permissive
for insert
to public
with check (true);


create policy "Master users can view logs"
on "public"."system_logs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'master'::user_role)))));


create policy "Master users can manage settings"
on "public"."system_settings"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'master'::user_role)))));


create policy "Users can update own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id));


create policy "Users can view own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


CREATE TRIGGER update_bancos_updated_at BEFORE UPDATE ON public.bancos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cajas_updated_at BEFORE UPDATE ON public.cajas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON public.facturas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_credito_updated_at BEFORE UPDATE ON public.notas_credito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_credito_caja_updated_at BEFORE UPDATE ON public.notas_credito_caja FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notas_debito_updated_at BEFORE UPDATE ON public.notas_debito FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_movil_updated_at BEFORE UPDATE ON public.pagos_movil FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pagos_zelle_updated_at BEFORE UPDATE ON public.pagos_zelle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proveedores_updated_at BEFORE UPDATE ON public.proveedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


