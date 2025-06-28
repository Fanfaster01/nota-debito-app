// src/utils/pdfGenerator.ts
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { CreditoDetalladoUI, FiltrosCredito, AbonoUI } from '@/types/creditos'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TotalesEstadoCuenta {
  totalCreditos: number
  creditosPendientes: number
  montoPendiente: number
  montoAbonado: number
}

// Extender el tipo jsPDF para incluir autoTable con tipos más específicos
interface AutoTableOptions {
  head?: (string | number)[][]
  body?: (string | number)[][]
  startY?: number
  margin?: { top?: number; left?: number; right?: number; bottom?: number }
  styles?: Record<string, unknown>
  headStyles?: Record<string, unknown>
  bodyStyles?: Record<string, unknown>
  columnStyles?: Record<string, unknown>
  theme?: string
  tableWidth?: string | number
  showHead?: boolean
  showFoot?: boolean
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable?: { finalY: number }
  }
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const generateCreditosPDF = (creditos: CreditoDetalladoUI[], filtros?: FiltrosCredito) => {
  const doc = new jsPDF()
  
  // Configuración de fuentes
  doc.setFont('helvetica')
  
  // Encabezado
  doc.setFontSize(18)
  doc.text('REPORTE DE VENTAS A CRÉDITO', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 30)
  doc.text(`Total de registros: ${creditos.length}`, 20, 35)

  // Filtros aplicados
  let yPos = 45
  if (filtros) {
    doc.setFontSize(12)
    doc.text('Filtros Aplicados:', 20, yPos)
    yPos += 5
    
    doc.setFontSize(9)
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const desde = filtros.fechaDesde ? format(filtros.fechaDesde, 'dd/MM/yyyy') : 'N/A'
      const hasta = filtros.fechaHasta ? format(filtros.fechaHasta, 'dd/MM/yyyy') : 'N/A'
      doc.text(`Período: ${desde} - ${hasta}`, 25, yPos)
      yPos += 4
    }
    if (filtros.estado && filtros.estado !== 'todos') {
      doc.text(`Estado: ${filtros.estado}`, 25, yPos)
      yPos += 4
    }
    if (filtros.estadoVencimiento && filtros.estadoVencimiento !== 'todos') {
      doc.text(`Vencimiento: ${filtros.estadoVencimiento}`, 25, yPos)
      yPos += 4
    }
    yPos += 5
  }

  // Resumen
  const creditosPendientes = creditos.filter(c => c.estado === 'pendiente').length
  const creditosPagados = creditos.filter(c => c.estado === 'pagado').length
  const creditosVencidos = creditos.filter(c => c.estadoVencimiento === 'Vencido').length
  const montoTotal = creditos.reduce((sum, c) => sum + c.montoBs, 0)
  const montoAbonado = creditos.reduce((sum, c) => sum + c.montoAbonado, 0)
  const saldoPendiente = creditos.reduce((sum, c) => sum + c.saldoPendiente, 0)

  doc.setFontSize(12)
  doc.text('RESUMEN:', 20, yPos)
  yPos += 7

  doc.autoTable({
    startY: yPos,
    head: [['Concepto', 'Cantidad', 'Monto (Bs)']],
    body: [
      ['Total de Créditos', creditos.length.toString(), `Bs ${formatMoney(montoTotal)}`],
      ['Créditos Pendientes', creditosPendientes.toString(), `Bs ${formatMoney(saldoPendiente)}`],
      ['Créditos Pagados', creditosPagados.toString(), `Bs ${formatMoney(montoAbonado)}`],
      ['Créditos Vencidos', creditosVencidos.toString(), '-']
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' }
    }
  })

  // Nueva página para el detalle
  doc.addPage()
  
  doc.setFontSize(14)
  doc.text('DETALLE DE CRÉDITOS', 105, 20, { align: 'center' })

  // Tabla de créditos
  const tableData = creditos.map(credito => [
    credito.numeroFactura,
    credito.nombreCliente.substring(0, 20) + (credito.nombreCliente.length > 20 ? '...' : ''),
    format(credito.fechaHora, 'dd/MM/yy'),
    credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yy') : '-',
    `Bs ${formatMoney(credito.montoBs)}`,
    `Bs ${formatMoney(credito.montoAbonado)}`,
    `Bs ${formatMoney(credito.saldoPendiente)}`,
    credito.estado === 'pendiente' ? 'Pend.' : 'Pagado',
    credito.estadoVencimiento.substring(0, 8)
  ])

  doc.autoTable({
    startY: 30,
    head: [['Factura', 'Cliente', 'F. Créd.', 'F. Venc.', 'Total', 'Abonado', 'Pendiente', 'Estado', 'Vencim.']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 35 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 16 },
      8: { cellWidth: 18 }
    }
  })

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' })
  }

  // Generar nombre del archivo
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `reporte_creditos_${fechaActual}.pdf`

  // Descargar
  doc.save(fileName)
}

export const generateEstadoCuentaClientePDF = (
  cliente: Record<string, unknown>,
  creditos: CreditoDetalladoUI[],
  totales: TotalesEstadoCuenta
) => {
  const doc = new jsPDF()
  
  // Encabezado
  doc.setFontSize(18)
  doc.text('ESTADO DE CUENTA DEL CLIENTE', 105, 20, { align: 'center' })
  
  // Información del cliente
  doc.setFontSize(12)
  doc.text('DATOS DEL CLIENTE:', 20, 40)
  
  doc.setFontSize(10)
  doc.text(`Nombre: ${cliente.nombre}`, 20, 50)
  doc.text(`Documento: ${cliente.tipo_documento}-${cliente.numero_documento}`, 20, 55)
  doc.text(`Teléfono: ${cliente.telefono || 'No registrado'}`, 20, 60)
  doc.text(`Dirección: ${cliente.direccion || 'No registrada'}`, 20, 65)
  doc.text(`Fecha del reporte: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, 70)

  // Resumen financiero
  doc.setFontSize(12)
  doc.text('RESUMEN FINANCIERO:', 20, 85)

  doc.autoTable({
    startY: 90,
    head: [['Concepto', 'Cantidad', 'Monto (Bs)']],
    body: [
      ['Total de Créditos', totales.totalCreditos.toString(), `Bs ${formatMoney(totales.montoPendiente + totales.montoAbonado)}`],
      ['Créditos Pendientes', totales.creditosPendientes.toString(), `Bs ${formatMoney(totales.montoPendiente)}`],
      ['Monto Abonado', '-', `Bs ${formatMoney(totales.montoAbonado)}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' }
    }
  })

  // Tabla de créditos
  const startY = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  
  doc.setFontSize(12)
  doc.text('DETALLE DE CRÉDITOS:', 20, startY)

  const tableData = creditos.map(credito => [
    credito.numeroFactura,
    format(credito.fechaHora, 'dd/MM/yyyy'),
    credito.fechaVencimiento ? format(credito.fechaVencimiento, 'dd/MM/yyyy') : '-',
    `Bs ${formatMoney(credito.montoBs)}`,
    `Bs ${formatMoney(credito.montoAbonado)}`,
    `Bs ${formatMoney(credito.saldoPendiente)}`,
    credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado',
    credito.estadoVencimiento
  ])

  doc.autoTable({
    startY: startY + 10,
    head: [['Factura', 'F. Crédito', 'F. Vencimiento', 'Total', 'Abonado', 'Pendiente', 'Estado', 'Vencimiento']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [52, 73, 94], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 18 },
      7: { cellWidth: 22 }
    }
  })

  // Pie de página
  doc.setFontSize(8)
  doc.text('Sistema de Gestión de Créditos', 105, 290, { align: 'center' })

  // Generar nombre del archivo
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `estado_cuenta_${cliente.numero_documento}_${fechaActual}.pdf`

  // Descargar
  doc.save(fileName)
}

export const generateReciboPagoPDF = (credito: CreditoDetalladoUI, abono: AbonoUI) => {
  const doc = new jsPDF()
  
  // Encabezado
  doc.setFontSize(18)
  doc.text('RECIBO DE PAGO', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 150, 30)
  
  // Información del cliente
  doc.setFontSize(12)
  doc.text('CLIENTE:', 20, 50)
  
  doc.setFontSize(10)
  doc.text(`Nombre: ${credito.nombreCliente}`, 20, 60)
  doc.text(`Teléfono: ${credito.telefonoCliente}`, 20, 65)
  if (credito.cliente) {
    doc.text(`Documento: ${credito.cliente.tipoDocumento}-${credito.cliente.numeroDocumento}`, 20, 70)
  }

  // Información del crédito
  doc.setFontSize(12)
  doc.text('CRÉDITO:', 20, 85)
  
  doc.setFontSize(10)
  doc.text(`Factura Nro: ${credito.numeroFactura}`, 20, 95)
  doc.text(`Fecha del Crédito: ${format(credito.fechaHora, 'dd/MM/yyyy', { locale: es })}`, 20, 100)
  doc.text(`Monto Total: Bs ${formatMoney(credito.montoBs)}`, 20, 105)
  doc.text(`Saldo Anterior: Bs ${formatMoney(credito.saldoPendiente + abono.montoBs)}`, 20, 110)

  // Información del pago
  doc.setFontSize(12)
  doc.text('PAGO RECIBIDO:', 20, 125)
  
  doc.autoTable({
    startY: 130,
    head: [['Concepto', 'Detalle']],
    body: [
      ['Monto del Abono (Bs)', `Bs ${formatMoney(abono.montoBs)}`],
      ['Monto en USD', `$ ${formatMoney(abono.montoUsd)}`],
      ['Tasa de Cambio', abono.tasa.toString()],
      ['Método de Pago', abono.metodoPago.replace('_', ' ').toUpperCase()],
      ['Referencia', abono.referencia || 'N/A'],
      ['Banco', abono.banco?.nombre || 'N/A'],
      ['Fecha del Pago', format(abono.fechaPago, 'dd/MM/yyyy HH:mm', { locale: es })]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80 }
    }
  })

  // Saldo actualizado
  const finalY = (doc as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
  
  doc.setFontSize(12)
  doc.text('SALDO ACTUALIZADO:', 20, finalY)
  
  doc.setFontSize(14)
  doc.text(`Saldo Pendiente: Bs ${formatMoney(credito.saldoPendiente)}`, 20, finalY + 10)
  
  if (credito.saldoPendiente <= 0) {
    doc.setTextColor(0, 128, 0)
    doc.text('✓ CRÉDITO TOTALMENTE PAGADO', 20, finalY + 20)
    doc.setTextColor(0, 0, 0)
  }

  // Firma
  doc.text('_________________________', 20, 250)
  doc.text('Firma del Cliente', 20, 255)
  
  doc.text('_________________________', 120, 250)
  doc.text('Firma Autorizada', 120, 255)

  // Pie de página
  doc.setFontSize(8)
  doc.text('Este recibo certifica el pago recibido', 105, 280, { align: 'center' })

  // Generar nombre del archivo
  const fechaActual = format(new Date(), 'yyyy-MM-dd_HH-mm')
  const fileName = `recibo_pago_${credito.numeroFactura}_${fechaActual}.pdf`

  // Descargar
  doc.save(fileName)
}