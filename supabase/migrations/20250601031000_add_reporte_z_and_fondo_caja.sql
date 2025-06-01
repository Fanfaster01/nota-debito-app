-- Agregar campos adicionales para el cierre de caja
ALTER TABLE "public"."cierres_caja" 
ADD COLUMN "reporte_z" numeric(15,2) DEFAULT 0,
ADD COLUMN "fondo_caja_dolares" numeric(15,2) DEFAULT 0,
ADD COLUMN "fondo_caja_bs" numeric(15,2) DEFAULT 0;