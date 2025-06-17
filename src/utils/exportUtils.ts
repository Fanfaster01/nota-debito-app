// Utilidades para exportación de archivos en diferentes formatos
import * as XLSX from 'xlsx'
import type { 
  FacturaCuentaPorPagar, 
  ReciboPago, 
  NotaDebitoGenerada,
  MetricasCuentasPorPagar 
} from '@/types/cuentasPorPagar'

/**
 * Exportar facturas a Excel
 */
export function exportarFacturasExcel(
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'facturas-cuentas-por-pagar'
): void {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Facturas principales
  const facturasData = facturas.map(factura => ({
    'Número de Factura': factura.numero,
    'Número de Control': factura.numeroControl,
    'Fecha': new Date(factura.fecha).toLocaleDateString('es-VE'),
    'Fecha Vencimiento': factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-VE') : '',
    'Proveedor': factura.proveedorNombre,
    'RIF': factura.proveedorRif,
    'Dirección': factura.proveedorDireccion,
    'Subtotal (Bs)': factura.subTotal,
    'Monto Exento (Bs)': factura.montoExento,
    'Base Imponible (Bs)': factura.baseImponible,
    'IVA (%)': factura.alicuotaIVA,
    'IVA (Bs)': factura.iva,
    'Total (Bs)': factura.total,
    'Tasa Cambio': factura.tasaCambio,
    'Monto USD': factura.montoUSD,
    'Retención (%)': factura.porcentajeRetencion,
    'Retención IVA (Bs)': factura.retencionIVA,
    'Estado Pago': factura.estadoPago,
    'Tipo Pago': factura.tipoPago,
    'Fecha Pago': factura.fechaPago ? new Date(factura.fechaPago).toLocaleDateString('es-VE') : '',
    'Días Vencimiento': factura.diasVencimiento !== undefined ? factura.diasVencimiento : '',
    'Monto Final a Pagar (Bs)': factura.montoFinalPagar || factura.total,
    'Notas de Pago': factura.notasPago || ''
  }))

  const wsFacturas = XLSX.utils.json_to_sheet(facturasData)
  XLSX.utils.book_append_sheet(workbook, wsFacturas, 'Facturas')

  // Hoja 2: Resumen por proveedor
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

  const resumenData = Array.from(proveedoresMap.values()).map(proveedor => ({
    'Proveedor': proveedor.nombre,
    'RIF': proveedor.rif,
    'Total Facturas': proveedor.totalFacturas,
    'Monto Total (Bs)': proveedor.montoTotal,
    'Facturas Pendientes': proveedor.facturasPendientes,
    'Monto Pendiente (Bs)': proveedor.montoPendiente,
    'Facturas Vencidas': proveedor.facturasVencidas,
    'Monto Vencido (Bs)': proveedor.montoVencido
  }))

  const wsResumen = XLSX.utils.json_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen por Proveedor')

  // Hoja 3: Vencimientos
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
        'Factura': factura.numero,
        'Proveedor': factura.proveedorNombre,
        'Fecha Vencimiento': fechaVencimiento.toLocaleDateString('es-VE'),
        'Días hasta Vencimiento': diasDiferencia,
        'Estado Vencimiento': estadoVencimiento,
        'Monto (Bs)': factura.montoFinalPagar || factura.total,
        'Estado Pago': factura.estadoPago
      }
    })
    .sort((a, b) => a['Días hasta Vencimiento'] - b['Días hasta Vencimiento'])

  const wsVencimientos = XLSX.utils.json_to_sheet(vencimientosData)
  XLSX.utils.book_append_sheet(workbook, wsVencimientos, 'Vencimientos')

  // Descargar archivo
  const fechaHoy = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar recibos de pago a Excel
 */
export function exportarRecibosExcel(
  recibos: ReciboPago[],
  nombreArchivo: string = 'recibos-pago'
): void {
  const workbook = XLSX.utils.book_new()

  const recibosData = recibos.map(recibo => ({
    'Número Recibo': recibo.numeroRecibo,
    'Fecha': new Date(recibo.createdAt).toLocaleDateString('es-VE'),
    'Tipo Recibo': recibo.tipoRecibo,
    'Tipo Pago': recibo.tipoPago,
    'Cantidad Facturas': Array.isArray(recibo.facturasIds) ? recibo.facturasIds.length : 0,
    'Monto Total Bs': recibo.montoTotalBs,
    'Monto Total USD': recibo.montoTotalUsd || 0,
    'Banco Destino': recibo.bancoDestino || '',
    'Archivo TXT Generado': recibo.archivoTxtGenerado ? 'Sí' : 'No',
    'Notas': recibo.notas || ''
  }))

  const wsRecibos = XLSX.utils.json_to_sheet(recibosData)
  XLSX.utils.book_append_sheet(workbook, wsRecibos, 'Recibos de Pago')

  const fechaHoy = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar métricas de cuentas por pagar a Excel
 */
export function exportarMetricasExcel(
  metricas: MetricasCuentasPorPagar,
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'metricas-cuentas-por-pagar'
): void {
  const workbook = XLSX.utils.book_new()

  // Hoja 1: Métricas generales
  const metricasData = [
    ['Métrica', 'Valor'],
    ['Total de Facturas', metricas.totalFacturas],
    ['Total Monto Pendiente (Bs)', metricas.totalMontoPendiente],
    ['Facturas Vencidas', metricas.facturasVencidas],
    ['Monto Vencido (Bs)', metricas.montoVencido],
    ['Facturas por Vencer (7 días)', metricas.facturasPorVencer],
    ['Monto por Vencer (Bs)', metricas.montoPorVencer],
    ['Facturas Pagadas', metricas.facturasPagadas],
    ['Monto Pagado (Bs)', metricas.montoPagado],
    ['Facturas Pendientes Aprobación', metricas.facturasPendientesAprobacion],
    ['Monto Pendiente Aprobación (Bs)', metricas.montoPendienteAprobacion]
  ]

  const wsMetricas = XLSX.utils.json_to_sheet(metricasData, { skipHeader: true })
  XLSX.utils.book_append_sheet(workbook, wsMetricas, 'Métricas Generales')

  // Hoja 2: Distribución por estado
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

  const estadosData = Array.from(estadosMap.entries()).map(([estado, data]) => ({
    'Estado': estado.replace('_', ' '),
    'Cantidad': data.cantidad,
    'Monto (Bs)': data.monto,
    'Porcentaje': ((data.cantidad / metricas.totalFacturas) * 100).toFixed(2) + '%'
  }))

  const wsEstados = XLSX.utils.json_to_sheet(estadosData)
  XLSX.utils.book_append_sheet(workbook, wsEstados, 'Distribución por Estado')

  // Hoja 3: Top proveedores
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

  const proveedoresData = Array.from(proveedoresMap.values())
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 20) // Top 20
    .map((proveedor, index) => ({
      'Ranking': index + 1,
      'Proveedor': proveedor.nombre,
      'Cantidad Facturas': proveedor.cantidad,
      'Monto Pendiente (Bs)': proveedor.monto
    }))

  const wsProveedores = XLSX.utils.json_to_sheet(proveedoresData)
  XLSX.utils.book_append_sheet(workbook, wsProveedores, 'Top Proveedores Deuda')

  const fechaHoy = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${nombreArchivo}-${fechaHoy}.xlsx`)
}

/**
 * Exportar datos para análisis en CSV
 */
export function exportarFacturasCSV(
  facturas: FacturaCuentaPorPagar[],
  nombreArchivo: string = 'facturas-analisis'
): void {
  const csvData = facturas.map(factura => ({
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
  }))

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(csvData)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas')

  const fechaHoy = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${nombreArchivo}-${fechaHoy}.csv`, { bookType: 'csv' })
}

/**
 * Generar reporte de vencimientos próximos
 */
export function generarReporteVencimientos(
  facturas: FacturaCuentaPorPagar[],
  diasAdelante: number = 30,
  nombreArchivo: string = 'reporte-vencimientos'
): void {
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
        'Factura': factura.numero,
        'Proveedor': factura.proveedorNombre,
        'RIF': factura.proveedorRif,
        'Fecha Vencimiento': fechaVenc.toLocaleDateString('es-VE'),
        'Días hasta Vencimiento': diasHastaVenc,
        'Estado': diasHastaVenc < 0 ? 'VENCIDA' : diasHastaVenc === 0 ? 'VENCE HOY' : 'POR VENCER',
        'Monto (Bs)': factura.montoFinalPagar || factura.total,
        'Estado Pago': factura.estadoPago,
        'Contacto': '', // Se podría obtener del proveedor
        'Teléfono': '' // Se podría obtener del proveedor
      }
    })
    .sort((a, b) => a['Días hasta Vencimiento'] - b['Días hasta Vencimiento'])

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(facturasVencimiento)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vencimientos')

  const fechaHoy = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${nombreArchivo}-${diasAdelante}dias-${fechaHoy}.xlsx`)
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