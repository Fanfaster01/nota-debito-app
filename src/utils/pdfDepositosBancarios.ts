// src/utils/pdfDepositosBancarios.ts
import jsPDF from 'jspdf'
import { ReciboDepositoData } from '@/types/depositos'

export const generateDepositoPDF = (deposito: ReciboDepositoData): void => {
  // Crear PDF en tamaño media carta (carta es 8.5 x 11, media carta es 8.5 x 5.5)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in', 
    format: [8.5, 5.5] // Ancho x Alto en pulgadas
  })

  // Configurar fuente
  pdf.setFont('helvetica')
  
  // Márgenes
  const margin = 0.5
  const pageWidth = 8.5
  const contentWidth = pageWidth - (margin * 2)
  
  let currentY = margin

  // === ENCABEZADO DE LA EMPRESA ===
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text(deposito.empresa.nombre, margin, currentY)
  currentY += 0.25

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`RIF: ${deposito.empresa.rif}`, margin, currentY)
  currentY += 0.4

  // === TÍTULO DEL RECIBO ===
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  const titulo = 'RECIBO DE DEPÓSITO BANCARIO'
  const tituloWidth = pdf.getTextWidth(titulo)
  pdf.text(titulo, (pageWidth - tituloWidth) / 2, currentY)
  currentY += 0.4

  // === NÚMERO DE RECIBO Y FECHA ===
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const numeroRecibo = `No. ${deposito.numeroRecibo.toString().padStart(4, '0')}`
  pdf.text(numeroRecibo, margin, currentY)
  
  const fecha = `Fecha: ${deposito.fechaDeposito.toLocaleDateString('es-VE')}`
  const fechaWidth = pdf.getTextWidth(fecha)
  pdf.text(fecha, pageWidth - margin - fechaWidth, currentY)
  currentY += 0.5

  // === LÍNEA SEPARADORA ===
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.3

  // === DATOS DEL DEPÓSITO ===
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'normal')

  // Banco
  pdf.setFont('helvetica', 'bold')
  pdf.text('Banco:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.banco.nombre, margin + 0.8, currentY)
  currentY += 0.2

  // Número de cuenta
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cuenta No.:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  // Formatear número de cuenta para mejor legibilidad
  const cuentaFormateada = deposito.banco.numeroCuenta.replace(/(\d{4})/g, '$1-').slice(0, -1)
  pdf.text(cuentaFormateada, margin + 0.8, currentY)
  currentY += 0.2

  // Monto
  pdf.setFont('helvetica', 'bold')
  pdf.text('Monto:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  const montoTexto = `Bs. ${deposito.montoBs.toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
  pdf.text(montoTexto, margin + 0.8, currentY)
  currentY += 0.2

  // Usuario que registró
  pdf.setFont('helvetica', 'bold')
  pdf.text('Registrado por:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.usuario.nombre, margin + 1.2, currentY)
  currentY += 0.3

  // Observaciones (si existen)
  if (deposito.observaciones && deposito.observaciones.trim()) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Observaciones:', margin, currentY)
    currentY += 0.15
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    
    // Dividir texto largo en múltiples líneas
    const observacionesLines = pdf.splitTextToSize(deposito.observaciones, contentWidth)
    pdf.text(observacionesLines, margin, currentY)
    currentY += (observacionesLines.length * 0.12) + 0.1
  }

  // === LÍNEA SEPARADORA INFERIOR ===
  currentY += 0.1
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.3

  // === PIE DE PÁGINA ===
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'italic')
  const piePagina = `Recibo generado el ${new Date().toLocaleDateString('es-VE')} a las ${new Date().toLocaleTimeString('es-VE')}`
  const pieWidth = pdf.getTextWidth(piePagina)
  pdf.text(piePagina, (pageWidth - pieWidth) / 2, currentY)

  // === NOTA LEGAL ===
  currentY += 0.25
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  const notaLegal = 'Este recibo es válido para efectos contables y fiscales'
  const notaWidth = pdf.getTextWidth(notaLegal)
  pdf.text(notaLegal, (pageWidth - notaWidth) / 2, currentY)

  // Generar nombre del archivo
  const fileName = `Recibo_Deposito_${deposito.numeroRecibo.toString().padStart(4, '0')}_${deposito.empresa.nombre.replace(/\s+/g, '_')}.pdf`
  
  // Descargar el PDF
  pdf.save(fileName)
}

// Función para obtener datos del depósito y generar PDF
export const downloadDepositoPDF = async (depositoId: string, getReciboData: (id: string) => Promise<any>): Promise<void> => {
  try {
    const { data: reciboData, error } = await getReciboData(depositoId)
    
    if (error) {
      throw new Error(error.message || 'Error al obtener datos del depósito')
    }
    
    if (!reciboData) {
      throw new Error('No se encontraron datos del depósito')
    }
    
    generateDepositoPDF(reciboData)
  } catch (error) {
    console.error('Error al generar PDF:', error)
    throw error
  }
}