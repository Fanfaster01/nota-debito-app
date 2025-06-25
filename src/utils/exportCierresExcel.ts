// src/utils/exportCierresExcel.ts
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { CierreDetalladoUI, FiltrosCierres, ResumenCierres } from '@/lib/services/cierresCajaService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const exportCierresListToExcel = async (
  cierres: CierreDetalladoUI[], 
  filtros?: FiltrosCierres, 
  nombreArchivo?: string
) => {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cierres de Caja'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja principal con resumen de cierres
  const worksheetPrincipal = workbook.addWorksheet('Resumen Cierres', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  worksheetPrincipal.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Cajero', key: 'cajero', width: 25 },
    { header: 'Compañía', key: 'compania', width: 20 },
    { header: 'Hora Apertura', key: 'horaApertura', width: 12 },
    { header: 'Hora Cierre', key: 'horaCierre', width: 12 },
    { header: 'Tasa del Día', key: 'tasaDia', width: 12 },
    { header: 'Monto Apertura Bs', key: 'montoAperturaBs', width: 18 },
    { header: 'Monto Apertura USD', key: 'montoAperturaUsd', width: 18 },
    { header: 'Total Pagos Móvil', key: 'totalPagosMovil', width: 18 },
    { header: 'Cantidad Pagos Móvil', key: 'cantidadPagosMovil', width: 18 },
    { header: 'Total Zelle Bs', key: 'totalZelleBs', width: 15 },
    { header: 'Total Zelle USD', key: 'totalZelleUsd', width: 15 },
    { header: 'Cantidad Zelle', key: 'cantidadZelle', width: 15 },
    { header: 'Total Notas Crédito', key: 'totalNotasCredito', width: 18 },
    { header: 'Cantidad Notas Crédito', key: 'cantidadNotasCredito', width: 20 },
    { header: 'Total Créditos Bs', key: 'totalCreditosBs', width: 18 },
    { header: 'Total Créditos USD', key: 'totalCreditosUsd', width: 18 },
    { header: 'Cantidad Créditos', key: 'cantidadCreditos', width: 18 },
    { header: 'Total Sistema', key: 'totalSistema', width: 15 },
    { header: 'Total Efectivo Contado', key: 'totalEfectivoContado', width: 20 },
    { header: 'Total Punto de Venta', key: 'totalPuntoVenta', width: 18 },
    { header: 'Discrepancia Total', key: 'discrepanciaTotal', width: 18 },
    { header: 'Report Z', key: 'reportZ', width: 12 },
    { header: 'Discrepancia Report Z', key: 'discrepanciaReportZ', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Observaciones', key: 'observaciones', width: 30 }
  ]

  cierres.forEach(cierre => {
    worksheetPrincipal.addRow({
      fecha: format(cierre.caja.fecha, 'dd/MM/yyyy'),
      cajero: cierre.caja.usuario?.full_name || 'Sin nombre',
      compania: cierre.caja.company?.name || 'N/A',
      horaApertura: format(cierre.caja.horaApertura, 'HH:mm'),
      horaCierre: cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'HH:mm') : 'N/A',
      tasaDia: formatMoney(cierre.caja.tasaDia),
      montoAperturaBs: formatMoney(cierre.caja.montoApertura),
      montoAperturaUsd: formatMoney(cierre.caja.montoAperturaUsd),
      totalPagosMovil: formatMoney(cierre.caja.totalPagosMovil),
      cantidadPagosMovil: cierre.caja.cantidadPagosMovil,
      totalZelleBs: formatMoney(cierre.caja.totalZelleBs),
      totalZelleUsd: formatMoney(cierre.caja.totalZelleUsd),
      cantidadZelle: cierre.caja.cantidadZelle,
      totalNotasCredito: formatMoney(cierre.caja.totalNotasCredito),
      cantidadNotasCredito: cierre.caja.cantidadNotasCredito,
      totalCreditosBs: formatMoney(cierre.caja.totalCreditosBs),
      totalCreditosUsd: formatMoney(cierre.caja.totalCreditosUsd),
      cantidadCreditos: cierre.caja.cantidadCreditos,
      totalSistema: formatMoney(cierre.resumen.totalSistemico),
      totalEfectivoContado: formatMoney(cierre.resumen.totalEfectivoContado),
      totalPuntoVenta: formatMoney(cierre.resumen.totalPuntoVenta),
      discrepanciaTotal: formatMoney(cierre.resumen.discrepanciaTotal),
      reportZ: cierre.detallesEfectivo?.reporte_z ? formatMoney(cierre.detallesEfectivo.reporte_z) : 'N/A',
      discrepanciaReportZ: formatMoney(cierre.resumen.discrepanciaReporteZ),
      estado: Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? 'Cuadrado' : 'Con Discrepancia',
      observaciones: cierre.caja.observaciones || ''
    })
  })

  worksheetPrincipal.getRow(1).font = { bold: true }
  worksheetPrincipal.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Hoja de detalles de efectivo
  const datosEfectivo = cierres.filter(cierre => cierre.detallesEfectivo)
  
  if (datosEfectivo.length > 0) {
    const worksheetEfectivo = workbook.addWorksheet('Detalles Efectivo', {
      properties: { tabColor: { argb: '00CC66' } }
    })

    worksheetEfectivo.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Cajero', key: 'cajero', width: 25 },
      { header: 'Efectivo USD', key: 'efectivoUsd', width: 15 },
      { header: 'Efectivo EUR', key: 'efectivoEur', width: 15 },
      { header: 'Efectivo Bs', key: 'efectivoBs', width: 15 },
      { header: 'Fondo Caja USD', key: 'fondoCajaUsd', width: 15 },
      { header: 'Fondo Caja Bs', key: 'fondoCajaBs', width: 15 },
      { header: 'Report Z', key: 'reportZ', width: 15 },
      { header: 'Total Efectivo Bs', key: 'totalEfectivoBs', width: 18 }
    ]

    datosEfectivo.forEach(cierre => {
      worksheetEfectivo.addRow({
        fecha: format(cierre.caja.fecha, 'dd/MM/yyyy'),
        cajero: cierre.caja.usuario?.full_name || 'Sin nombre',
        efectivoUsd: formatMoney(cierre.detallesEfectivo!.efectivo_dolares || 0),
        efectivoEur: formatMoney(cierre.detallesEfectivo!.efectivo_euros || 0),
        efectivoBs: formatMoney(cierre.detallesEfectivo!.efectivo_bs || 0),
        fondoCajaUsd: formatMoney(cierre.detallesEfectivo!.fondo_caja_dolares || 0),
        fondoCajaBs: formatMoney(cierre.detallesEfectivo!.fondo_caja_bs || 0),
        reportZ: formatMoney(cierre.detallesEfectivo!.reporte_z || 0),
        totalEfectivoBs: formatMoney(cierre.resumen.totalEfectivoContado)
      })
    })

    worksheetEfectivo.getRow(1).font = { bold: true }
    worksheetEfectivo.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }
  }

  // Hoja de punto de venta
  const datosPuntoVenta: any[] = []
  cierres.forEach(cierre => {
    cierre.detallesPuntoVenta.forEach(pv => {
      datosPuntoVenta.push({
        fecha: format(cierre.caja.fecha, 'dd/MM/yyyy'),
        cajero: cierre.caja.usuario?.full_name || 'Sin nombre',
        banco: pv.banco.nombre,
        codigoBanco: pv.banco.codigo,
        montoUsd: formatMoney(pv.monto_usd),
        montoBs: formatMoney(pv.monto_bs),
        numeroLote: pv.numero_lote || 'N/A'
      })
    })
  })

  if (datosPuntoVenta.length > 0) {
    const worksheetPuntoVenta = workbook.addWorksheet('Punto de Venta', {
      properties: { tabColor: { argb: 'CC0066' } }
    })

    worksheetPuntoVenta.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Cajero', key: 'cajero', width: 25 },
      { header: 'Banco', key: 'banco', width: 25 },
      { header: 'Código Banco', key: 'codigoBanco', width: 15 },
      { header: 'Monto USD', key: 'montoUsd', width: 15 },
      { header: 'Monto Bs', key: 'montoBs', width: 15 },
      { header: 'Número Lote', key: 'numeroLote', width: 15 }
    ]

    datosPuntoVenta.forEach(data => {
      worksheetPuntoVenta.addRow(data)
    })

    worksheetPuntoVenta.getRow(1).font = { bold: true }
    worksheetPuntoVenta.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }
  }

  // Hoja de información y filtros
  const worksheetInfo = workbook.addWorksheet('Información', {
    properties: { tabColor: { argb: 'FFCC00' } }
  })

  const infoRows = [
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

  worksheetInfo.columns = [
    { key: 'campo', width: 25 },
    { key: 'valor', width: 30 }
  ]

  infoRows.forEach(row => {
    worksheetInfo.addRow({ campo: row[0], valor: row[1] })
  })

  worksheetInfo.getRow(1).font = { bold: true, size: 14 }
  worksheetInfo.getRow(8).font = { bold: true, size: 14 }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `cierres_caja_${timestamp}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}

export const exportResumenCierresToExcel = async (
  resumen: ResumenCierres,
  nombreArchivo?: string
) => {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cierres de Caja'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja de resumen general
  const worksheetResumen = workbook.addWorksheet('Resumen General', {
    properties: { tabColor: { argb: '0066CC' } }
  })

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

  worksheetResumen.columns = [
    { key: 'campo', width: 30 },
    { key: 'valor', width: 25 }
  ]

  datosResumen.forEach(row => {
    worksheetResumen.addRow({ campo: row[0], valor: row[1] })
  })

  worksheetResumen.getRow(1).font = { bold: true, size: 16 }
  worksheetResumen.getRow(7).font = { bold: true, size: 14 }

  // Hoja de usuarios más activos
  if (resumen.usuariosMasActivos.length > 0) {
    const worksheetUsuarios = workbook.addWorksheet('Usuarios Activos', {
      properties: { tabColor: { argb: '00CC66' } }
    })

    worksheetUsuarios.columns = [
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Cantidad de Cierres', key: 'cantidadCierres', width: 20 },
      { header: 'Promedio Discrepancia', key: 'promedioDiscrepancia', width: 25 },
      { header: 'Eficiencia', key: 'eficiencia', width: 20 }
    ]

    resumen.usuariosMasActivos.forEach(usuario => {
      worksheetUsuarios.addRow({
        nombre: usuario.nombreUsuario,
        cantidadCierres: usuario.cantidadCierres,
        promedioDiscrepancia: formatMoney(usuario.promedioDiscrepancia),
        eficiencia: usuario.promedioDiscrepancia < 10 ? 'Excelente' : 
                   usuario.promedioDiscrepancia < 50 ? 'Buena' : 'Requiere Mejora'
      })
    })

    worksheetUsuarios.getRow(1).font = { bold: true }
    worksheetUsuarios.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }
  }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `resumen_cierres_${timestamp}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}

export const exportCierreDetalladoToExcel = async (
  cierre: CierreDetalladoUI,
  nombreArchivo?: string
) => {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Cierres de Caja'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja de información general
  const worksheetGeneral = workbook.addWorksheet('Información General', {
    properties: { tabColor: { argb: '0066CC' } }
  })

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

  worksheetGeneral.columns = [
    { key: 'campo', width: 25 },
    { key: 'valor', width: 30 }
  ]

  infoGeneral.forEach(row => {
    worksheetGeneral.addRow({ campo: row[0], valor: row[1] })
  })

  worksheetGeneral.getRow(1).font = { bold: true, size: 16 }
  worksheetGeneral.getRow(9).font = { bold: true, size: 14 }

  // Hoja de transacciones
  const worksheetTransacciones = workbook.addWorksheet('Transacciones', {
    properties: { tabColor: { argb: '00CC66' } }
  })

  const transacciones = [
    { tipo: 'Pagos Móvil', cantidad: cierre.caja.cantidadPagosMovil, montoBs: formatMoney(cierre.caja.totalPagosMovil), montoUsd: '' },
    { tipo: 'Zelle', cantidad: cierre.caja.cantidadZelle, montoBs: formatMoney(cierre.caja.totalZelleBs), montoUsd: formatMoney(cierre.caja.totalZelleUsd) },
    { tipo: 'Notas de Crédito', cantidad: cierre.caja.cantidadNotasCredito, montoBs: formatMoney(cierre.caja.totalNotasCredito), montoUsd: '' },
    { tipo: 'Créditos', cantidad: cierre.caja.cantidadCreditos, montoBs: formatMoney(cierre.caja.totalCreditosBs), montoUsd: formatMoney(cierre.caja.totalCreditosUsd) }
  ]

  worksheetTransacciones.columns = [
    { header: 'Tipo de Transacción', key: 'tipo', width: 20 },
    { header: 'Cantidad', key: 'cantidad', width: 12 },
    { header: 'Monto (Bs)', key: 'montoBs', width: 18 },
    { header: 'Monto (USD)', key: 'montoUsd', width: 18 }
  ]

  transacciones.forEach(trans => {
    worksheetTransacciones.addRow(trans)
  })

  // Agregar fila de total
  worksheetTransacciones.addRow({
    tipo: 'TOTAL',
    cantidad: '',
    montoBs: formatMoney(cierre.resumen.totalSistemico),
    montoUsd: formatMoney(cierre.caja.totalZelleUsd + cierre.caja.totalCreditosUsd)
  })

  worksheetTransacciones.getRow(1).font = { bold: true }
  worksheetTransacciones.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }
  worksheetTransacciones.getRow(worksheetTransacciones.rowCount).font = { bold: true }

  // Detalles de efectivo si existen
  if (cierre.detallesEfectivo) {
    const worksheetEfectivo = workbook.addWorksheet('Efectivo', {
      properties: { tabColor: { argb: 'CC0066' } }
    })

    const efectivo = [
      { tipo: 'Dólares', cantidad: formatMoney(cierre.detallesEfectivo.efectivo_dolares || 0), equivalenteBs: formatMoney((cierre.detallesEfectivo.efectivo_dolares || 0) * cierre.caja.tasaDia) },
      { tipo: 'Euros', cantidad: formatMoney(cierre.detallesEfectivo.efectivo_euros || 0), equivalenteBs: formatMoney((cierre.detallesEfectivo.efectivo_euros || 0) * cierre.caja.tasaDia * 1.1) },
      { tipo: 'Bolívares', cantidad: formatMoney(cierre.detallesEfectivo.efectivo_bs || 0), equivalenteBs: formatMoney(cierre.detallesEfectivo.efectivo_bs || 0) },
      { tipo: '', cantidad: '', equivalenteBs: '' },
      { tipo: 'Fondo Caja USD', cantidad: formatMoney(cierre.detallesEfectivo.fondo_caja_dolares || 0), equivalenteBs: '' },
      { tipo: 'Fondo Caja Bs', cantidad: formatMoney(cierre.detallesEfectivo.fondo_caja_bs || 0), equivalenteBs: '' },
      { tipo: '', cantidad: '', equivalenteBs: '' },
      { tipo: 'Report Z', cantidad: formatMoney(cierre.detallesEfectivo.reporte_z || 0), equivalenteBs: '' },
      { tipo: 'TOTAL EFECTIVO', cantidad: '', equivalenteBs: formatMoney(cierre.resumen.totalEfectivoContado) }
    ]

    worksheetEfectivo.columns = [
      { header: 'Tipo de Efectivo', key: 'tipo', width: 20 },
      { header: 'Cantidad', key: 'cantidad', width: 18 },
      { header: 'Equivalente en Bs', key: 'equivalenteBs', width: 20 }
    ]

    efectivo.forEach(row => {
      worksheetEfectivo.addRow(row)
    })

    worksheetEfectivo.getRow(1).font = { bold: true }
    worksheetEfectivo.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }
    worksheetEfectivo.getRow(worksheetEfectivo.rowCount).font = { bold: true }
  }

  // Punto de venta si existen
  if (cierre.detallesPuntoVenta.length > 0) {
    const worksheetPV = workbook.addWorksheet('Punto de Venta', {
      properties: { tabColor: { argb: 'FFCC00' } }
    })

    worksheetPV.columns = [
      { header: 'Banco', key: 'banco', width: 25 },
      { header: 'Código', key: 'codigo', width: 12 },
      { header: 'Monto USD', key: 'montoUsd', width: 15 },
      { header: 'Monto Bs', key: 'montoBs', width: 18 },
      { header: 'Número Lote', key: 'numeroLote', width: 15 }
    ]

    cierre.detallesPuntoVenta.forEach(pv => {
      worksheetPV.addRow({
        banco: pv.banco.nombre,
        codigo: pv.banco.codigo,
        montoUsd: formatMoney(pv.monto_usd),
        montoBs: formatMoney(pv.monto_bs),
        numeroLote: pv.numero_lote || 'N/A'
      })
    })

    // Agregar fila de total
    worksheetPV.addRow({
      banco: 'TOTAL',
      codigo: '',
      montoUsd: '',
      montoBs: formatMoney(cierre.resumen.totalPuntoVenta),
      numeroLote: ''
    })

    worksheetPV.getRow(1).font = { bold: true }
    worksheetPV.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }
    worksheetPV.getRow(worksheetPV.rowCount).font = { bold: true }
  }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fechaCierre = format(cierre.caja.fecha, 'yyyyMMdd')
  const fileName = nombreArchivo || `cierre_detallado_${fechaCierre}_${timestamp}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}