// src/lib/calculations.ts
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

// Calcular el total de todas las notas de crédito
export const calcularTotalNotasCredito = (notasCredito: NotaCredito[]): {
  totalUSD: number;
  totalRetencionIVA: number;
  totalPagar: number;
} => {
  return notasCredito.reduce((acum, nota) => {
    const montoUSD = nota.montoUSD || nota.total / nota.tasaCambio;
    return {
      totalUSD: acum.totalUSD + montoUSD,
      totalRetencionIVA: acum.totalRetencionIVA + nota.retencionIVA,
      totalPagar: acum.totalPagar + (nota.total - nota.retencionIVA),
    };
  }, { totalUSD: 0, totalRetencionIVA: 0, totalPagar: 0 });
};

export const calcularNotaDebito = (
  factura: Factura,
  notasCredito: NotaCredito[],
  tasaCambioPago: number
): NotaDebito => {
  // Calcular monto neto en USD después de restar todas las notas de crédito
  const montoUSDFactura = factura.montoUSD || factura.total / factura.tasaCambio;
  
  // Sumar todos los montos en USD de las notas de crédito
  const totalNotasCredito = calcularTotalNotasCredito(notasCredito);
  const montoUSDTotalNotasCredito = totalNotasCredito.totalUSD;
  
  // Asegurarse de que las notas de crédito no excedan el monto de la factura
  const montoUSDNeto = Math.max(0, montoUSDFactura - montoUSDTotalNotasCredito);

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
    notasCredito: notasCredito.length > 0 ? notasCredito : undefined,
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
  notasCredito: NotaCredito[],
  notaDebito: NotaDebito
): number => {
  // Monto a pagar de la factura después de retención
  const montoPagarFactura = factura.total - factura.retencionIVA;
  
  // Monto a restar por todas las notas de crédito después de retención
  const montoRestarNotasCredito = notasCredito.reduce((total, nc) => {
    return total + (nc.total - nc.retencionIVA);
  }, 0);
  
  // Monto adicional por diferencial cambiario después de retención
  const montoAdicionalDiferencial = notaDebito.montoNetoPagarNotaDebito;
  
  // Monto total final a pagar
  return montoPagarFactura - montoRestarNotasCredito + montoAdicionalDiferencial;
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

// Verifica si el total de las notas de crédito excede el monto de la factura
export const verificarLimiteNotasCredito = (
  factura: Factura,
  notasCredito: NotaCredito[]
): { excedeLimite: boolean; montoDisponibleUSD: number } => {
  const montoUSDFactura = factura.montoUSD || factura.total / factura.tasaCambio;
  const totalUSDNotasCredito = notasCredito.reduce((total, nc) => {
    return total + (nc.montoUSD || nc.total / nc.tasaCambio);
  }, 0);
  
  const montoDisponibleUSD = montoUSDFactura - totalUSDNotasCredito;
  
  return {
    excedeLimite: totalUSDNotasCredito > montoUSDFactura,
    montoDisponibleUSD: Math.max(0, montoDisponibleUSD)
  };
};