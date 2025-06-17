// Utilidades para generar PDFs de recibos de pago
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { 
  ReciboPago, 
  FacturaCuentaPorPagar, 
  NotaDebitoGenerada 
} from '@/types/cuentasPorPagar'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

interface EmpresaInfo {
  nombre: string
  rif: string
  direccion: string
  telefono?: string
  email?: string
}

/**
 * Generar PDF de recibo de pago individual
 */
export function generarReciboPDF(
  recibo: ReciboPago,
  facturas: FacturaCuentaPorPagar[],
  empresa: EmpresaInfo
): string {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  let yPosition = margin

  // Encabezado
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGO', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // Información del recibo
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Recibo N°: ${recibo.numeroRecibo}`, margin, yPosition)
  doc.text(`Fecha: ${new Date(recibo.createdAt).toLocaleDateString('es-VE')}`, pageWidth - margin - 60, yPosition)
  yPosition += 10

  // Información de la empresa
  yPosition += 10
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DE LA EMPRESA', margin, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Empresa: ${empresa.nombre}`, margin, yPosition)
  yPosition += 6
  doc.text(`RIF: ${empresa.rif}`, margin, yPosition)
  yPosition += 6
  doc.text(`Dirección: ${empresa.direccion}`, margin, yPosition)
  if (empresa.telefono) {
    yPosition += 6
    doc.text(`Teléfono: ${empresa.telefono}`, margin, yPosition)
  }
  if (empresa.email) {
    yPosition += 6
    doc.text(`Email: ${empresa.email}`, margin, yPosition)
  }

  // Tipo de pago
  yPosition += 15
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  const tipoPagoTexto = recibo.tipoPago === 'efectivo' ? 'PAGO EN EFECTIVO (USD)' : 'PAGO POR DEPÓSITO BANCARIO'
  doc.text(`TIPO DE PAGO: ${tipoPagoTexto}`, margin, yPosition)

  if (recibo.bancoDestino) {
    yPosition += 8
    doc.setFont('helvetica', 'normal')
    doc.text(`Banco de destino: ${recibo.bancoDestino}`, margin, yPosition)
  }

  // Tabla de facturas
  yPosition += 15
  
  const tableData = facturas.map(factura => [
    factura.numero,
    factura.proveedorNombre,
    factura.fechaVencimiento ? new Date(factura.fechaVencimiento).toLocaleDateString('es-VE') : '-',
    `Bs. ${(factura.montoFinalPagar || factura.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  ])

  doc.autoTable({
    startY: yPosition,
    head: [['Factura N°', 'Proveedor', 'Vencimiento', 'Monto']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: margin, right: margin }
  })

  yPosition = doc.lastAutoTable.finalY + 15

  // Resumen de montos
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  
  const totalFacturas = facturas.length
  const montoTotalText = `Total facturas: ${totalFacturas}`
  const montoTotalBs = `Total en Bs: ${recibo.montoTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  
  doc.text(montoTotalText, margin, yPosition)
  yPosition += 8
  doc.text(montoTotalBs, margin, yPosition)

  if (recibo.montoTotalUsd) {
    yPosition += 8
    const montoTotalUsd = `Total en USD: ${recibo.montoTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    doc.text(montoTotalUsd, margin, yPosition)
  }

  // Notas
  if (recibo.notas) {
    yPosition += 15
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('OBSERVACIONES:', margin, yPosition)
    yPosition += 6
    doc.setFont('helvetica', 'normal')
    
    // Dividir notas en líneas si es muy largo
    const notasLines = doc.splitTextToSize(recibo.notas, pageWidth - 2 * margin)
    doc.text(notasLines, margin, yPosition)
  }

  // Pie de página
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(
    `Generado automáticamente el ${new Date().toLocaleString('es-VE')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  return doc.output('datauristring')
}

/**
 * Generar PDF combinado de notas de débito
 */
export function generarNotasDebitoPDF(
  notasDebito: NotaDebitoGenerada[],
  empresa: EmpresaInfo
): string {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 20

  notasDebito.forEach((nota, index) => {
    if (index > 0) {
      doc.addPage()
    }

    let yPosition = margin

    // Encabezado
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTA DE DÉBITO', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15

    // Número de nota y fecha
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nota N°: ${nota.numero}`, margin, yPosition)
    doc.text(`Fecha: ${new Date(nota.fecha).toLocaleDateString('es-VE')}`, pageWidth - margin - 60, yPosition)
    yPosition += 15

    // Datos de la empresa
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('EMPRESA EMISORA', margin, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${empresa.nombre}`, margin, yPosition)
    yPosition += 6
    doc.text(`RIF: ${empresa.rif}`, margin, yPosition)
    yPosition += 6
    doc.text(`${empresa.direccion}`, margin, yPosition)

    // Factura relacionada
    if (nota.factura) {
      yPosition += 15
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('FACTURA RELACIONADA', margin, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Factura N°: ${nota.factura.numero}`, margin, yPosition)
      yPosition += 6
      doc.text(`Proveedor: ${nota.factura.proveedorNombre}`, margin, yPosition)
      yPosition += 6
      doc.text(`RIF: ${nota.factura.proveedorRif}`, margin, yPosition)
    }

    // Detalle del cálculo
    yPosition += 15
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DEL DIFERENCIAL CAMBIARIO', margin, yPosition)
    yPosition += 10

    const calculoData = [
      ['Concepto', 'Monto'],
      ['Monto USD neto', `$ ${nota.montoUSDNeto.toFixed(2)}`],
      ['Tasa original', `Bs. ${nota.tasaCambioOriginal.toFixed(2)}`],
      ['Tasa de pago', `Bs. ${nota.tasaCambioPago.toFixed(2)}`],
      ['Diferencial cambiario con IVA', `Bs. ${nota.diferencialCambiarioConIVA.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
      ['Base imponible diferencial', `Bs. ${nota.baseImponibleDiferencial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
      ['IVA diferencial', `Bs. ${nota.ivaDiferencial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`],
      ['Retención IVA diferencial', `Bs. ${nota.retencionIVADiferencial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`]
    ]

    doc.autoTable({
      startY: yPosition,
      body: calculoData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: margin, right: margin }
    })

    yPosition = doc.lastAutoTable.finalY + 15

    // Monto final
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(
      `MONTO TOTAL A PAGAR: Bs. ${nota.montoNetoPagarNotaDebito.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
      margin,
      yPosition
    )

    // Pie de página
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Nota de Débito por Diferencial Cambiario - Página ${index + 1} de ${notasDebito.length}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
  })

  return doc.output('datauristring')
}

/**
 * Descargar PDF directamente
 */
export function descargarPDF(dataUri: string, nombreArchivo: string): void {
  const link = document.createElement('a')
  link.href = dataUri
  link.download = `${nombreArchivo}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Generar y descargar recibo de pago
 */
export function descargarReciboPDF(
  recibo: ReciboPago,
  facturas: FacturaCuentaPorPagar[],
  empresa: EmpresaInfo
): void {
  const pdfDataUri = generarReciboPDF(recibo, facturas, empresa)
  const nombreArchivo = `recibo-${recibo.numeroRecibo}-${new Date().toISOString().split('T')[0]}`
  descargarPDF(pdfDataUri, nombreArchivo)
}

/**
 * Generar y descargar notas de débito
 */
export function descargarNotasDebitoPDF(
  notasDebito: NotaDebitoGenerada[],
  empresa: EmpresaInfo,
  reciboNumero?: string
): void {
  const pdfDataUri = generarNotasDebitoPDF(notasDebito, empresa)
  const nombreArchivo = reciboNumero 
    ? `notas-debito-${reciboNumero}-${new Date().toISOString().split('T')[0]}`
    : `notas-debito-${new Date().toISOString().split('T')[0]}`
  descargarPDF(pdfDataUri, nombreArchivo)
}

/**
 * Previsualizar PDF en nueva ventana
 */
export function previsualizarPDF(dataUri: string, titulo: string): void {
  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.title = titulo
    newWindow.document.body.innerHTML = `
      <iframe 
        src="${dataUri}" 
        style="width: 100%; height: 100%; border: none;"
        title="${titulo}">
      </iframe>
    `
  }
}

/**
 * Obtener información de la empresa para los PDFs
 */
export function getEmpresaInfoFromCompany(company: any): EmpresaInfo {
  return {
    nombre: company.name || 'Empresa',
    rif: company.rif || 'J-00000000-0',
    direccion: company.address || 'Dirección no especificada',
    telefono: company.phone,
    email: company.email
  }
}