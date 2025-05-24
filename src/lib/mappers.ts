// src/lib/mappers.ts
import { Factura, NotaCredito, NotaDebito } from '@/types'
import { FacturaDB, NotaCreditoDB, NotaDebitoDB, TablesInsert } from '@/types/database'

// Mapear de Factura UI a FacturaDB
export const mapFacturaToDB = (
  factura: Factura, 
  companyId: string, 
  userId: string
): TablesInsert<'facturas'> => {
  return {
    numero: factura.numero,
    numero_control: factura.numeroControl,
    fecha: factura.fecha.toISOString().split('T')[0], // Convertir Date a string YYYY-MM-DD
    proveedor_nombre: factura.proveedor.nombre,
    proveedor_rif: factura.proveedor.rif,
    proveedor_direccion: factura.proveedor.direccion,
    cliente_nombre: factura.cliente.nombre,
    cliente_rif: factura.cliente.rif,
    cliente_direccion: factura.cliente.direccion,
    sub_total: factura.subTotal,
    monto_exento: factura.montoExento,
    base_imponible: factura.baseImponible,
    alicuota_iva: factura.alicuotaIVA,
    iva: factura.iva,
    total: factura.total,
    tasa_cambio: factura.tasaCambio,
    monto_usd: factura.montoUSD,
    porcentaje_retencion: factura.porcentajeRetencion,
    retencion_iva: factura.retencionIVA,
    company_id: companyId,
    created_by: userId
  }
}

// Mapear de FacturaDB a Factura UI
export const mapFacturaFromDB = (facturaDB: FacturaDB): Factura => {
  return {
    numero: facturaDB.numero,
    numeroControl: facturaDB.numero_control,
    fecha: new Date(facturaDB.fecha),
    proveedor: {
      nombre: facturaDB.proveedor_nombre,
      rif: facturaDB.proveedor_rif,
      direccion: facturaDB.proveedor_direccion,
    },
    cliente: {
      nombre: facturaDB.cliente_nombre,
      rif: facturaDB.cliente_rif,
      direccion: facturaDB.cliente_direccion,
    },
    subTotal: facturaDB.sub_total,
    montoExento: facturaDB.monto_exento,
    baseImponible: facturaDB.base_imponible,
    alicuotaIVA: facturaDB.alicuota_iva,
    iva: facturaDB.iva,
    total: facturaDB.total,
    tasaCambio: facturaDB.tasa_cambio,
    montoUSD: facturaDB.monto_usd,
    porcentajeRetencion: facturaDB.porcentaje_retencion,
    retencionIVA: facturaDB.retencion_iva,
  }
}

// Mapear de NotaCredito UI a NotaCreditoDB
export const mapNotaCreditoToDB = (
  notaCredito: NotaCredito, 
  facturaId: string,
  companyId: string, 
  userId: string
): TablesInsert<'notas_credito'> => {
  return {
    numero: notaCredito.numero,
    numero_control: notaCredito.numeroControl,
    fecha: notaCredito.fecha.toISOString().split('T')[0],
    factura_afectada: notaCredito.facturaAfectada,
    sub_total: notaCredito.subTotal,
    monto_exento: notaCredito.montoExento,
    base_imponible: notaCredito.baseImponible,
    alicuota_iva: notaCredito.alicuotaIVA,
    iva: notaCredito.iva,
    total: notaCredito.total,
    tasa_cambio: notaCredito.tasaCambio,
    monto_usd: notaCredito.montoUSD,
    porcentaje_retencion: notaCredito.porcentajeRetencion,
    retencion_iva: notaCredito.retencionIVA,
    factura_id: facturaId,
    company_id: companyId,
    created_by: userId
  }
}

// Mapear de NotaCreditoDB a NotaCredito UI
export const mapNotaCreditoFromDB = (notaCreditoDB: NotaCreditoDB): NotaCredito => {
  return {
    numero: notaCreditoDB.numero,
    numeroControl: notaCreditoDB.numero_control,
    fecha: new Date(notaCreditoDB.fecha),
    facturaAfectada: notaCreditoDB.factura_afectada,
    subTotal: notaCreditoDB.sub_total,
    montoExento: notaCreditoDB.monto_exento,
    baseImponible: notaCreditoDB.base_imponible,
    alicuotaIVA: notaCreditoDB.alicuota_iva,
    iva: notaCreditoDB.iva,
    total: notaCreditoDB.total,
    tasaCambio: notaCreditoDB.tasa_cambio,
    montoUSD: notaCreditoDB.monto_usd,
    porcentajeRetencion: notaCreditoDB.porcentaje_retencion,
    retencionIVA: notaCreditoDB.retencion_iva,
  }
}

// Mapear de NotaDebito UI a NotaDebitoDB
export const mapNotaDebitoToDB = (
  notaDebito: NotaDebito,
  facturaId: string,
  companyId: string,
  userId: string
): TablesInsert<'notas_debito'> => {
  return {
    numero: notaDebito.numero,
    fecha: notaDebito.fecha.toISOString().split('T')[0],
    factura_id: facturaId,
    tasa_cambio_original: notaDebito.tasaCambioOriginal,
    tasa_cambio_pago: notaDebito.tasaCambioPago,
    monto_usd_neto: notaDebito.montoUSDNeto,
    diferencial_cambiario_con_iva: notaDebito.diferencialCambiarioConIVA,
    base_imponible_diferencial: notaDebito.baseImponibleDiferencial,
    iva_diferencial: notaDebito.ivaDiferencial,
    retencion_iva_diferencial: notaDebito.retencionIVADiferencial,
    monto_neto_pagar_nota_debito: notaDebito.montoNetoPagarNotaDebito,
    monto_final_pagar: 0, // Se calculará en el servidor
    company_id: companyId,
    created_by: userId
  }
}

// Mapear de NotaDebitoDB a NotaDebito UI (con datos de factura y notas de crédito)
export const mapNotaDebitoFromDB = (
  notaDebitoDB: NotaDebitoDB,
  factura: Factura,
  notasCredito?: NotaCredito[]
): NotaDebito => {
  return {
    numero: notaDebitoDB.numero,
    fecha: new Date(notaDebitoDB.fecha),
    factura: factura,
    notasCredito: notasCredito,
    tasaCambioOriginal: notaDebitoDB.tasa_cambio_original,
    tasaCambioPago: notaDebitoDB.tasa_cambio_pago,
    montoUSDNeto: notaDebitoDB.monto_usd_neto,
    diferencialCambiarioConIVA: notaDebitoDB.diferencial_cambiario_con_iva,
    baseImponibleDiferencial: notaDebitoDB.base_imponible_diferencial,
    ivaDiferencial: notaDebitoDB.iva_diferencial,
    retencionIVADiferencial: notaDebitoDB.retencion_iva_diferencial,
    montoNetoPagarNotaDebito: notaDebitoDB.monto_neto_pagar_nota_debito,
  }
}