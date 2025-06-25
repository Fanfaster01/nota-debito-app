// src/utils/exportCreditosExcel.ts
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { CreditoDetalladoUI } from '@/types/creditos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportCreditosToExcel = async (creditos: CreditoDetalladoUI[], filtros?: any) => {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Créditos'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja principal de créditos
  const creditosSheet = workbook.addWorksheet('Créditos', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  creditosSheet.columns = [
    { header: 'Nro Factura', key: 'numeroFactura', width: 12 },
    { header: 'Cliente', key: 'nombreCliente', width: 25 },
    { header: 'Documento', key: 'documento', width: 15 },
    { header: 'Teléfono', key: 'telefonoCliente', width: 15 },
    { header: 'Fecha Crédito', key: 'fechaCredito', width: 12 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'Monto Total (Bs)', key: 'montoBs', width: 15 },
    { header: 'Monto USD', key: 'montoUsd', width: 12 },
    { header: 'Tasa', key: 'tasa', width: 8 },
    { header: 'Monto Abonado (Bs)', key: 'montoAbonado', width: 15 },
    { header: 'Saldo Pendiente (Bs)', key: 'saldoPendiente', width: 15 },
    { header: 'Estado', key: 'estado', width: 10 },
    { header: 'Estado Vencimiento', key: 'estadoVencimiento', width: 15 },
    { header: 'Cantidad Abonos', key: 'cantidadAbonos', width: 12 },
    { header: 'Fecha Último Pago', key: 'fechaUltimoPago', width: 15 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Empresa', key: 'empresa', width: 20 },
    { header: 'Observaciones', key: 'observaciones', width: 30 }
  ]

  creditos.forEach(credito => {
    creditosSheet.addRow({
      numeroFactura: credito.numeroFactura,
      nombreCliente: credito.nombreCliente,
      documento: credito.cliente ? `${credito.cliente.tipoDocumento}-${credito.cliente.numeroDocumento}` : '',
      telefonoCliente: credito.telefonoCliente,
      fechaCredito: format(credito.fechaHora, 'dd/MM/yyyy', { locale: es }),
      fechaVencimiento: credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : '',
      montoBs: credito.montoBs,
      montoUsd: credito.montoUsd,
      tasa: credito.tasa,
      montoAbonado: credito.montoAbonado,
      saldoPendiente: credito.saldoPendiente,
      estado: credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado',
      estadoVencimiento: credito.estadoVencimiento,
      cantidadAbonos: credito.cantidadAbonos,
      fechaUltimoPago: credito.fechaUltimoPago ? format(credito.fechaUltimoPago, 'dd/MM/yyyy', { locale: es }) : '',
      usuario: credito.usuario?.full_name || '',
      empresa: credito.empresa?.name || '',
      observaciones: credito.observaciones || ''
    })
  })

  creditosSheet.getRow(1).font = { bold: true }
  creditosSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Aplicar formato de número a columnas monetarias
  creditosSheet.getColumn('montoBs').numFmt = '#,##0.00'
  creditosSheet.getColumn('montoUsd').numFmt = '#,##0.00'
  creditosSheet.getColumn('montoAbonado').numFmt = '#,##0.00'
  creditosSheet.getColumn('saldoPendiente').numFmt = '#,##0.00'
  creditosSheet.getColumn('tasa').numFmt = '#,##0.00'

  // Hoja de resumen
  const resumenSheet = workbook.addWorksheet('Resumen', {
    properties: { tabColor: { argb: '00CC66' } }
  })

  const resumenData = [
    ['RESUMEN DE CRÉDITOS', ''],
    ['', ''],
    ['Total de Créditos', creditos.length],
    ['Créditos Pendientes', creditos.filter(c => c.estado === 'pendiente').length],
    ['Créditos Pagados', creditos.filter(c => c.estado === 'pagado').length],
    ['Créditos Vencidos', creditos.filter(c => c.estadoVencimiento === 'Vencido').length],
    ['', ''],
    ['Monto Total (Bs)', creditos.reduce((sum, c) => sum + c.montoBs, 0)],
    ['Monto Abonado (Bs)', creditos.reduce((sum, c) => sum + c.montoAbonado, 0)],
    ['Saldo Pendiente (Bs)', creditos.reduce((sum, c) => sum + c.saldoPendiente, 0)],
    ['', ''],
    ['Clientes Únicos', new Set(creditos.map(c => c.clienteId).filter(Boolean)).size],
    ['', ''],
    ['Reporte generado el', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })]
  ]

  resumenSheet.columns = [
    { key: 'campo', width: 25 },
    { key: 'valor', width: 20 }
  ]

  resumenData.forEach(row => {
    resumenSheet.addRow({ campo: row[0], valor: row[1] })
  })

  // Estilo para el título
  resumenSheet.getRow(1).font = { bold: true, size: 14 }
  resumenSheet.getRow(1).alignment = { horizontal: 'center' }
  resumenSheet.mergeCells('A1:B1')

  // Estilo para subtítulos
  resumenSheet.getRow(3).font = { bold: true }
  resumenSheet.getRow(8).font = { bold: true }

  // Formato numérico para montos
  resumenSheet.getCell('B8').numFmt = '#,##0.00'
  resumenSheet.getCell('B9').numFmt = '#,##0.00'
  resumenSheet.getCell('B10').numFmt = '#,##0.00'

  // Hoja de abonos detallados (si hay créditos con abonos)
  const creditosConAbonos = creditos.filter(c => c.abonos && c.abonos.length > 0)
  if (creditosConAbonos.length > 0) {
    const abonosSheet = workbook.addWorksheet('Historial Abonos', {
      properties: { tabColor: { argb: 'CC0066' } }
    })

    abonosSheet.columns = [
      { header: 'Nro Factura', key: 'numeroFactura', width: 12 },
      { header: 'Cliente', key: 'nombreCliente', width: 25 },
      { header: 'Fecha Abono', key: 'fechaAbono', width: 15 },
      { header: 'Monto Abono (Bs)', key: 'montoBs', width: 15 },
      { header: 'Monto USD', key: 'montoUsd', width: 12 },
      { header: 'Tasa', key: 'tasa', width: 8 },
      { header: 'Método de Pago', key: 'metodoPago', width: 15 },
      { header: 'Referencia', key: 'referencia', width: 20 },
      { header: 'Banco', key: 'banco', width: 20 },
      { header: 'Usuario', key: 'usuario', width: 20 },
      { header: 'Observaciones', key: 'observaciones', width: 30 }
    ]

    creditosConAbonos.forEach(credito => {
      credito.abonos?.forEach(abono => {
        abonosSheet.addRow({
          numeroFactura: credito.numeroFactura,
          nombreCliente: credito.nombreCliente,
          fechaAbono: format(abono.fechaPago, 'dd/MM/yyyy HH:mm', { locale: es }),
          montoBs: abono.montoBs,
          montoUsd: abono.montoUsd,
          tasa: abono.tasa,
          metodoPago: abono.metodoPago.replace('_', ' ').toUpperCase(),
          referencia: abono.referencia || '',
          banco: abono.banco?.nombre || '',
          usuario: abono.usuario?.full_name || '',
          observaciones: abono.observaciones || ''
        })
      })
    })

    abonosSheet.getRow(1).font = { bold: true }
    abonosSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'CCCCCC' }
    }

    // Formato numérico para montos
    abonosSheet.getColumn('montoBs').numFmt = '#,##0.00'
    abonosSheet.getColumn('montoUsd').numFmt = '#,##0.00'
    abonosSheet.getColumn('tasa').numFmt = '#,##0.00'
  }

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `creditos_${fechaActual}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}

export const exportEstadoCuentaClienteToExcel = async (
  cliente: any,
  creditos: CreditoDetalladoUI[],
  totales: any
) => {
  const workbook = new ExcelJS.Workbook()
  
  workbook.creator = 'Sistema de Créditos'
  workbook.lastModifiedBy = 'Sistema'
  workbook.created = new Date()
  workbook.modified = new Date()

  // Hoja de información del cliente
  const clienteSheet = workbook.addWorksheet('Info Cliente', {
    properties: { tabColor: { argb: '0066CC' } }
  })

  const clienteData = [
    ['ESTADO DE CUENTA DEL CLIENTE', ''],
    ['', ''],
    ['Nombre', cliente.nombre],
    ['Documento', `${cliente.tipo_documento}-${cliente.numero_documento}`],
    ['Teléfono', cliente.telefono || ''],
    ['Dirección', cliente.direccion || ''],
    ['', ''],
    ['Total Créditos', totales.totalCreditos],
    ['Créditos Pendientes', totales.creditosPendientes],
    ['Monto Pendiente (Bs)', totales.montoPendiente],
    ['Monto Abonado (Bs)', totales.montoAbonado],
    ['', ''],
    ['Reporte generado el', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })]
  ]

  clienteSheet.columns = [
    { key: 'campo', width: 25 },
    { key: 'valor', width: 20 }
  ]

  clienteData.forEach(row => {
    clienteSheet.addRow({ campo: row[0], valor: row[1] })
  })

  // Estilo para el título
  clienteSheet.getRow(1).font = { bold: true, size: 14 }
  clienteSheet.getRow(1).alignment = { horizontal: 'center' }
  clienteSheet.mergeCells('A1:B1')

  // Estilo para subtítulos
  clienteSheet.getRow(3).font = { bold: true }
  clienteSheet.getRow(8).font = { bold: true }

  // Formato numérico para montos
  clienteSheet.getCell('B10').numFmt = '#,##0.00'
  clienteSheet.getCell('B11').numFmt = '#,##0.00'

  // Hoja de créditos del cliente
  const creditosSheet = workbook.addWorksheet('Créditos', {
    properties: { tabColor: { argb: '00CC66' } }
  })

  creditosSheet.columns = [
    { header: 'Nro Factura', key: 'numeroFactura', width: 12 },
    { header: 'Fecha Crédito', key: 'fechaCredito', width: 12 },
    { header: 'Fecha Vencimiento', key: 'fechaVencimiento', width: 15 },
    { header: 'Monto Total (Bs)', key: 'montoBs', width: 15 },
    { header: 'Monto Abonado (Bs)', key: 'montoAbonado', width: 15 },
    { header: 'Saldo Pendiente (Bs)', key: 'saldoPendiente', width: 15 },
    { header: 'Estado', key: 'estado', width: 10 },
    { header: 'Estado Vencimiento', key: 'estadoVencimiento', width: 15 },
    { header: 'Observaciones', key: 'observaciones', width: 30 }
  ]

  creditos.forEach(credito => {
    creditosSheet.addRow({
      numeroFactura: credito.numeroFactura,
      fechaCredito: format(credito.fechaHora, 'dd/MM/yyyy', { locale: es }),
      fechaVencimiento: credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : '',
      montoBs: credito.montoBs,
      montoAbonado: credito.montoAbonado,
      saldoPendiente: credito.saldoPendiente,
      estado: credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado',
      estadoVencimiento: credito.estadoVencimiento,
      observaciones: credito.observaciones || ''
    })
  })

  creditosSheet.getRow(1).font = { bold: true }
  creditosSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'CCCCCC' }
  }

  // Formato numérico para montos
  creditosSheet.getColumn('montoBs').numFmt = '#,##0.00'
  creditosSheet.getColumn('montoAbonado').numFmt = '#,##0.00'
  creditosSheet.getColumn('saldoPendiente').numFmt = '#,##0.00'

  // Generar y descargar archivo
  const buffer = await workbook.xlsx.writeBuffer()
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `estado_cuenta_${cliente.numero_documento}_${fechaActual}.xlsx`
  saveAs(new Blob([buffer]), fileName)
}