alter table "public"."cajas" drop constraint "cajas_estado_check";

alter table "public"."cajas" add constraint "cajas_estado_check" CHECK (((estado)::text = ANY ((ARRAY['abierta'::character varying, 'cerrada'::character varying])::text[]))) not valid;

alter table "public"."cajas" validate constraint "cajas_estado_check";


