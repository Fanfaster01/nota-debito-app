// src/utils/exportExcel.ts
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NotaDebito } from '@/types';
import { formatearFecha } from './dateUtils';
import { calcularMontoFinalPagar } from '@/lib/calculations';

export interface ExportData {
  numero: string;
  fecha: string;
  proveedor: string;
  rifProveedor: string;
  facturaNumero: string;
  facturaFecha: string;
  montoFactura: number;
  notasCredito: string;
  montoNotasCredito: number;
  montoUSDNeto: number;
  tasaCambioOriginal: number;
  tasaCambioPago: number;
  diferencialCambiario: number;
  baseImponible: number;
  iva: number;
  retencionIVA: number;
  montoNetoPagar: number;
  montoFinalPagar: number;
}

export const exportNotasDebitoToExcel = async (
  notasDebito: NotaDebito[],
  filename: string = 'notas_debito',
  filters?: {
    fechaDesde?: string;
    fechaHasta?: string;
    proveedor?: string;
  }
) => {
  try {
    // Crear un nuevo workbook
    const workbook = new ExcelJS.Workbook();
    
    // Configurar propiedades del workbook
    workbook.creator = 'Sistema de Notas de Débito';
    workbook.lastModifiedBy = 'Sistema';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Crear la hoja principal
    const worksheet = workbook.addWorksheet('Notas de Débito', {
      properties: { tabColor: { argb: '0066CC' } }
    });

    // Preparar los datos para exportar
    const exportData: ExportData[] = notasDebito.map((nota) => {
      const montoFinal = calcularMontoFinalPagar(
        nota.factura,
        nota.notasCredito || [],
        nota
      );

      const montoNotasCredito = nota.notasCredito?.reduce(
        (sum, nc) => sum + nc.total,
        0
      ) || 0;

      const notasCreditoNums = nota.notasCredito?.map(nc => nc.numero).join(', ') || 'N/A';

      return {
        numero: `ND-${nota.numero}`,
        fecha: formatearFecha(nota.fecha),
        proveedor: nota.factura.proveedor.nombre,
        rifProveedor: nota.factura.proveedor.rif,
        facturaNumero: nota.factura.numero,
        facturaFecha: formatearFecha(nota.factura.fecha),
        montoFactura: nota.factura.total,
        notasCredito: notasCreditoNums,
        montoNotasCredito: montoNotasCredito,
        montoUSDNeto: nota.montoUSDNeto,
        tasaCambioOriginal: nota.tasaCambioOriginal,
        tasaCambioPago: nota.tasaCambioPago,
        diferencialCambiario: nota.diferencialCambiarioConIVA,
        baseImponible: nota.baseImponibleDiferencial,
        iva: nota.ivaDiferencial,
        retencionIVA: nota.retencionIVADiferencial,
        montoNetoPagar: nota.montoNetoPagarNotaDebito,
        montoFinalPagar: montoFinal,
      };
    });

    // Definir las columnas
    worksheet.columns = [
      { header: 'Número ND', key: 'numero', width: 15 },
      { header: 'Fecha ND', key: 'fecha', width: 12 },
      { header: 'Proveedor', key: 'proveedor', width: 30 },
      { header: 'RIF Proveedor', key: 'rifProveedor', width: 15 },
      { header: 'Nro. Factura', key: 'facturaNumero', width: 15 },
      { header: 'Fecha Factura', key: 'facturaFecha', width: 12 },
      { header: 'Monto Factura (Bs)', key: 'montoFactura', width: 18 },
      { header: 'Notas de Crédito', key: 'notasCredito', width: 20 },
      { header: 'Total NC (Bs)', key: 'montoNotasCredito', width: 15 },
      { header: 'Monto USD Neto', key: 'montoUSDNeto', width: 15 },
      { header: 'Tasa Original', key: 'tasaCambioOriginal', width: 15 },
      { header: 'Tasa al Pago', key: 'tasaCambioPago', width: 15 },
      { header: 'Diferencial (Bs)', key: 'diferencialCambiario', width: 18 },
      { header: 'Base Imponible', key: 'baseImponible', width: 15 },
      { header: 'IVA', key: 'iva', width: 12 },
      { header: 'Retención IVA', key: 'retencionIVA', width: 15 },
      { header: 'Neto a Pagar ND', key: 'montoNetoPagar', width: 18 },
      { header: 'Monto Final Total', key: 'montoFinalPagar', width: 18 },
    ];

    // Estilizar la fila de encabezados
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0066CC' },
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFF' },
        size: 11,
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Agregar los datos
    exportData.forEach((data, index) => {
      const row = worksheet.addRow(data);
      
      // Alternar color de filas
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F5F5F5' },
          };
        });
      }
      
      // Aplicar bordes
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Aplicar formato de número a las columnas monetarias
    const moneyColumns = ['G', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];
    moneyColumns.forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0.00';
    });

    // Agregar una fila de totales
    const lastRowNum = worksheet.rowCount + 2;
    const totalRow = worksheet.getRow(lastRowNum);
    
    totalRow.getCell('F').value = 'TOTALES:';
    totalRow.getCell('F').font = { bold: true };
    
    totalRow.getCell('G').value = { formula: `SUM(G2:G${worksheet.rowCount - 1})` };
    totalRow.getCell('I').value = { formula: `SUM(I2:I${worksheet.rowCount - 1})` };
    totalRow.getCell('M').value = { formula: `SUM(M2:M${worksheet.rowCount - 1})` };
    totalRow.getCell('N').value = { formula: `SUM(N2:N${worksheet.rowCount - 1})` };
    totalRow.getCell('O').value = { formula: `SUM(O2:O${worksheet.rowCount - 1})` };
    totalRow.getCell('P').value = { formula: `SUM(P2:P${worksheet.rowCount - 1})` };
    totalRow.getCell('Q').value = { formula: `SUM(Q2:Q${worksheet.rowCount - 1})` };
    totalRow.getCell('R').value = { formula: `SUM(R2:R${worksheet.rowCount - 1})` };
    
    totalRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E6E6E6' },
      };
      cell.font = { bold: true };
    });

    // Crear hoja de resumen
    const summarySheet = workbook.addWorksheet('Resumen', {
      properties: { tabColor: { argb: '00CC66' } }
    });

    const summaryData = [
      ['Concepto', 'Valor'],
      ['Total de Notas de Débito', notasDebito.length],
      ['Monto Total Diferencial Cambiario', notasDebito.reduce((sum, nd) => sum + nd.diferencialCambiarioConIVA, 0)],
      ['Monto Total Final a Pagar', exportData.reduce((sum, row) => sum + row.montoFinalPagar, 0)],
      ['IVA Total del Diferencial', notasDebito.reduce((sum, nd) => sum + nd.ivaDiferencial, 0)],
      ['Retención IVA Total', notasDebito.reduce((sum, nd) => sum + nd.retencionIVADiferencial, 0)],
      ['', ''],
      ['FILTROS APLICADOS', ''],
      ['Fecha Desde', filters?.fechaDesde || 'No aplicado'],
      ['Fecha Hasta', filters?.fechaHasta || 'No aplicado'],
      ['Proveedor', filters?.proveedor || 'Todos'],
      ['', ''],
      ['Fecha de Exportación', new Date().toLocaleString('es-VE')],
    ];

    summarySheet.columns = [
      { header: '', key: 'concepto', width: 40 },
      { header: '', key: 'valor', width: 30 },
    ];

    summaryData.forEach((row, index) => {
      const addedRow = summarySheet.addRow({ concepto: row[0], valor: row[1] });
      
      if (index === 0 || row[0] === 'FILTROS APLICADOS') {
        addedRow.font = { bold: true, size: 12 };
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0066CC' },
        };
        addedRow.font.color = { argb: 'FFFFFF' };
      }
      
      // Formatear números
      if (typeof row[1] === 'number' && index > 1 && index < 6) {
        addedRow.getCell(2).numFmt = '#,##0.00';
      }
    });

    // Ajustar autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `R${worksheet.rowCount - 2}`,
    };

    // Generar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Descargar el archivo
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);

    return { success: true, error: null };
  } catch (error: any) {
    console.error('Error exportando a Excel:', error);
    return { success: false, error: error.message || 'Error al exportar' };
  }
};