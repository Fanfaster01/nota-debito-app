// src/lib/validators.ts
import { z } from 'zod';

export const facturaSchema = z.object({
  numero: z.string().min(1, "El número de factura es requerido"),
  numeroControl: z.string().min(1, "El número de control es requerido"),
  fecha: z.date({
    required_error: "La fecha es requerida",
    invalid_type_error: "La fecha debe tener un formato válido",
  }),
  proveedor: z.object({
    nombre: z.string().min(1, "El nombre del proveedor es requerido"),
    rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, "Formato de RIF inválido (J-XXXXXXXX-X)"),
    direccion: z.string().min(1, "La dirección del proveedor es requerida"),
  }),
  cliente: z.object({
    nombre: z.string().min(1, "El nombre del cliente es requerido"),
    rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, "Formato de RIF inválido (J-XXXXXXXX-X)"),
    direccion: z.string().min(1, "La dirección del cliente es requerida"),
  }),
  subTotal: z.number().nonnegative("El subtotal debe ser un valor positivo o cero"),
  montoExento: z.number().nonnegative("El monto exento debe ser un valor positivo o cero"),
  baseImponible: z.number().nonnegative("La base imponible debe ser un valor positivo o cero"),
  alicuotaIVA: z.number().min(0).max(100, "La alícuota debe estar entre 0 y 100"),
  iva: z.number().nonnegative("El IVA debe ser un valor positivo o cero"),
  total: z.number().positive("El total debe ser mayor a cero"),
  tasaCambio: z.number().positive("La tasa de cambio debe ser mayor a cero"),
  montoUSD: z.number().positive("El monto en USD debe ser mayor a cero"),
  porcentajeRetencion: z.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
  retencionIVA: z.number().nonnegative("La retención de IVA debe ser un valor positivo o cero"),
}).refine((data) => data.subTotal === data.baseImponible + data.montoExento, {
  message: "El subtotal debe ser igual a la suma de la base imponible y el monto exento",
  path: ["subTotal"],
}).refine((data) => data.total === data.subTotal + data.iva, {
  message: "El total debe ser igual a la suma del subtotal y el IVA",
  path: ["total"],
});

export const notaCreditoSchema = z.object({
  numero: z.string().min(1, "El número de nota de crédito es requerido"),
  numeroControl: z.string().min(1, "El número de control es requerido"),
  fecha: z.date({
    required_error: "La fecha es requerida",
    invalid_type_error: "La fecha debe tener un formato válido",
  }),
  facturaAfectada: z.string().min(1, "Debe indicar la factura afectada"),
  subTotal: z.number().nonnegative("El subtotal debe ser un valor positivo o cero"),
  montoExento: z.number().nonnegative("El monto exento debe ser un valor positivo o cero"),
  baseImponible: z.number().nonnegative("La base imponible debe ser un valor positivo o cero"),
  alicuotaIVA: z.number().min(0).max(100, "La alícuota debe estar entre 0 y 100"),
  iva: z.number().nonnegative("El IVA debe ser un valor positivo o cero"),
  total: z.number().positive("El total debe ser mayor a cero"),
  tasaCambio: z.number().positive("La tasa de cambio debe ser mayor a cero"),
  montoUSD: z.number().positive("El monto en USD debe ser mayor a cero"),
  porcentajeRetencion: z.number().min(0).max(100, "El porcentaje debe estar entre 0 y 100"),
  retencionIVA: z.number().nonnegative("La retención de IVA debe ser un valor positivo o cero"),
}).refine((data) => data.subTotal === data.baseImponible + data.montoExento, {
  message: "El subtotal debe ser igual a la suma de la base imponible y el monto exento",
  path: ["subTotal"],
}).refine((data) => data.total === data.subTotal + data.iva, {
  message: "El total debe ser igual a la suma del subtotal y el IVA",
  path: ["total"],
});

export const notaDebitoSchema = z.object({
  tasaCambioPago: z.number().positive("La tasa de cambio de pago debe ser mayor a cero"),
  fecha: z.date({
    required_error: "La fecha es requerida",
    invalid_type_error: "La fecha debe tener un formato válido",
  }),
});