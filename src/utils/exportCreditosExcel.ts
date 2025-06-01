// src/utils/exportCreditosExcel.ts
import * as XLSX from 'xlsx'
import { CreditoDetalladoUI } from '@/types/creditos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const exportCreditosToExcel = (creditos: CreditoDetalladoUI[], filtros?: any) => {
  // Datos principales de créditos
  const creditosData = creditos.map(credito => ({
    'Nro Factura': credito.numeroFactura,
    'Cliente': credito.nombreCliente,
    'Documento': credito.cliente ? `${credito.cliente.tipoDocumento}-${credito.cliente.numeroDocumento}` : '',
    'Teléfono': credito.telefonoCliente,
    'Fecha Crédito': format(credito.fechaHora, 'dd/MM/yyyy', { locale: es }),
    'Fecha Vencimiento': credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : '',
    'Monto Total (Bs)': credito.montoBs,
    'Monto USD': credito.montoUsd,
    'Tasa': credito.tasa,
    'Monto Abonado (Bs)': credito.montoAbonado,
    'Saldo Pendiente (Bs)': credito.saldoPendiente,
    'Estado': credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado',
    'Estado Vencimiento': credito.estadoVencimiento,
    'Cantidad Abonos': credito.cantidadAbonos,
    'Fecha Último Pago': credito.fechaUltimoPago ? format(credito.fechaUltimoPago, 'dd/MM/yyyy', { locale: es }) : '',
    'Usuario': credito.usuario?.full_name || '',
    'Empresa': credito.empresa?.name || '',
    'Observaciones': credito.observaciones || ''
  }))

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new()

  // Hoja principal de créditos
  const creditosSheet = XLSX.utils.json_to_sheet(creditosData)
  
  // Ajustar ancho de columnas
  const creditosColWidths = [
    { wch: 12 }, // Nro Factura
    { wch: 25 }, // Cliente
    { wch: 15 }, // Documento
    { wch: 15 }, // Teléfono
    { wch: 12 }, // Fecha Crédito
    { wch: 15 }, // Fecha Vencimiento
    { wch: 15 }, // Monto Total
    { wch: 12 }, // Monto USD
    { wch: 8 },  // Tasa
    { wch: 15 }, // Monto Abonado
    { wch: 15 }, // Saldo Pendiente
    { wch: 10 }, // Estado
    { wch: 15 }, // Estado Vencimiento
    { wch: 12 }, // Cantidad Abonos
    { wch: 15 }, // Fecha Último Pago
    { wch: 20 }, // Usuario
    { wch: 20 }, // Empresa
    { wch: 30 }  // Observaciones
  ]
  creditosSheet['!cols'] = creditosColWidths

  XLSX.utils.book_append_sheet(workbook, creditosSheet, 'Créditos')

  // Hoja de resumen
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

  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData)
  resumenSheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
  
  // Aplicar estilos al encabezado del resumen
  if (resumenSheet['A1']) {
    resumenSheet['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    }
  }

  XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen')

  // Hoja de abonos detallados (si hay créditos con abonos)
  const creditosConAbonos = creditos.filter(c => c.abonos && c.abonos.length > 0)
  if (creditosConAbonos.length > 0) {
    const abonosData: any[] = []
    
    creditosConAbonos.forEach(credito => {
      credito.abonos?.forEach(abono => {
        abonosData.push({
          'Nro Factura': credito.numeroFactura,
          'Cliente': credito.nombreCliente,
          'Fecha Abono': format(abono.fechaPago, 'dd/MM/yyyy HH:mm', { locale: es }),
          'Monto Abono (Bs)': abono.montoBs,
          'Monto USD': abono.montoUsd,
          'Tasa': abono.tasa,
          'Método de Pago': abono.metodoPago.replace('_', ' ').toUpperCase(),
          'Referencia': abono.referencia || '',
          'Banco': abono.banco?.nombre || '',
          'Usuario': abono.usuario?.full_name || '',
          'Observaciones': abono.observaciones || ''
        })
      })
    })

    const abonosSheet = XLSX.utils.json_to_sheet(abonosData)
    abonosSheet['!cols'] = [
      { wch: 12 }, // Nro Factura
      { wch: 25 }, // Cliente
      { wch: 15 }, // Fecha Abono
      { wch: 15 }, // Monto Abono
      { wch: 12 }, // Monto USD
      { wch: 8 },  // Tasa
      { wch: 15 }, // Método de Pago
      { wch: 20 }, // Referencia
      { wch: 20 }, // Banco
      { wch: 20 }, // Usuario
      { wch: 30 }  // Observaciones
    ]

    XLSX.utils.book_append_sheet(workbook, abonosSheet, 'Historial Abonos')
  }

  // Generar nombre del archivo
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `creditos_${fechaActual}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, fileName)
}

export const exportEstadoCuentaClienteToExcel = (
  cliente: any,
  creditos: CreditoDetalladoUI[],
  totales: any
) => {
  // Datos del cliente
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

  const workbook = XLSX.utils.book_new()

  // Hoja de información del cliente
  const clienteSheet = XLSX.utils.aoa_to_sheet(clienteData)
  clienteSheet['!cols'] = [{ wch: 25 }, { wch: 20 }]
  
  if (clienteSheet['A1']) {
    clienteSheet['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    }
  }

  XLSX.utils.book_append_sheet(workbook, clienteSheet, 'Info Cliente')

  // Hoja de créditos del cliente
  const creditosData = creditos.map(credito => ({
    'Nro Factura': credito.numeroFactura,
    'Fecha Crédito': format(credito.fechaHora, 'dd/MM/yyyy', { locale: es }),
    'Fecha Vencimiento': credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es }) : '',
    'Monto Total (Bs)': credito.montoBs,
    'Monto Abonado (Bs)': credito.montoAbonado,
    'Saldo Pendiente (Bs)': credito.saldoPendiente,
    'Estado': credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado',
    'Estado Vencimiento': credito.estadoVencimiento,
    'Observaciones': credito.observaciones || ''
  }))

  const creditosSheet = XLSX.utils.json_to_sheet(creditosData)
  creditosSheet['!cols'] = [
    { wch: 12 }, // Nro Factura
    { wch: 12 }, // Fecha Crédito
    { wch: 15 }, // Fecha Vencimiento
    { wch: 15 }, // Monto Total
    { wch: 15 }, // Monto Abonado
    { wch: 15 }, // Saldo Pendiente
    { wch: 10 }, // Estado
    { wch: 15 }, // Estado Vencimiento
    { wch: 30 }  // Observaciones
  ]

  XLSX.utils.book_append_sheet(workbook, creditosSheet, 'Créditos')

  // Generar nombre del archivo
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `estado_cuenta_${cliente.numero_documento}_${fechaActual}.xlsx`

  // Descargar archivo
  XLSX.writeFile(workbook, fileName)
}