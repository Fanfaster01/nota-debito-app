// src/utils/pdfCierres.ts
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { CierreDetalladoUI, ResumenCierres } from '@/lib/services/cierresCajaService'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const generateCierresListPDF = (
  cierres: CierreDetalladoUI[],
  companyName?: string,
  nombreArchivo?: string
) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Reporte de Cierres de Caja', 14, 22)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32)
  
  if (companyName) {
    doc.text(`Compañía: ${companyName}`, 14, 40)
  }
  
  doc.text(`Total de cierres: ${cierres.length}`, 14, companyName ? 48 : 40)

  // Preparar datos para la tabla
  const tableData = cierres.map(cierre => [
    format(cierre.caja.fecha, 'dd/MM/yyyy'),
    cierre.caja.usuario?.full_name || 'N/A',
    `Bs ${formatMoney(cierre.resumen.totalSistemico)}`,
    `Bs ${formatMoney(cierre.resumen.totalEfectivoContado + cierre.resumen.totalPuntoVenta)}`,
    `Bs ${formatMoney(Math.abs(cierre.resumen.discrepanciaTotal))}`,
    Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? 'Cuadrado' : 'Con Discrepancia'
  ])

  // Crear tabla
  doc.autoTable({
    head: [['Fecha', 'Cajero', 'Total Sistema', 'Total Contado', 'Discrepancia', 'Estado']],
    body: tableData,
    startY: companyName ? 56 : 48,
    styles: {
      fontSize: 10,
      cellPadding: 3
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' }
    }
  })

  // Estadísticas al final
  const finalY = (doc as any).lastAutoTable.finalY + 10
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Estadístico', 14, finalY)
  
  const cierresConDiscrepancias = cierres.filter(c => Math.abs(c.resumen.discrepanciaTotal) >= 1).length
  const totalSistemico = cierres.reduce((sum, c) => sum + c.resumen.totalSistemico, 0)
  const totalContado = cierres.reduce((sum, c) => sum + c.resumen.totalEfectivoContado + c.resumen.totalPuntoVenta, 0)
  const promedioDiscrepancia = cierres.length > 0 ? 
    cierres.reduce((sum, c) => sum + Math.abs(c.resumen.discrepanciaTotal), 0) / cierres.length : 0

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`• Cierres con discrepancias: ${cierresConDiscrepancias} (${((cierresConDiscrepancias / cierres.length) * 100).toFixed(1)}%)`, 14, finalY + 10)
  doc.text(`• Total sistema: Bs ${formatMoney(totalSistemico)}`, 14, finalY + 18)
  doc.text(`• Total contado: Bs ${formatMoney(totalContado)}`, 14, finalY + 26)
  doc.text(`• Promedio de discrepancia: Bs ${formatMoney(promedioDiscrepancia)}`, 14, finalY + 34)

  // Guardar PDF
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `reporte_cierres_${timestamp}.pdf`
  doc.save(fileName)
}

export const generateCierreDetallePDF = (
  cierre: CierreDetalladoUI,
  nombreArchivo?: string
) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Cierre de Caja', 14, 22)
  
  doc.setFontSize(14)
  doc.text(`Fecha: ${format(cierre.caja.fecha, 'dd/MM/yyyy')}`, 14, 35)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  
  // Información general
  let yPos = 50
  doc.setFont('helvetica', 'bold')
  doc.text('Información General', 14, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10
  
  doc.text(`Cajero: ${cierre.caja.usuario?.full_name || 'Sin nombre'}`, 14, yPos)
  yPos += 8
  doc.text(`Compañía: ${cierre.caja.company?.name || 'N/A'}`, 14, yPos)
  yPos += 8
  doc.text(`Hora Apertura: ${format(cierre.caja.horaApertura, 'HH:mm')}`, 14, yPos)
  yPos += 8
  doc.text(`Hora Cierre: ${cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'HH:mm') : 'N/A'}`, 14, yPos)
  yPos += 8
  doc.text(`Tasa del Día: Bs ${formatMoney(cierre.caja.tasaDia)}`, 14, yPos)
  yPos += 15

  // Resumen financiero
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Financiero', 14, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10

  const resumenData = [
    ['Total Sistema', `Bs ${formatMoney(cierre.resumen.totalSistemico)}`],
    ['Total Efectivo Contado', `Bs ${formatMoney(cierre.resumen.totalEfectivoContado)}`],
    ['Total Punto de Venta', `Bs ${formatMoney(cierre.resumen.totalPuntoVenta)}`],
    ['Total Contado', `Bs ${formatMoney(cierre.resumen.totalEfectivoContado + cierre.resumen.totalPuntoVenta)}`],
    ['Discrepancia Total', `Bs ${formatMoney(cierre.resumen.discrepanciaTotal)}`],
    ['Estado', Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? 'Cuadrado' : 'Con Discrepancia']
  ]

  doc.autoTable({
    body: resumenData,
    startY: yPos,
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right' }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Desglose de transacciones
  doc.setFont('helvetica', 'bold')
  doc.text('Desglose de Transacciones', 14, yPos)
  yPos += 10

  const transaccionesData = [
    ['Pagos Móvil', cierre.caja.cantidadPagosMovil.toString(), `Bs ${formatMoney(cierre.caja.totalPagosMovil)}`],
    ['Zelle', cierre.caja.cantidadZelle.toString(), `Bs ${formatMoney(cierre.caja.totalZelleBs)}`],
    ['Notas de Crédito', cierre.caja.cantidadNotasCredito.toString(), `Bs ${formatMoney(cierre.caja.totalNotasCredito)}`],
    ['Créditos', cierre.caja.cantidadCreditos.toString(), `Bs ${formatMoney(cierre.caja.totalCreditosBs)}`]
  ]

  doc.autoTable({
    head: [['Tipo de Transacción', 'Cantidad', 'Monto']],
    body: transaccionesData,
    startY: yPos,
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' }
    }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Detalles de efectivo si existen
  if (cierre.detallesEfectivo) {
    // Verificar si necesitamos nueva página
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Detalles de Efectivo', 14, yPos)
    yPos += 10

    const efectivoData = [
      ['Dólares', `${formatMoney(cierre.detallesEfectivo.efectivo_dolares || 0)}`, `Bs ${formatMoney((cierre.detallesEfectivo.efectivo_dolares || 0) * cierre.caja.tasaDia)}`],
      ['Euros', `${formatMoney(cierre.detallesEfectivo.efectivo_euros || 0)}`, `Bs ${formatMoney((cierre.detallesEfectivo.efectivo_euros || 0) * cierre.caja.tasaDia * 1.1)}`],
      ['Bolívares', '', `Bs ${formatMoney(cierre.detallesEfectivo.efectivo_bs || 0)}`],
      ['Fondo Caja USD', `${formatMoney(cierre.detallesEfectivo.fondo_caja_dolares || 0)}`, ''],
      ['Fondo Caja Bs', '', `Bs ${formatMoney(cierre.detallesEfectivo.fondo_caja_bs || 0)}`],
      ['Report Z', '', `Bs ${formatMoney(cierre.detallesEfectivo.reporte_z || 0)}`]
    ]

    doc.autoTable({
      head: [['Tipo', 'Cantidad Original', 'Equivalente Bs']],
      body: efectivoData,
      startY: yPos,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10
  }

  // Punto de venta si existen
  if (cierre.detallesPuntoVenta.length > 0) {
    // Verificar si necesitamos nueva página
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Cierres de Punto de Venta', 14, yPos)
    yPos += 10

    const pvData = cierre.detallesPuntoVenta.map(pv => [
      pv.banco.nombre,
      pv.banco.codigo,
      `${formatMoney(pv.monto_usd)}`,
      `Bs ${formatMoney(pv.monto_bs)}`,
      pv.numero_lote || 'N/A'
    ])

    doc.autoTable({
      head: [['Banco', 'Código', 'Monto USD', 'Monto Bs', 'Lote']],
      body: pvData,
      startY: yPos,
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    })
  }

  // Observaciones si existen
  if (cierre.caja.observaciones) {
    yPos = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 15 : yPos + 15
    
    // Verificar si necesitamos nueva página
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones', 14, yPos)
    yPos += 10
    
    doc.setFont('helvetica', 'normal')
    const splitObservaciones = doc.splitTextToSize(cierre.caja.observaciones, 180)
    doc.text(splitObservaciones, 14, yPos)
  }

  // Guardar PDF
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fechaCierre = format(cierre.caja.fecha, 'yyyyMMdd')
  const fileName = nombreArchivo || `cierre_detalle_${fechaCierre}_${timestamp}.pdf`
  doc.save(fileName)
}

export const generateResumenCierresPDF = (
  resumen: ResumenCierres,
  nombreArchivo?: string
) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Estadístico de Cierres', 14, 22)
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 35)

  // Métricas principales
  let yPos = 50
  doc.setFont('helvetica', 'bold')
  doc.text('Métricas Principales', 14, yPos)
  yPos += 15

  const metricas = [
    ['Total de Cierres', resumen.totalCierres.toString()],
    ['Cierres con Discrepancias', `${resumen.cierresConDiscrepancias} (${((resumen.cierresConDiscrepancias / resumen.totalCierres) * 100).toFixed(1)}%)`],
    ['Promedio de Discrepancia', `Bs ${formatMoney(resumen.promedioDiscrepancia)}`],
    ['Total Efectivo Contado', `Bs ${formatMoney(resumen.totalEfectivoContado)}`],
    ['Total Sistema', `Bs ${formatMoney(resumen.totalSistemico)}`],
    ['Total Punto de Venta', `Bs ${formatMoney(resumen.totalPuntoVenta)}`],
    ['Monto Total Cierres', `Bs ${formatMoney(resumen.montoTotalCierres)}`]
  ]

  doc.autoTable({
    body: metricas,
    startY: yPos,
    styles: { fontSize: 11 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right' }
    }
  })

  // Usuarios más activos
  if (resumen.usuariosMasActivos.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 20

    doc.setFont('helvetica', 'bold')
    doc.text('Usuarios Más Activos', 14, yPos)
    yPos += 10

    const usuariosData = resumen.usuariosMasActivos.map((usuario, index) => [
      (index + 1).toString(),
      usuario.nombreUsuario,
      usuario.cantidadCierres.toString(),
      `Bs ${formatMoney(usuario.promedioDiscrepancia)}`,
      usuario.promedioDiscrepancia < 10 ? 'Excelente' : 
      usuario.promedioDiscrepancia < 50 ? 'Buena' : 'Requiere Mejora'
    ])

    doc.autoTable({
      head: [['#', 'Nombre', 'Cierres', 'Promedio Discrepancia', 'Calificación']],
      body: usuariosData,
      startY: yPos,
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      }
    })
  }

  // Conclusiones y recomendaciones
  yPos = (doc as any).lastAutoTable.finalY + 20

  doc.setFont('helvetica', 'bold')
  doc.text('Conclusiones y Recomendaciones', 14, yPos)
  yPos += 10

  doc.setFont('helvetica', 'normal')
  const eficiencia = ((resumen.totalCierres - resumen.cierresConDiscrepancias) / resumen.totalCierres) * 100

  const conclusiones = []
  
  if (eficiencia >= 90) {
    conclusiones.push('• Excelente rendimiento general en los cierres de caja.')
  } else if (eficiencia >= 75) {
    conclusiones.push('• Buen rendimiento con oportunidades de mejora.')
  } else {
    conclusiones.push('• Rendimiento bajo, se requiere intervención inmediata.')
  }

  if (resumen.promedioDiscrepancia > 50) {
    conclusiones.push('• Promedio de discrepancia alto, revisar procedimientos de conteo.')
  } else if (resumen.promedioDiscrepancia > 20) {
    conclusiones.push('• Promedio de discrepancia moderado, capacitación recomendada.')
  } else {
    conclusiones.push('• Promedio de discrepancia aceptable.')
  }

  conclusiones.push('• Realizar seguimiento continuo de los cajeros con mayor promedio de discrepancia.')
  conclusiones.push('• Implementar capacitaciones periódicas sobre procedimientos de cierre.')

  conclusiones.forEach(conclusion => {
    doc.text(conclusion, 14, yPos)
    yPos += 8
  })

  // Guardar PDF
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const fileName = nombreArchivo || `resumen_cierres_${timestamp}.pdf`
  doc.save(fileName)
}