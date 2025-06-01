// src/components/pdf/NotaDebitoPDF.tsx
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer,
  PDFDownloadLink
} from '@react-pdf/renderer';
import { format, addDays } from 'date-fns';
import { NotaDebito, NotaCredito } from '@/types';

// Función auxiliar para corregir fechas
const formatearFecha = (fecha: Date | string | undefined): string => {
  if (!fecha) return '-';
  
  // Si es un string, convertir a Date
  let fechaObj: Date;
  if (typeof fecha === 'string') {
    fechaObj = new Date(fecha);
  } else {
    fechaObj = fecha;
  }
  
  // Compensamos el problema de zona horaria añadiendo un día
  fechaObj = addDays(fechaObj, 1);
  
  return format(fechaObj, 'dd/MM/yyyy');
};

// Cálculo del total de las notas de crédito
const calcularTotalNotasCredito = (notasCredito: NotaCredito[] | undefined): {
  totalUSD: number;
  totalBs: number;
  totalRetencion: number;
  totalPagar: number;
} => {
  if (!notasCredito || notasCredito.length === 0) {
    return {
      totalUSD: 0,
      totalBs: 0,
      totalRetencion: 0,
      totalPagar: 0
    };
  }
  
  return notasCredito.reduce((acum, nota) => {
    const montoUSD = nota.montoUSD || nota.total / nota.tasaCambio;
    return {
      totalUSD: acum.totalUSD + montoUSD,
      totalBs: acum.totalBs + nota.total,
      totalRetencion: acum.totalRetencion + nota.retencionIVA,
      totalPagar: acum.totalPagar + (nota.total - nota.retencionIVA),
    };
  }, { totalUSD: 0, totalBs: 0, totalRetencion: 0, totalPagar: 0 });
};

// Definir estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
    paddingHorizontal: 5,
  },
  label: {
    width: 130,
    fontWeight: 'bold',
    fontSize: 8,
  },
  value: {
    flex: 1,
    fontSize: 8,
  },
  table: {
    marginTop: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#000',
    padding: 3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 3,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    paddingHorizontal: 2,
  },
  bold: {
    fontWeight: 'bold',
  },
  total: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#000',
    fontSize: 7,
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '30%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 3,
    textAlign: 'center',
    fontSize: 8,
  },
  legal: {
    fontSize: 7,
    marginBottom: 3,
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  calculation: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    marginTop: 5,
    borderRadius: 3,
    fontSize: 7,
  },
  notaCreditoItem: {
    marginBottom: 3,
    fontSize: 7,
  },
  notasCreditoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    marginTop: 5,
    borderRadius: 3,
    maxHeight: 50,
  },
});

interface NotaDebitoPDFProps {
  notaDebito: NotaDebito;
  montoFinalPagar: number;
}

// Componente para visualizar el PDF
export const NotaDebitoPDFViewer: React.FC<NotaDebitoPDFProps> = ({ notaDebito, montoFinalPagar }) => {
  return (
    <PDFViewer style={{ width: '100%', height: '600px' }}>
      <NotaDebitoPDFDocument notaDebito={notaDebito} montoFinalPagar={montoFinalPagar} />
    </PDFViewer>
  );
};

// Componente para descargar el PDF con children opcionales
export const NotaDebitoPDFDownloadLink: React.FC<NotaDebitoPDFProps & { children?: React.ReactNode }> = ({ 
  notaDebito, 
  montoFinalPagar,
  children 
}) => {
  const filename = `nota_debito_${notaDebito.factura.numero}_${format(notaDebito.fecha, 'dd-MM-yyyy')}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={<NotaDebitoPDFDocument notaDebito={notaDebito} montoFinalPagar={montoFinalPagar} />} 
      fileName={filename}
      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 bg-blue-600 text-white hover:bg-blue-700"
    >
      {({ loading }) => (
        loading ? 'Generando PDF...' : (children || 'Descargar PDF')
      )}
    </PDFDownloadLink>
  );
};

// Documento PDF
const NotaDebitoPDFDocument: React.FC<NotaDebitoPDFProps> = ({ notaDebito, montoFinalPagar }) => {
  const { factura, notasCredito } = notaDebito;
  const totalesNotasCredito = calcularTotalNotasCredito(notasCredito);
  const hasNotasCredito = notasCredito && notasCredito.length > 0;
  
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.horizontalLayout}>
          {/* Columna izquierda */}
          <View style={[styles.column, { width: '60%' }]}>
            {/* Encabezado */}
            <Text style={styles.header}>NOTA DE DÉBITO</Text>
            <Text style={{ textAlign: 'center', marginBottom: 10, fontSize: 10 }}>Por Ajuste de Diferencial Cambiario</Text>
            
            {/* Información del documento */}
            <View style={styles.section}>
              <View style={styles.row}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>{formatearFecha(notaDebito.fecha)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Número:</Text>
                <Text style={styles.value}>ND-{notaDebito.numero || 'XXXXX'}</Text>
              </View>
            </View>
            
            {/* Datos del Proveedor */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Datos del Proveedor:</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Razón Social:</Text>
                <Text style={styles.value}>{factura.proveedor.nombre}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>RIF:</Text>
                <Text style={styles.value}>{factura.proveedor.rif}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección:</Text>
                <Text style={styles.value}>{factura.proveedor.direccion}</Text>
              </View>
            </View>
            
            {/* Datos del Cliente */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Datos del Cliente:</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Razón Social:</Text>
                <Text style={styles.value}>{factura.cliente.nombre}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>RIF:</Text>
                <Text style={styles.value}>{factura.cliente.rif}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Dirección:</Text>
                <Text style={styles.value}>{factura.cliente.direccion}</Text>
              </View>
            </View>
            
            {/* Referencia a la Factura */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Referencia:</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Factura Original:</Text>
                <Text style={styles.value}>{factura.numero} del {formatearFecha(factura.fecha)}</Text>
              </View>
              
              {/* Mostrar notas de crédito si existen */}
              {hasNotasCredito && (
                <View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Notas de Crédito:</Text>
                    <Text style={styles.value}>{notasCredito.length} nota{notasCredito.length > 1 ? 's' : ''} asociada{notasCredito.length > 1 ? 's' : ''}</Text>
                  </View>
                  
                  {/* Lista de notas de crédito */}
                  <View style={[styles.row, { marginLeft: 20 }]}>
                    <View style={styles.notasCreditoContainer}>
                      {notasCredito.map((nc, idx) => (
                        <Text key={idx} style={styles.notaCreditoItem}>
                          • {nc.numero} del {formatearFecha(nc.fecha)} - Bs. {nc.total.toFixed(2)} ($ {nc.montoUSD.toFixed(2)})
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Detalle del cálculo original en moneda extranjera */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Cálculo del Monto en Moneda Extranjera:</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Factura Original en USD:</Text>
                <Text style={styles.value}>$ {factura.montoUSD.toFixed(2)}</Text>
              </View>
              {hasNotasCredito && (
                <View style={styles.row}>
                  <Text style={styles.label}>Total Notas de Crédito en USD:</Text>
                  <Text style={styles.value}>$ {totalesNotasCredito.totalUSD.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Monto Neto en USD:</Text>
                <Text style={styles.value}>$ {notaDebito.montoUSDNeto.toFixed(2)}</Text>
              </View>
            </View>
            
            {/* Fundamento Legal - Resumido */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Fundamento Legal:</Text>
              <Text style={styles.legal}>1. Artículo 23 de la Ley del IVA: Establece que cualquier ajuste posterior al precio original constituye un elemento a considerar en la determinación de la obligación tributaria.</Text>
              <Text style={styles.legal}>2. Artículo 51 del Reglamento de la Ley del IVA: Cuando el precio esté sujeto a modificación del tipo de cambio, la diferencia debe ajustarse mediante notas de débito o crédito.</Text>
              <Text style={styles.legal}>3. Artículo 128 de la Ley del BCV: Los pagos en monedas extranjeras se cancelan con lo equivalente en moneda de curso legal, al tipo de cambio de la fecha de pago.</Text>
            </View>
          </View>
          
          {/* Columna derecha */}
          <View style={[styles.column, { width: '40%' }]}>
            {/* Detalle del Diferencial Cambiario */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Detalle del Diferencial Cambiario:</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Tasa Original:</Text>
                <Text style={styles.value}>Bs. {notaDebito.tasaCambioOriginal.toFixed(2)}/USD</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tasa al Pago:</Text>
                <Text style={styles.value}>Bs. {notaDebito.tasaCambioPago.toFixed(2)}/USD</Text>
              </View>
              
              {/* Detalle de cálculos */}
              <View style={styles.calculation}>
                <Text style={{fontWeight: 'bold'}}>Detalle del cálculo:</Text>
                <Text>Monto neto en USD: $ {notaDebito.montoUSDNeto.toFixed(2)}</Text>
                <Text>Valor en Bs. con tasa original: $ {notaDebito.montoUSDNeto.toFixed(2)} × Bs. {notaDebito.tasaCambioOriginal.toFixed(2)}/USD = Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioOriginal).toFixed(2)}</Text>
                <Text>Valor en Bs. con tasa de pago: $ {notaDebito.montoUSDNeto.toFixed(2)} × Bs. {notaDebito.tasaCambioPago.toFixed(2)}/USD = Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioPago).toFixed(2)}</Text>
                <Text>Diferencial cambiario (con IVA): Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioPago).toFixed(2)} - Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioOriginal).toFixed(2)} = Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)}</Text>
                <Text>Base imponible (sin IVA): Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)} ÷ {(1 + factura.alicuotaIVA / 100).toFixed(2)} = Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)}</Text>
                <Text>IVA ({factura.alicuotaIVA}%): Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)} - Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)} = Bs. {notaDebito.ivaDiferencial.toFixed(2)}</Text>
              </View>
            </View>
            
            {/* Tabla de Cálculos */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Cálculo de la Nota de Débito:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.bold]}>Concepto</Text>
                  <Text style={[styles.tableCell, styles.bold]}>Monto (Bs.)</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Diferencial Cambiario (Base Imponible)</Text>
                  <Text style={styles.tableCell}>{notaDebito.baseImponibleDiferencial.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>IVA ({factura.alicuotaIVA}%)</Text>
                  <Text style={styles.tableCell}>{notaDebito.ivaDiferencial.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.bold]}>Total Nota de Débito</Text>
                  <Text style={[styles.tableCell, styles.bold]}>{notaDebito.diferencialCambiarioConIVA.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Retención IVA ({factura.porcentajeRetencion}%)</Text>
                  <Text style={styles.tableCell}>-{notaDebito.retencionIVADiferencial.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.bold]}>Monto a pagar después de retención</Text>
                  <Text style={[styles.tableCell, styles.bold]}>{notaDebito.montoNetoPagarNotaDebito.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
            {/* Monto Final a Pagar */}
            <View style={styles.section}>
              <Text style={styles.subheader}>Resumen de la Operación:</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.bold]}>Concepto</Text>
                  <Text style={[styles.tableCell, styles.bold]}>Monto (Bs.)</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Factura Original (después de retención)</Text>
                  <Text style={styles.tableCell}>{(factura.total - factura.retencionIVA).toFixed(2)}</Text>
                </View>
                {hasNotasCredito && (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Notas de Crédito (después de retención)</Text>
                    <Text style={styles.tableCell}>-{totalesNotasCredito.totalPagar.toFixed(2)}</Text>
                  </View>
                )}
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>Nota de Débito por Diferencial Cambiario (después de retención)</Text>
                  <Text style={styles.tableCell}>{notaDebito.montoNetoPagarNotaDebito.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.bold]}>MONTO FINAL A PAGAR</Text>
                  <Text style={[styles.tableCell, styles.bold]}>{montoFinalPagar.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            
            {/* Sección de firmas */}
            <View style={styles.signatureSection}>
              <View style={styles.signatureBox}>
                <Text style={{fontSize: 8}}>Elaborado por</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{fontSize: 8}}>Autorizado por</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={{fontSize: 8}}>Recibido por</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>Este documento se emite en cumplimiento de lo establecido en la normativa fiscal vigente y tiene pleno valor legal para justificar el pago adicional por concepto de diferencial cambiario.</Text>
        </View>
      </Page>
    </Document>
  );
};