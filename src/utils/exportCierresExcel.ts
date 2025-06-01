// src/utils/exportCierresExcel.ts
import * as XLSX from 'xlsx'
import { CierreDetalladoUI, FiltrosCierres, ResumenCierres } from '@/lib/services/cierresCajaService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const exportCierresListToExcel = (
  cierres: CierreDetalladoUI[], 
  filtros?: FiltrosCierres, 
  nombreArchivo?: string
) => {
  // Preparar datos para la hoja principal
  const datosHojaPrincipal = cierres.map(cierre => ({
    'Fecha': format(cierre.caja.fecha, 'dd/MM/yyyy'),
    'Cajero': cierre.caja.usuario?.full_name || 'Sin nombre',
    'Compañía': cierre.caja.company?.name || 'N/A',
    'Hora Apertura': format(cierre.caja.horaApertura, 'HH:mm'),
    'Hora Cierre': cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'HH:mm') : 'N/A',
    'Tasa del Día': formatMoney(cierre.caja.tasaDia),
    'Monto Apertura Bs': formatMoney(cierre.caja.montoApertura),
    'Monto Apertura USD': formatMoney(cierre.caja.montoAperturaUsd),
    'Total Pagos Móvil': formatMoney(cierre.caja.totalPagosMovil),
    'Cantidad Pagos Móvil': cierre.caja.cantidadPagosMovil,
    'Total Zelle Bs': formatMoney(cierre.caja.totalZelleBs),
    'Total Zelle USD': formatMoney(cierre.caja.totalZelleUsd),
    'Cantidad Zelle': cierre.caja.cantidadZelle,
    'Total Notas Crédito': formatMoney(cierre.caja.totalNotasCredito),
    'Cantidad Notas Crédito': cierre.caja.cantidadNotasCredito,
    'Total Créditos Bs': formatMoney(cierre.caja.totalCreditosBs),
    'Total Créditos USD': formatMoney(cierre.caja.totalCreditosUsd),
    'Cantidad Créditos': cierre.caja.cantidadCreditos,
    'Total Sistema': formatMoney(cierre.resumen.totalSistemico),
    'Total Efectivo Contado': formatMoney(cierre.resumen.totalEfectivoContado),
    'Total Punto de Venta': formatMoney(cierre.resumen.totalPuntoVenta),
    'Discrepancia Total': formatMoney(cierre.resumen.discrepanciaTotal),
    'Report Z': cierre.detallesEfectivo?.reporte_z ? formatMoney(cierre.detallesEfectivo.reporte_z) : 'N/A',
    'Discrepancia Report Z': formatMoney(cierre.resumen.discrepanciaReporteZ),
    'Estado': Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? 'Cuadrado' : 'Con Discrepancia',
    'Observaciones': cierre.caja.observaciones || ''
  }))

  // Crear workbook
  const workbook = XLSX.utils.book_new()

  // Hoja principal con resumen de cierres
  const worksheetPrincipal = XLSX.utils.json_to_sheet(datosHojaPrincipal)
  XLSX.utils.book_append_sheet(workbook, worksheetPrincipal, 'Resumen Cierres')

  // Hoja de detalles de efectivo
  const datosEfectivo = cierres
    .filter(cierre => cierre.detallesEfectivo)
    .map(cierre => ({
      'Fecha': format(cierre.caja.fecha, 'dd/MM/yyyy'),
      'Cajero': cierre.caja.usuario?.full_name || 'Sin nombre',
      'Efectivo USD': formatMoney(cierre.detallesEfectivo!.efectivo_dolares || 0),
      'Efectivo EUR': formatMoney(cierre.detallesEfectivo!.efectivo_euros || 0),
      'Efectivo Bs': formatMoney(cierre.detallesEfectivo!.efectivo_bs || 0),
      'Fondo Caja USD': formatMoney(cierre.detallesEfectivo!.fondo_caja_dolares || 0),
      'Fondo Caja Bs': formatMoney(cierre.detallesEfectivo!.fondo_caja_bs || 0),
      'Report Z': formatMoney(cierre.detallesEfectivo!.reporte_z || 0),
      'Total Efectivo Bs': formatMoney(cierre.resumen.totalEfectivoContado)
    }))

  if (datosEfectivo.length > 0) {
    const worksheetEfectivo = XLSX.utils.json_to_sheet(datosEfectivo)
    XLSX.utils.book_append_sheet(workbook, worksheetEfectivo, 'Detalles Efectivo')
  }

  // Hoja de punto de venta
  const datosPuntoVenta: any[] = []
  cierres.forEach(cierre => {
    cierre.detallesPuntoVenta.forEach(pv => {
      datosPuntoVenta.push({
        'Fecha': format(cierre.caja.fecha, 'dd/MM/yyyy'),
        'Cajero': cierre.caja.usuario?.full_name || 'Sin nombre',
        'Banco': pv.banco.nombre,
        'Código Banco': pv.banco.codigo,
        'Monto USD': formatMoney(pv.monto_usd),
        'Monto Bs': formatMoney(pv.monto_bs),
        'Número Lote': pv.numero_lote || 'N/A'
      })
    })
  })

  if (datosPuntoVenta.length > 0) {
    const worksheetPuntoVenta = XLSX.utils.json_to_sheet(datosPuntoVenta)
    XLSX.utils.book_append_sheet(workbook, worksheetPuntoVenta, 'Punto de Venta')
  }

  // Hoja de filtros aplicados
  const infoFiltros = [
    ['Filtros Aplicados', ''],
    ['Fecha Desde', filtros?.fechaDesde ? format(filtros.fechaDesde, 'dd/MM/yyyy') : 'No aplicado'],
    ['Fecha Hasta', filtros?.fechaHasta ? format(filtros.fechaHasta, 'dd/MM/yyyy') : 'No aplicado'],
    ['Solo Discrepancias', filtros?.conDiscrepancias ? 'Sí' : 'No'],
    ['Monto Mínimo', filtros?.rangoMonto?.min ? formatMoney(filtros.rangoMonto.min) : 'No aplicado'],
    ['Monto Máximo', filtros?.rangoMonto?.max ? formatMoney(filtros.rangoMonto.max) : 'No aplicado'],
    ['', ''],
    ['Estadísticas', ''],
    ['Total Cierres', cierres.length.toString()],
    ['Cierres con Discrepancia', cierres.filter(c => Math.abs(c.resumen.discrepanciaTotal) >= 1).length.toString()],
    ['Fecha de Generación', format(new Date(), 'dd/MM/yyyy HH:mm')]
  ]

  const worksheetFiltros = XLSX.utils.aoa_to_sheet(infoFiltros)
  XLSX.utils.book_append_sheet(workbook, worksheetFiltros, 'Información')

  // Generar y descargar archivo
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `cierres_caja_${timestamp}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportResumenCierresToExcel = (
  resumen: ResumenCierres,
  nombreArchivo?: string
) => {
  const workbook = XLSX.utils.book_new()

  // Hoja de resumen general
  const datosResumen = [
    ['Resumen General de Cierres', ''],
    ['Total de Cierres', resumen.totalCierres.toString()],
    ['Cierres con Discrepancias', resumen.cierresConDiscrepancias.toString()],
    ['% Cierres con Discrepancias', `${((resumen.cierresConDiscrepancias / resumen.totalCierres) * 100).toFixed(1)}%`],
    ['Promedio de Discrepancia', formatMoney(resumen.promedioDiscrepancia)],
    ['', ''],
    ['Totales Monetarios', ''],
    ['Total Efectivo Contado', formatMoney(resumen.totalEfectivoContado)],
    ['Total Sistema', formatMoney(resumen.totalSistemico)],
    ['Total Punto de Venta', formatMoney(resumen.totalPuntoVenta)],
    ['Monto Total de Cierres', formatMoney(resumen.montoTotalCierres)],
    ['', ''],
    ['Fecha de Generación', format(new Date(), 'dd/MM/yyyy HH:mm')]
  ]

  const worksheetResumen = XLSX.utils.aoa_to_sheet(datosResumen)
  XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen General')

  // Hoja de usuarios más activos
  if (resumen.usuariosMasActivos.length > 0) {
    const datosUsuarios = resumen.usuariosMasActivos.map(usuario => ({
      'Nombre': usuario.nombreUsuario,
      'Cantidad de Cierres': usuario.cantidadCierres,
      'Promedio Discrepancia': formatMoney(usuario.promedioDiscrepancia),
      'Eficiencia': usuario.promedioDiscrepancia < 10 ? 'Excelente' : 
                   usuario.promedioDiscrepancia < 50 ? 'Buena' : 'Requiere Mejora'
    }))

    const worksheetUsuarios = XLSX.utils.json_to_sheet(datosUsuarios)
    XLSX.utils.book_append_sheet(workbook, worksheetUsuarios, 'Usuarios Activos')
  }

  // Generar y descargar archivo
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `resumen_cierres_${timestamp}.xlsx`
  XLSX.writeFile(workbook, fileName)
}

export const exportCierreDetalladoToExcel = (
  cierre: CierreDetalladoUI,
  nombreArchivo?: string
) => {
  const workbook = XLSX.utils.book_new()

  // Información general
  const infoGeneral = [
    ['Detalle de Cierre de Caja', ''],
    ['Fecha', format(cierre.caja.fecha, 'dd/MM/yyyy')],
    ['Cajero', cierre.caja.usuario?.full_name || 'Sin nombre'],
    ['Compañía', cierre.caja.company?.name || 'N/A'],
    ['Hora Apertura', format(cierre.caja.horaApertura, 'HH:mm')],
    ['Hora Cierre', cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'HH:mm') : 'N/A'],
    ['Tasa del Día', formatMoney(cierre.caja.tasaDia)],
    ['', ''],
    ['Resumen Financiero', ''],
    ['Total Sistema', formatMoney(cierre.resumen.totalSistemico)],
    ['Total Efectivo Contado', formatMoney(cierre.resumen.totalEfectivoContado)],
    ['Total Punto de Venta', formatMoney(cierre.resumen.totalPuntoVenta)],
    ['Total Contado', formatMoney(cierre.resumen.totalEfectivoContado + cierre.resumen.totalPuntoVenta)],
    ['Discrepancia Total', formatMoney(cierre.resumen.discrepanciaTotal)],
    ['Discrepancia Report Z', formatMoney(cierre.resumen.discrepanciaReporteZ)],
    ['Estado', Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? 'Cuadrado' : 'Con Discrepancia']
  ]

  const worksheetGeneral = XLSX.utils.aoa_to_sheet(infoGeneral)
  XLSX.utils.book_append_sheet(workbook, worksheetGeneral, 'Información General')

  // Desglose de transacciones
  const transacciones = [
    ['Tipo de Transacción', 'Cantidad', 'Monto (Bs)', 'Monto (USD)'],
    ['Pagos Móvil', cierre.caja.cantidadPagosMovil, formatMoney(cierre.caja.totalPagosMovil), ''],
    ['Zelle', cierre.caja.cantidadZelle, formatMoney(cierre.caja.totalZelleBs), formatMoney(cierre.caja.totalZelleUsd)],
    ['Notas de Crédito', cierre.caja.cantidadNotasCredito, formatMoney(cierre.caja.totalNotasCredito), ''],
    ['Créditos', cierre.caja.cantidadCreditos, formatMoney(cierre.caja.totalCreditosBs), formatMoney(cierre.caja.totalCreditosUsd)],
    ['TOTAL', '', formatMoney(cierre.resumen.totalSistemico), formatMoney(cierre.caja.totalZelleUsd + cierre.caja.totalCreditosUsd)]
  ]

  const worksheetTransacciones = XLSX.utils.aoa_to_sheet(transacciones)
  XLSX.utils.book_append_sheet(workbook, worksheetTransacciones, 'Transacciones')

  // Detalles de efectivo si existen
  if (cierre.detallesEfectivo) {
    const efectivo = [
      ['Tipo de Efectivo', 'Cantidad', 'Equivalente en Bs'],
      ['Dólares', formatMoney(cierre.detallesEfectivo.efectivo_dolares || 0), formatMoney((cierre.detallesEfectivo.efectivo_dolares || 0) * cierre.caja.tasaDia)],
      ['Euros', formatMoney(cierre.detallesEfectivo.efectivo_euros || 0), formatMoney((cierre.detallesEfectivo.efectivo_euros || 0) * cierre.caja.tasaDia * 1.1)],
      ['Bolívares', formatMoney(cierre.detallesEfectivo.efectivo_bs || 0), formatMoney(cierre.detallesEfectivo.efectivo_bs || 0)],
      ['', '', ''],
      ['Fondo Caja USD', formatMoney(cierre.detallesEfectivo.fondo_caja_dolares || 0), ''],
      ['Fondo Caja Bs', formatMoney(cierre.detallesEfectivo.fondo_caja_bs || 0), ''],
      ['', '', ''],
      ['Report Z', formatMoney(cierre.detallesEfectivo.reporte_z || 0), ''],
      ['TOTAL EFECTIVO', '', formatMoney(cierre.resumen.totalEfectivoContado)]
    ]

    const worksheetEfectivo = XLSX.utils.aoa_to_sheet(efectivo)
    XLSX.utils.book_append_sheet(workbook, worksheetEfectivo, 'Efectivo')
  }

  // Punto de venta si existen
  if (cierre.detallesPuntoVenta.length > 0) {
    const puntoVenta = [
      ['Banco', 'Código', 'Monto USD', 'Monto Bs', 'Número Lote'],
      ...cierre.detallesPuntoVenta.map(pv => [
        pv.banco.nombre,
        pv.banco.codigo,
        formatMoney(pv.monto_usd),
        formatMoney(pv.monto_bs),
        pv.numero_lote || 'N/A'
      ]),
      ['TOTAL', '', '', formatMoney(cierre.resumen.totalPuntoVenta), '']
    ]

    const worksheetPV = XLSX.utils.aoa_to_sheet(puntoVenta)
    XLSX.utils.book_append_sheet(workbook, worksheetPV, 'Punto de Venta')
  }

  // Generar y descargar archivo
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fechaCierre = format(cierre.caja.fecha, 'yyyyMMdd')
  const fileName = nombreArchivo || `cierre_detallado_${fechaCierre}_${timestamp}.xlsx`
  XLSX.writeFile(workbook, fileName)
}