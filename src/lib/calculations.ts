// src/lib/calculations.ts (corregido)
import { Factura, NotaCredito, NotaDebito } from '../types';

export const calcularSubTotal = (baseImponible: number, montoExento: number): number => {
  return baseImponible + montoExento;
};

export const calcularIVA = (baseImponible: number, alicuotaIVA: number = 16): number => {
  return baseImponible * (alicuotaIVA / 100);
};

export const calcularTotal = (subTotal: number, iva: number): number => {
  return subTotal + iva;
};

export const calcularRetencionIVA = (iva: number, porcentajeRetencion: number): number => {
  return iva * (porcentajeRetencion / 100);
};

export const calcularMontoUSD = (montoBolivares: number, tasaCambio: number): number => {
  return montoBolivares / tasaCambio;
};

// Calcula el diferencial cambiario bruto (con IVA incluido)
export const calcularDiferencialCambiario = (
  montoUSD: number,
  tasaCambioOriginal: number,
  tasaCambioPago: number
): number => {
  const montoBolivaresOriginal = montoUSD * tasaCambioOriginal;
  const montoBolivaresPago = montoUSD * tasaCambioPago;
  return montoBolivaresPago - montoBolivaresOriginal;
};

// Extrae la base imponible de un monto que incluye IVA
export const extraerBaseImponible = (montoConIVA: number, alicuotaIVA: number = 16): number => {
  return montoConIVA / (1 + alicuotaIVA / 100);
};

// Calcula el IVA de un monto que ya incluye IVA
export const extraerIVA = (montoConIVA: number, alicuotaIVA: number = 16): number => {
  const baseImponible = extraerBaseImponible(montoConIVA, alicuotaIVA);
  return montoConIVA - baseImponible;
};

export const calcularNotaDebito = (
  factura: Factura,
  notaCredito: NotaCredito | null,
  tasaCambioPago: number
): NotaDebito => {
  // Calcular monto neto en USD después de la nota de crédito (ya incluye IVA)
  const montoUSDFactura = factura.montoUSD || factura.total / factura.tasaCambio;
  const montoUSDNotaCredito = notaCredito 
    ? (notaCredito.montoUSD || notaCredito.total / notaCredito.tasaCambio) 
    : 0;
  const montoUSDNeto = montoUSDFactura - montoUSDNotaCredito;

  // Calcular montos en bolívares a las diferentes tasas (ya incluyen IVA)
  const montoBolivaresOriginal = montoUSDNeto * factura.tasaCambio;
  const montoBolivaresPago = montoUSDNeto * tasaCambioPago;

  // Calcular diferencial cambiario (incluye IVA)
  const diferencialCambiarioConIVA = montoBolivaresPago - montoBolivaresOriginal;
  
  // Extraer la base imponible y el IVA del diferencial cambiario
  const baseImponibleDiferencial = extraerBaseImponible(diferencialCambiarioConIVA, factura.alicuotaIVA);
  const ivaDiferencial = diferencialCambiarioConIVA - baseImponibleDiferencial;
  
  // Calcular retención de IVA sobre el diferencial cambiario
  const retencionIVADiferencial = calcularRetencionIVA(ivaDiferencial, factura.porcentajeRetencion);

  // Monto neto a pagar por la nota de débito (después de retención)
  const montoNetoPagarNotaDebito = diferencialCambiarioConIVA - retencionIVADiferencial;

  return {
    numero: '',
    fecha: new Date(),
    factura,
    notaCredito: notaCredito || undefined,
    tasaCambioOriginal: factura.tasaCambio,
    tasaCambioPago,
    montoUSDNeto,
    diferencialCambiarioConIVA,
    baseImponibleDiferencial,
    ivaDiferencial,
    retencionIVADiferencial,
    montoNetoPagarNotaDebito
  };
};

export const calcularMontoFinalPagar = (
  factura: Factura,
  notaCredito: NotaCredito | null,
  notaDebito: NotaDebito
): number => {
  // Monto a pagar de la factura después de retención
  const montoPagarFactura = factura.total - factura.retencionIVA;
  
  // Monto a restar por nota de crédito después de retención
  const montoRestarNotaCredito = notaCredito 
    ? notaCredito.total - notaCredito.retencionIVA 
    : 0;
  
  // Monto adicional por diferencial cambiario después de retención
  const montoAdicionalDiferencial = notaDebito.montoNetoPagarNotaDebito;
  
  // Monto total final a pagar
  return montoPagarFactura - montoRestarNotaCredito + montoAdicionalDiferencial;
};

// Funciones auxiliares para formularios

// Recalcular automáticamente los campos dependientes en la factura
export const recalcularFactura = (values: Partial<Factura>): Partial<Factura> => {
  const baseImponible = values.baseImponible || 0;
  const montoExento = values.montoExento || 0;
  const alicuotaIVA = values.alicuotaIVA || 16;
  const porcentajeRetencion = values.porcentajeRetencion || 75;
  
  const subTotal = baseImponible + montoExento;
  const iva = calcularIVA(baseImponible, alicuotaIVA);
  const total = subTotal + iva;
  const retencionIVA = calcularRetencionIVA(iva, porcentajeRetencion);
  
  const tasaCambio = values.tasaCambio || 0;
  const montoUSD = tasaCambio > 0 ? calcularMontoUSD(total, tasaCambio) : 0;
  
  return {
    ...values,
    subTotal,
    iva,
    total,
    retencionIVA,
    montoUSD
  };
};

// Recalcular automáticamente los campos dependientes en la nota de crédito
export const recalcularNotaCredito = (values: Partial<NotaCredito>): Partial<NotaCredito> => {
  const baseImponible = values.baseImponible || 0;
  const montoExento = values.montoExento || 0;
  const alicuotaIVA = values.alicuotaIVA || 16;
  const porcentajeRetencion = values.porcentajeRetencion || 75;
  
  const subTotal = baseImponible + montoExento;
  const iva = calcularIVA(baseImponible, alicuotaIVA);
  const total = subTotal + iva;
  const retencionIVA = calcularRetencionIVA(iva, porcentajeRetencion);
  
  const tasaCambio = values.tasaCambio || 0;
  const montoUSD = tasaCambio > 0 ? calcularMontoUSD(total, tasaCambio) : 0;
  
  return {
    ...values,
    subTotal,
    iva,
    total,
    retencionIVA,
    montoUSD
  };
};