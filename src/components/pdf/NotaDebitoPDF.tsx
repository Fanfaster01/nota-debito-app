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
import { format } from 'date-fns';
import { NotaDebito } from '@/types';

// Definir estilos para el PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flexDirection: 'column',
    flex: 1,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#000',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 5,
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  total: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
    fontSize: 10,
    textAlign: 'center',
  },
  signatureSection: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    textAlign: 'center',
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

// Componente para descargar el PDF
export const NotaDebitoPDFDownloadLink: React.FC<NotaDebitoPDFProps> = ({ notaDebito, montoFinalPagar }) => {
  const filename = `nota_debito_${notaDebito.factura.numero}_${format(notaDebito.fecha, 'dd-MM-yyyy')}.pdf`;
  
  return (
    <PDFDownloadLink 
      document={<NotaDebitoPDFDocument notaDebito={notaDebito} montoFinalPagar={montoFinalPagar} />} 
      fileName={filename}
      className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none h-10 py-2 px-4 bg-blue-600 text-white hover:bg-blue-700"
    >
      {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
    </PDFDownloadLink>
  );
};

// Documento PDF
const NotaDebitoPDFDocument: React.FC<NotaDebitoPDFProps> = ({ notaDebito, montoFinalPagar }) => {
  const { factura, notaCredito } = notaDebito;
  const fechaFormateada = notaDebito.fecha instanceof Date 
    ? format(notaDebito.fecha, 'dd/MM/yyyy') 
    : '-';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Encabezado */}
        <Text style={styles.header}>NOTA DE DÉBITO</Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>Por Ajuste de Diferencial Cambiario</Text>
        
        {/* Información del documento */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha:</Text>
            <Text style={styles.value}>{fechaFormateada}</Text>
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
            <Text style={styles.value}>{factura.numero} del {factura.fecha instanceof Date ? format(factura.fecha, 'dd/MM/yyyy') : '-'}</Text>
          </View>
          {notaCredito && (
            <View style={styles.row}>
              <Text style={styles.label}>Nota de Crédito:</Text>
              <Text style={styles.value}>{notaCredito.numero} del {notaCredito.fecha instanceof Date ? format(notaCredito.fecha, 'dd/MM/yyyy') : '-'}</Text>
            </View>
          )}
        </View>
        
        {/* Detalle del Diferencial Cambiario */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Detalle del Diferencial Cambiario:</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tasa de Cambio Original:</Text>
            <Text style={styles.value}>Bs. {notaDebito.tasaCambioOriginal.toFixed(2)}/USD</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tasa de Cambio al Pago:</Text>
            <Text style={styles.value}>Bs. {notaDebito.tasaCambioPago.toFixed(2)}/USD</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Monto Neto en USD:</Text>
            <Text style={styles.value}>$ {notaDebito.montoUSDNeto.toFixed(2)}</Text>
          </View>
        </View>
        
        {/* Tabla de Cálculos */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Cálculo:</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.bold]}>Concepto</Text>
              <Text style={[styles.tableCell, styles.bold]}>Monto (Bs.)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Diferencial Cambiario (Base Imponible)</Text>
              <Text style={styles.tableCell}>{notaDebito.diferencialCambiario.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>IVA ({factura.alicuotaIVA}%)</Text>
              <Text style={styles.tableCell}>{notaDebito.ivaDisferencialCambiario.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>Total Nota de Débito</Text>
              <Text style={[styles.tableCell, styles.bold]}>{notaDebito.totalNotaDebito.toFixed(2)}</Text>
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
            {notaCredito && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Nota de Crédito (después de retención)</Text>
                <Text style={styles.tableCell}>-{(notaCredito.total - notaCredito.retencionIVA).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Nota de Débito por Diferencial Cambiario</Text>
              <Text style={styles.tableCell}>{notaDebito.totalNotaDebito.toFixed(2)}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.bold]}>MONTO FINAL A PAGAR</Text>
              <Text style={[styles.tableCell, styles.bold]}>{montoFinalPagar.toFixed(2)}</Text>
            </View>
          </View>
        </View>
        
        {/* Fundamento Legal */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Fundamento Legal:</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>1. Artículo 23 de la Ley del IVA: Establece que cualquier ajuste posterior al precio original constituye un elemento a considerar en la determinación de la obligación tributaria.</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>2. Artículo 51 del Reglamento de la Ley del IVA: Dispone que cuando el precio esté sujeto a modificación del tipo de cambio aplicable, la diferencia debe ajustarse mediante la emisión de notas de débito o crédito.</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>3. Artículo 128 de la Ley del BCV: Establece que "Los pagos estipulados en monedas extranjeras se cancelan, salvo convención especial, con la entrega de lo equivalente en moneda de curso legal, al tipo de cambio corriente en el lugar de la fecha de pago."</Text>
          <Text style={{ fontSize: 10, marginBottom: 5 }}>4. Providencia Administrativa SNAT/2011/0071: Regula la emisión de documentos fiscales, incluyendo las notas de débito para ajustes por cualquier causa.</Text>
        </View>
        
        {/* Sección de firmas */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Elaborado por</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Autorizado por</Text>
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