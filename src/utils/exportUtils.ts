// Utilidades para exportación de archivos en diferentes formatos
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import type { 
  FacturaCuentaPorPagar, 
  ReciboPago, 
  NotaDebitoGenerada,
  MetricasCuentasPorPagar 
} from '@/types/cuentasPorPagar'

/**
 * Exportar facturas a Excel
 */
export async function exportarFacturasExcel(
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'facturas-cuentas-por-pagar'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  
  // Configurar propiedades del workbook
  workbook.creator = 'Sistema de Cuentas por Pagar'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja 1: Facturas principales
  const wsFacturas = workbook.addWorksheet('Facturas', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  // Definir columnas
  wsFacturas.columns = [
    { header: 'Número de Factura', key: 'numero', width: 20 },
    { header: 'Número de Control', key: 'numeroControl', width: 20 },
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'RIF', key: 'rif', width: 15 },
    { header: 'Dirección', key: 'direccion', width: 40 },
    { header: 'Subtotal (Bs)', key: 'subTotal', width: 15 },
    { header: 'Monto Exento (Bs)', key: 'montoExento', width: 15 },
    { header: 'Base Imponible (Bs)', key: 'baseImponible', width: 15 },
    { header: 'IVA (%)', key: 'alicuotaIVA', width: 10 },
    { header: 'IVA (Bs)', key: 'iva', width: 15 },
    { header: 'Total (Bs)', key: 'total', width: 15 },
    { header: 'Tasa Cambio', key: 'tasaCambio', width: 15 },
    { header: 'Monto USD', key: 'montoUSD', width: 15 },
    { header: 'Retención (%)', key: 'porcentajeRetencion', width: 12 },
    { header: 'Retención IVA (Bs)', key: 'retencionIVA', width: 15 },
    { header: 'Estado Pago', key: 'estadoPago', width: 15 },
    { header: 'Tipo Pago', key: 'tipoPago', width: 15 },
    { header: 'Fecha Pago', key: 'fechaPago', width: 15 },
    { header: 'Días Vencimiento', key: 'diasVencimiento', width: 15 },
    { header: 'Monto Final a Pagar (Bs)', key: 'montoFinalPagar', width: 20 },
    { header: 'Notas de Pago', key: 'notasPago', width: 30 }
  ]

  // Agregar datos
  facturas.forEach(factura => {
    wsFacturas.addRow({
      numero: factura.numero,
      numeroControl: factura.numeroControl,
      fecha: new Date(factura.fecha).toLocaleDateString('es-VE'),
      fechaVencimiento: factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-VE') : '',
      proveedor: factura.proveedorNombre,
      rif: factura.proveedorRif,
      direccion: factura.proveedorDireccion,
      subTotal: factura.subTotal,
      montoExento: factura.montoExento,
      baseImponible: factura.baseImponible,
      alicuotaIVA: factura.alicuotaIVA,
      iva: factura.iva,
      total: factura.total,
      tasaCambio: factura.tasaCambio,
      montoUSD: factura.montoUSD,
      porcentajeRetencion: factura.porcentajeRetencion,
      retencionIVA: factura.retencionIVA,
      estadoPago: factura.estadoPago,
      tipoPago: factura.tipoPago,
      fechaPago: factura.fechaPago ? new Date(factura.fechaPago).toLocaleDateString('es-VE') : '',
      diasVencimiento: factura.diasVencimiento !== undefined ? factura.diasVencimiento : '',
      montoFinalPagar: factura.montoFinalPagar || factura.total,
      notasPago: factura.notasPago || ''
    })
  })

  // Aplicar estilos a la primera fila
  wsFacturas.getRow(1).font = { bold: true }
  wsFacturas.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Hoja 2: Resumen por proveedor
  const wsResumen = workbook.addWorksheet('Resumen por Proveedor', {
    properties: { tabColor: { argb: '00CC66' } }
  })

  const proveedoresMap = new Map<string, {
    nombre: string
    rif: string
    totalFacturas: number
    montoTotal: number
    facturasPendientes: number
    montoPendiente: number
    facturasVencidas: number
    montoVencido: number
  }>()

  facturas.forEach(factura => {
    const key = factura.proveedorRif
    if (!proveedoresMap.has(key)) {
      proveedoresMap.set(key, {
        nombre: factura.proveedorNombre,
        rif: factura.proveedorRif,
        totalFacturas: 0,
        montoTotal: 0,
        facturasPendientes: 0,
        montoPendiente: 0,
        facturasVencidas: 0,
        montoVencido: 0
      })
    }

    const proveedor = proveedoresMap.get(key)!
    const monto = factura.montoFinalPagar || factura.total

    proveedor.totalFacturas++
    proveedor.montoTotal += monto

    if (factura.estadoPago === 'pendiente' || factura.estadoPago === 'vencida') {
      proveedor.facturasPendientes++
      proveedor.montoPendiente += monto
    }

    if (factura.estadoPago === 'vencida') {
      proveedor.facturasVencidas++
      proveedor.montoVencido += monto
    }
  })

  wsResumen.columns = [
    { header: 'Proveedor', key: 'nombre', width: 30 },
    { header: 'RIF', key: 'rif', width: 15 },
    { header: 'Total Facturas', key: 'totalFacturas', width: 15 },
    { header: 'Monto Total (Bs)', key: 'montoTotal', width: 20 },
    { header: 'Facturas Pendientes', key: 'facturasPendientes', width: 20 },
    { header: 'Monto Pendiente (Bs)', key: 'montoPendiente', width: 20 },
    { header: 'Facturas Vencidas', key: 'facturasVencidas', width: 18 },
    { header: 'Monto Vencido (Bs)', key: 'montoVencido', width: 20 }
  ]

  Array.from(proveedoresMap.values()).forEach(proveedor => {
    wsResumen.addRow(proveedor)
  })

  wsResumen.getRow(1).font = { bold: true }
  wsResumen.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Hoja 3: Vencimientos
  const wsVencimientos = workbook.addWorksheet('Vencimientos', {
    properties: { tabColor: { argb: 'CC0066' } }
  })

  const hoy = new Date()
  const vencimientosData = facturas
    .filter(f => f.fechaVencimiento && (f.estadoPago === 'pendiente' || f.estadoPago === 'vencida'))
    .map(factura => {
      const fechaVencimiento = new Date(factura.fechaVencimiento!)
      const diasDiferencia = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      
      let estadoVencimiento = ''
      if (diasDiferencia < 0) {
        estadoVencimiento = `Vencida (${Math.abs(diasDiferencia)} días)`
      } else if (diasDiferencia === 0) {
        estadoVencimiento = 'Vence hoy'
      } else if (diasDiferencia <= 7) {
        estadoVencimiento = `Por vencer (${diasDiferencia} días)`
      } else {
        estadoVencimiento = `Vigente (${diasDiferencia} días)`
      }

      return {
        factura: factura.numero,
        proveedor: factura.proveedorNombre,
        fechaVencimiento: fechaVencimiento.toLocaleDateString('es-VE'),
        diasHastaVencimiento: diasDiferencia,
        estadoVencimiento: estadoVencimiento,
        monto: factura.montoFinalPagar || factura.total,
        estadoPago: factura.estadoPago
      }
    })
    .sort((a, b) => a.diasHastaVencimiento - b.diasHastaVencimiento)

  wsVencimientos.columns = [
    { header: 'Factura', key: 'factura', width: 20 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'Días hasta Vencimiento', key: 'diasHastaVencimiento', width: 20 },
    { header: 'Estado Vencimiento', key: 'estadoVencimiento', width: 25 },
    { header: 'Monto (Bs)', key: 'monto', width: 20 },
    { header: 'Estado Pago', key: 'estadoPago', width: 15 }
  ]

  vencimientosData.forEach(data => {
    wsVencimientos.addRow(data)
  })

  wsVencimientos.getRow(1).font = { bold: true }
  wsVencimientos.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const fechaHoy = new Date().toISOString().split('T')[0]
  saveAs(new Blob([buffer]), `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar recibos de pago a Excel
 */
export async function exportarRecibosExcel(
  recibos: ReciboPago[],
  nombreArchivo: string = 'recibos-pago'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cuentas por Pagar'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Recibos de Pago', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  worksheet.columns = [
    { header: 'Número Recibo', key: 'numeroRecibo', width: 20 },
    { header: 'Fecha', key: 'fecha', width: 15 },
    { header: 'Tipo Recibo', key: 'tipoRecibo', width: 15 },
    { header: 'Tipo Pago', key: 'tipoPago', width: 15 },
    { header: 'Cantidad Facturas', key: 'cantidadFacturas', width: 18 },
    { header: 'Monto Total Bs', key: 'montoTotalBs', width: 20 },
    { header: 'Monto Total USD', key: 'montoTotalUsd', width: 20 },
    { header: 'Banco Destino', key: 'bancoDestino', width: 25 },
    { header: 'Archivo TXT Generado', key: 'archivoTxt', width: 20 },
    { header: 'Notas', key: 'notas', width: 40 }
  ]

  recibos.forEach(recibo => {
    worksheet.addRow({
      numeroRecibo: recibo.numeroRecibo,
      fecha: new Date(recibo.createdAt).toLocaleDateString('es-VE'),
      tipoRecibo: recibo.tipoRecibo,
      tipoPago: recibo.tipoPago,
      cantidadFacturas: Array.isArray(recibo.facturasIds) ? recibo.facturasIds.length : 0,
      montoTotalBs: recibo.montoTotalBs,
      montoTotalUsd: recibo.montoTotalUsd || 0,
      bancoDestino: recibo.bancoDestino || '',
      archivoTxt: recibo.archivoTxtGenerado ? 'Sí' : 'No',
      notas: recibo.notas || ''
    })
  })

  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fechaHoy = new Date().toISOString().split('T')[0]
  saveAs(new Blob([buffer]), `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar métricas de cuentas por pagar a Excel
 */
export async function exportarMetricasExcel(
  metricas: MetricasCuentasPorPagar,
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'metricas-cuentas-por-pagar'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cuentas por Pagar'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja 1: Métricas generales
  const wsMetricas = workbook.addWorksheet('Métricas Generales', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  wsMetricas.columns = [
    { header: 'Métrica', key: 'metrica', width: 35 },
    { header: 'Valor', key: 'valor', width: 25 }
  ]

  const metricasRows = [
    { metrica: 'Total de Facturas', valor: metricas.totalFacturas },
    { metrica: 'Total Monto Pendiente (Bs)', valor: metricas.totalMontoPendiente },
    { metrica: 'Facturas Vencidas', valor: metricas.facturasVencidas },
    { metrica: 'Monto Vencido (Bs)', valor: metricas.montoVencido },
    { metrica: 'Facturas por Vencer (7 días)', valor: metricas.facturasPorVencer },
    { metrica: 'Monto por Vencer (Bs)', valor: metricas.montoPorVencer },
    { metrica: 'Facturas Pagadas', valor: metricas.facturasPagadas },
    { metrica: 'Monto Pagado (Bs)', valor: metricas.montoPagado },
    { metrica: 'Facturas Pendientes Aprobación', valor: metricas.facturasPendientesAprobacion },
    { metrica: 'Monto Pendiente Aprobación (Bs)', valor: metricas.montoPendienteAprobacion }
  ]

  metricasRows.forEach(row => {
    wsMetricas.addRow(row)
  })

  wsMetricas.getRow(1).font = { bold: true }
  wsMetricas.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Hoja 2: Distribución por estado
  const wsEstados = workbook.addWorksheet('Distribución por Estado', {
    properties: { tabColor: { argb: '00CC66' } }
  })

  const estadosMap = new Map<string, { cantidad: number; monto: number }>()
  
  facturas.forEach(factura => {
    const estado = factura.estadoPago
    if (!estadosMap.has(estado)) {
      estadosMap.set(estado, { cantidad: 0, monto: 0 })
    }
    const data = estadosMap.get(estado)!
    data.cantidad++
    data.monto += factura.montoFinalPagar || factura.total
  })

  wsEstados.columns = [
    { header: 'Estado', key: 'estado', width: 20 },
    { header: 'Cantidad', key: 'cantidad', width: 15 },
    { header: 'Monto (Bs)', key: 'monto', width: 20 },
    { header: 'Porcentaje', key: 'porcentaje', width: 15 }
  ]

  Array.from(estadosMap.entries()).forEach(([estado, data]) => {
    wsEstados.addRow({
      estado: estado.replace('_', ' '),
      cantidad: data.cantidad,
      monto: data.monto,
      porcentaje: ((data.cantidad / metricas.totalFacturas) * 100).toFixed(2) + '%'
    })
  })

  wsEstados.getRow(1).font = { bold: true }
  wsEstados.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Hoja 3: Top proveedores
  const wsProveedores = workbook.addWorksheet('Top Proveedores Deuda', {
    properties: { tabColor: { argb: 'CC0066' } }
  })

  const proveedoresMap = new Map<string, { nombre: string; cantidad: number; monto: number }>()
  
  facturas
    .filter(f => f.estadoPago === 'pendiente' || f.estadoPago === 'vencida')
    .forEach(factura => {
      const key = factura.proveedorRif
      if (!proveedoresMap.has(key)) {
        proveedoresMap.set(key, { 
          nombre: factura.proveedorNombre, 
          cantidad: 0, 
          monto: 0 
        })
      }
      const data = proveedoresMap.get(key)!
      data.cantidad++
      data.monto += factura.montoFinalPagar || factura.total
    })

  wsProveedores.columns = [
    { header: 'Ranking', key: 'ranking', width: 10 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'Cantidad Facturas', key: 'cantidadFacturas', width: 18 },
    { header: 'Monto Pendiente (Bs)', key: 'montoPendiente', width: 25 }
  ]

  Array.from(proveedoresMap.values())
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 20) // Top 20
    .forEach((proveedor, index) => {
      wsProveedores.addRow({
        ranking: index + 1,
        proveedor: proveedor.nombre,
        cantidadFacturas: proveedor.cantidad,
        montoPendiente: proveedor.monto
      })
    })

  wsProveedores.getRow(1).font = { bold: true }
  wsProveedores.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fechaHoy = new Date().toISOString().split('T')[0]
  saveAs(new Blob([buffer]), `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar datos para análisis en CSV
 */
export async function exportarFacturasCSV(
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'facturas-analisis'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Facturas')

  worksheet.columns = [
    { header: 'numero', key: 'numero', width: 20 },
    { header: 'fecha', key: 'fecha', width: 15 },
    { header: 'fechaVencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'proveedorNombre', key: 'proveedorNombre', width: 30 },
    { header: 'proveedorRif', key: 'proveedorRif', width: 15 },
    { header: 'total', key: 'total', width: 20 },
    { header: 'montoUSD', key: 'montoUSD', width: 20 },
    { header: 'estadoPago', key: 'estadoPago', width: 15 },
    { header: 'tipoPago', key: 'tipoPago', width: 15 },
    { header: 'diasVencimiento', key: 'diasVencimiento', width: 15 },
    { header: 'montoFinalPagar', key: 'montoFinalPagar', width: 20 }
  ]

  facturas.forEach(factura => {
    worksheet.addRow({
      numero: factura.numero,
      fecha: factura.fecha,
      fechaVencimiento: factura.fechaVencimiento || '',
      proveedorNombre: factura.proveedorNombre,
      proveedorRif: factura.proveedorRif,
      total: factura.total,
      montoUSD: factura.montoUSD,
      estadoPago: factura.estadoPago,
      tipoPago: factura.tipoPago,
      diasVencimiento: factura.diasVencimiento || 0,
      montoFinalPagar: factura.montoFinalPagar || factura.total
    })
  })

  const buffer = await workbook.csv.writeBuffer()
  const fechaHoy = new Date().toISOString().split('T')[0]
  saveAs(new Blob([buffer]), `${nombreArchivo}-${fechaHoy}.csv`)
}

/**
 * Generar reporte de vencimientos próximos
 */
export async function generarReporteVencimientos(
  facturas: FacturaCuentaPorPagar[],
  diasAdelante: number = 30,
  nombreArchivo: string = 'reporte-vencimientos'
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cuentas por Pagar'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Vencimientos', {
    properties: { tabColor: { argb: 'CC0066' } }
  })

  const hoy = new Date()
  const fechaLimite = new Date()
  fechaLimite.setDate(hoy.getDate() + diasAdelante)

  const facturasVencimiento = facturas
    .filter(f => {
      if (!f.fechaVencimiento || f.estadoPago === 'pagada') return false
      const fechaVenc = new Date(f.fechaVencimiento)
      return fechaVenc <= fechaLimite
    })
    .map(factura => {
      const fechaVenc = new Date(factura.fechaVencimiento!)
      const diasHastaVenc = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        factura: factura.numero,
        proveedor: factura.proveedorNombre,
        rif: factura.proveedorRif,
        fechaVencimiento: fechaVenc.toLocaleDateString('es-VE'),
        diasHastaVencimiento: diasHastaVenc,
        estado: diasHastaVenc < 0 ? 'VENCIDA' : diasHastaVenc === 0 ? 'VENCE HOY' : 'POR VENCER',
        monto: factura.montoFinalPagar || factura.total,
        estadoPago: factura.estadoPago,
        contacto: '', // Se podría obtener del proveedor
        telefono: '' // Se podría obtener del proveedor
      }
    })
    .sort((a, b) => a.diasHastaVencimiento - b.diasHastaVencimiento)

  worksheet.columns = [
    { header: 'Factura', key: 'factura', width: 20 },
    { header: 'Proveedor', key: 'proveedor', width: 30 },
    { header: 'RIF', key: 'rif', width: 15 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'Días hasta Vencimiento', key: 'diasHastaVencimiento', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Monto (Bs)', key: 'monto', width: 20 },
    { header: 'Estado Pago', key: 'estadoPago', width: 15 },
    { header: 'Contacto', key: 'contacto', width: 25 },
    { header: 'Teléfono', key: 'telefono', width: 15 }
  ]

  facturasVencimiento.forEach(data => {
    worksheet.addRow(data)
  })

  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const fechaHoy = new Date().toISOString().split('T')[0]
  saveAs(new Blob([buffer]), `${nombreArchivo}-${diasAdelante}dias-${fechaHoy}.xlsx`)
}

/**
 * Utilidad genérica para descargar cualquier contenido como archivo
 */
export function descargarArchivo(
  contenido: string,
  nombreArchivo: string,
  tipoMime: string = 'text/plain'
): void {
  const blob = new Blob([contenido], { type: tipoMime })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = nombreArchivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  window.URL.revokeObjectURL(url)
}

/**
 * Formatear números para Excel
 */
export function formatearNumeroExcel(numero: number): string {
  return numero.toFixed(2)
}

/**
 * Formatear fechas para Excel
 */
export function formatearFechaExcel(fecha: string | Date): string {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha
  return fechaObj.toLocaleDateString('es-VE')
}