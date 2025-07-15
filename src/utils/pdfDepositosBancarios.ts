// src/utils/pdfDepositosBancarios.ts
import jsPDF from 'jspdf'
import { ReciboDepositoData } from '@/types/depositos'
import { handleServiceError } from '@/utils/errorHandler'

export const generateDepositoPDF = (deposito: ReciboDepositoData): void => {
  // Crear PDF en tamaño media carta (5.5 x 8.5 pulgadas)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in', 
    format: [5.5, 8.5] // Ancho x Alto en pulgadas - media carta
  })

  // Configurar fuente
  pdf.setFont('helvetica')
  
  // Márgenes más compactos para media carta
  const margin = 0.4
  const pageWidth = 5.5
  const pageHeight = 8.5
  const contentWidth = pageWidth - (margin * 2)
  
  let currentY = margin

  // === ENCABEZADO DE LA EMPRESA ===
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(deposito.empresa.nombre, margin, currentY)
  currentY += 0.2

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`RIF: ${deposito.empresa.rif}`, margin, currentY)
  currentY += 0.3

  // === TÍTULO DEL RECIBO ===
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const titulo = 'RECIBO DE DEPÓSITO BANCARIO'
  const tituloWidth = pdf.getTextWidth(titulo)
  pdf.text(titulo, (pageWidth - tituloWidth) / 2, currentY)
  currentY += 0.3

  // === NÚMERO DE RECIBO Y FECHA ===
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  const numeroRecibo = `No. ${deposito.numeroRecibo.toString().padStart(4, '0')}`
  pdf.text(numeroRecibo, margin, currentY)
  
  const fecha = `Fecha: ${deposito.fechaDeposito.toLocaleDateString('es-VE')}`
  const fechaWidth = pdf.getTextWidth(fecha)
  pdf.text(fecha, pageWidth - margin - fechaWidth, currentY)
  currentY += 0.4

  // === LÍNEA SEPARADORA ===
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.25

  // === DATOS DEL DEPÓSITO ===
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')

  // Banco
  pdf.setFont('helvetica', 'bold')
  pdf.text('Banco:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.banco.nombre, margin + 0.7, currentY)
  currentY += 0.18

  // Número de cuenta
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cuenta:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  // Formatear número de cuenta para mejor legibilidad
  const cuentaFormateada = deposito.banco.numeroCuenta.replace(/(\d{4})/g, '$1-').slice(0, -1)
  pdf.text(cuentaFormateada, margin + 0.7, currentY)
  currentY += 0.18

  // Monto
  pdf.setFont('helvetica', 'bold')
  pdf.text('Monto:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  const montoTexto = `Bs. ${deposito.montoBs.toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
  pdf.text(montoTexto, margin + 0.7, currentY)
  currentY += 0.18

  // Usuario que registró
  pdf.setFont('helvetica', 'bold')
  pdf.text('Registrado por:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.usuario.nombre, margin + 1.0, currentY)
  currentY += 0.25

  // Observaciones (si existen)
  if (deposito.observaciones && deposito.observaciones.trim()) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Observaciones:', margin, currentY)
    currentY += 0.12
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    
    // Dividir texto largo en múltiples líneas
    const observacionesLines = pdf.splitTextToSize(deposito.observaciones, contentWidth)
    pdf.text(observacionesLines, margin, currentY)
    currentY += (observacionesLines.length * 0.1) + 0.15
  }

  // === LÍNEA SEPARADORA INFERIOR ===
  currentY += 0.15
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.25

  // === PIE DE PÁGINA ===
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'italic')
  const piePagina = `Generado: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`
  const pieWidth = pdf.getTextWidth(piePagina)
  pdf.text(piePagina, (pageWidth - pieWidth) / 2, currentY)

  // === NOTA LEGAL ===
  currentY += 0.2
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  const notaLegal = 'Recibo válido para efectos contables y fiscales'
  const notaWidth = pdf.getTextWidth(notaLegal)
  pdf.text(notaLegal, (pageWidth - notaWidth) / 2, currentY)

  // Generar nombre del archivo
  const fileName = `Recibo_Deposito_${deposito.numeroRecibo.toString().padStart(4, '0')}_${deposito.empresa.nombre.replace(/\s+/g, '_')}.pdf`
  
  // Descargar el PDF
  pdf.save(fileName)
}

// Función para generar PDF y obtener data URI para vista previa
export const generateDepositoPDFDataURI = (deposito: ReciboDepositoData): string => {
  // Crear PDF en tamaño media carta (5.5 x 8.5 pulgadas)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in', 
    format: [5.5, 8.5] // Ancho x Alto en pulgadas - media carta
  })

  // Configurar fuente
  pdf.setFont('helvetica')
  
  // Márgenes más compactos para media carta
  const margin = 0.4
  const pageWidth = 5.5
  const pageHeight = 8.5
  const contentWidth = pageWidth - (margin * 2)
  
  let currentY = margin

  // === ENCABEZADO DE LA EMPRESA ===
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(deposito.empresa.nombre, margin, currentY)
  currentY += 0.2

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`RIF: ${deposito.empresa.rif}`, margin, currentY)
  currentY += 0.3

  // === TÍTULO DEL RECIBO ===
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  const titulo = 'RECIBO DE DEPÓSITO BANCARIO'
  const tituloWidth = pdf.getTextWidth(titulo)
  pdf.text(titulo, (pageWidth - tituloWidth) / 2, currentY)
  currentY += 0.3

  // === NÚMERO DE RECIBO Y FECHA ===
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  const numeroRecibo = `No. ${deposito.numeroRecibo.toString().padStart(4, '0')}`
  pdf.text(numeroRecibo, margin, currentY)
  
  const fecha = `Fecha: ${deposito.fechaDeposito.toLocaleDateString('es-VE')}`
  const fechaWidth = pdf.getTextWidth(fecha)
  pdf.text(fecha, pageWidth - margin - fechaWidth, currentY)
  currentY += 0.4

  // === LÍNEA SEPARADORA ===
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.25

  // === DATOS DEL DEPÓSITO ===
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')

  // Banco
  pdf.setFont('helvetica', 'bold')
  pdf.text('Banco:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.banco.nombre, margin + 0.7, currentY)
  currentY += 0.18

  // Número de cuenta
  pdf.setFont('helvetica', 'bold')
  pdf.text('Cuenta:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  // Formatear número de cuenta para mejor legibilidad
  const cuentaFormateada = deposito.banco.numeroCuenta.replace(/(\d{4})/g, '$1-').slice(0, -1)
  pdf.text(cuentaFormateada, margin + 0.7, currentY)
  currentY += 0.18

  // Monto
  pdf.setFont('helvetica', 'bold')
  pdf.text('Monto:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  const montoTexto = `Bs. ${deposito.montoBs.toLocaleString('es-VE', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`
  pdf.text(montoTexto, margin + 0.7, currentY)
  currentY += 0.18

  // Usuario que registró
  pdf.setFont('helvetica', 'bold')
  pdf.text('Registrado por:', margin, currentY)
  pdf.setFont('helvetica', 'normal')
  pdf.text(deposito.usuario.nombre, margin + 1.0, currentY)
  currentY += 0.25

  // Observaciones (si existen)
  if (deposito.observaciones && deposito.observaciones.trim()) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Observaciones:', margin, currentY)
    currentY += 0.12
    
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    
    // Dividir texto largo en múltiples líneas
    const observacionesLines = pdf.splitTextToSize(deposito.observaciones, contentWidth)
    pdf.text(observacionesLines, margin, currentY)
    currentY += (observacionesLines.length * 0.1) + 0.15
  }

  // === LÍNEA SEPARADORA INFERIOR ===
  currentY += 0.15
  pdf.setLineWidth(0.01)
  pdf.line(margin, currentY, pageWidth - margin, currentY)
  currentY += 0.25

  // === PIE DE PÁGINA ===
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'italic')
  const piePagina = `Generado: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`
  const pieWidth = pdf.getTextWidth(piePagina)
  pdf.text(piePagina, (pageWidth - pieWidth) / 2, currentY)

  // === NOTA LEGAL ===
  currentY += 0.2
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  const notaLegal = 'Recibo válido para efectos contables y fiscales'
  const notaWidth = pdf.getTextWidth(notaLegal)
  pdf.text(notaLegal, (pageWidth - notaWidth) / 2, currentY)

  // Retornar el data URI
  return pdf.output('datauristring')
}

// Función para previsualizar PDF en nueva ventana
export const previewDepositoPDF = async (depositoId: string, getReciboData: (id: string) => Promise<{ data: unknown, error: unknown }>): Promise<void> => {
  try {
    const { data: reciboData, error } = await getReciboData(depositoId)
    
    if (error) {
      throw new Error(handleServiceError(error, 'Error al obtener datos del depósito'))
    }
    
    if (!reciboData) {
      throw new Error('No se encontraron datos del depósito')
    }
    
    const dataUri = generateDepositoPDFDataURI(reciboData as ReciboDepositoData)
    const numeroRecibo = (reciboData as ReciboDepositoData).numeroRecibo.toString().padStart(4, '0')
    const titulo = `Recibo de Depósito #${numeroRecibo}`
    
    // Previsualizar en nueva ventana
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.title = titulo
      newWindow.document.body.innerHTML = `
        <div style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 15px;">
            <h2 style="margin: 0 0 10px 0; color: #333;">${titulo}</h2>
            <div style="margin-bottom: 15px;">
              <button onclick="window.print()" style="
                background: #3b82f6; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer;
                margin-right: 10px;
                font-size: 14px;
              ">🖨️ Imprimir</button>
              <button onclick="downloadPDF()" style="
                background: #10b981; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 14px;
              ">📥 Descargar</button>
            </div>
          </div>
          <iframe 
            src="${dataUri}" 
            style="width: 100%; height: calc(100vh - 120px); border: 1px solid #ddd; border-radius: 4px;"
            title="${titulo}">
          </iframe>
          <script>
            function downloadPDF() {
              const link = document.createElement('a');
              link.href = '${dataUri}';
              link.download = 'Recibo_Deposito_${numeroRecibo}_${(reciboData as ReciboDepositoData).empresa.nombre.replace(/\s+/g, '_')}.pdf';
              link.click();
            }
          </script>
        </div>
      `
    }
  } catch (error) {
    console.error('Error al previsualizar PDF:', error)
    throw error
  }
}

// Función para obtener datos del depósito y generar PDF
export const downloadDepositoPDF = async (depositoId: string, getReciboData: (id: string) => Promise<{ data: unknown, error: unknown }>): Promise<void> => {
  try {
    const { data: reciboData, error } = await getReciboData(depositoId)
    
    if (error) {
      throw new Error(handleServiceError(error, 'Error al obtener datos del depósito'))
    }
    
    if (!reciboData) {
      throw new Error('No se encontraron datos del depósito')
    }
    
    generateDepositoPDF(reciboData as ReciboDepositoData)
  } catch (error) {
    console.error('Error al generar PDF:', error)
    throw error
  }
}