// src/lib/calculations.ts (modificado)
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

export const calcularDiferencialCambiario = (
  montoUSD: number,
  tasaCambioOriginal: number,
  tasaCambioPago: number
): number => {
  const montoBolivaresOriginal = montoUSD * tasaCambioOriginal;
  const montoBolivaresPago = montoUSD * tasaCambioPago;
  return montoBolivaresPago - montoBolivaresOriginal;
};

export const calcularNotaDebito = (
  factura: Factura,
  notaCredito: NotaCredito | null,
  tasaCambioPago: number
): NotaDebito => {
  // Calcular monto neto en USD después de la nota de crédito
  const montoUSDFactura = factura.montoUSD || factura.total / factura.tasaCambio;
  const montoUSDNotaCredito = notaCredito 
    ? (notaCredito.montoUSD || notaCredito.total / notaCredito.tasaCambio) 
    : 0;
  const montoUSDNeto = montoUSDFactura - montoUSDNotaCredito;

  // Calcular montos en bolívares a las diferentes tasas
  const montoBolivaresOriginal = montoUSDNeto * factura.tasaCambio;
  const montoBolivaresPago = montoUSDNeto * tasaCambioPago;

  // Calcular diferencial cambiario (base imponible)
  const diferencialCambiario = montoBolivaresPago - montoBolivaresOriginal;
  
  // Calcular IVA sobre diferencial (usando la misma alícuota de la factura)
  const ivaDisferencialCambiario = calcularIVA(diferencialCambiario, factura.alicuotaIVA);
  
  // Calcular total nota de débito
  const totalNotaDebito = diferencialCambiario + ivaDisferencialCambiario;

  // Calcular retención de IVA sobre el diferencial cambiario
  const retencionIVADiferencial = calcularRetencionIVA(ivaDisferencialCambiario, factura.porcentajeRetencion);

  return {
    numero: '',
    fecha: new Date(),
    factura,
    notaCredito: notaCredito || undefined,
    tasaCambioOriginal: factura.tasaCambio,
    tasaCambioPago,
    montoUSDNeto,
    diferencialCambiario,
    ivaDisferencialCambiario,
    totalNotaDebito,
    retencionIVADiferencial,
    montoNetoPagarNotaDebito: totalNotaDebito - retencionIVADiferencial
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
  const montoAdicionalDiferencial = notaDebito.montoNetoPagarNotaDebito || 
    (notaDebito.totalNotaDebito - (notaDebito.retencionIVADiferencial || 0));
  
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