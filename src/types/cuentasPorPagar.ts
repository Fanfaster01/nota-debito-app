// Tipos para el módulo de Cuentas por Pagar

export type EstadoPago = 'pendiente' | 'pagada' | 'pendiente_aprobacion' | 'vencida'
export type TipoPago = 'deposito' | 'efectivo'
export type TipoRecibo = 'individual' | 'lote'
export type TipoCambio = 'USD' | 'EUR' | 'PAR'

// Factura extendida para cuentas por pagar
export interface FacturaCuentaPorPagar {
  id: string
  numero: string
  numeroControl: string
  fecha: string
  fechaVencimiento?: string
  estadoPago: EstadoPago
  fechaPago?: string
  notasPago?: string
  tipoPago: TipoPago
  
  // Datos del proveedor
  proveedorNombre: string
  proveedorRif: string
  proveedorDireccion: string
  
  // Datos del cliente (empresa)
  clienteNombre: string
  clienteRif: string
  clienteDireccion: string
  
  // Montos originales
  subTotal: number
  montoExento: number
  baseImponible: number
  alicuotaIVA: number
  iva: number
  total: number
  tasaCambio: number
  montoUSD: number
  porcentajeRetencion: number
  retencionIVA: number
  
  // Datos adicionales
  companyId: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Calculados para cuentas por pagar
  diasVencimiento?: number
  montoFinalPagar?: number
  notaDebitoGenerada?: boolean
}

// Dashboard metrics
export interface MetricasCuentasPorPagar {
  totalFacturas: number
  totalMontoPendiente: number
  facturasVencidas: number
  montoVencido: number
  facturasPorVencer: number // próximos 7 días
  montoPorVencer: number
  facturasPagadas: number
  montoPagado: number
  facturasPendientesAprobacion: number
  montoPendienteAprobacion: number
}

// Filtros para búsqueda
export interface FiltrosCuentasPorPagar {
  proveedor?: string
  estadoPago?: EstadoPago
  tipoPago?: TipoPago
  fechaDesde?: string
  fechaHasta?: string
  fechaVencimientoDesde?: string
  fechaVencimientoHasta?: string
  montoMinimo?: number
  montoMaximo?: number
  busqueda?: string // número de factura o proveedor
}

// Paginación
export interface PaginacionFacturas {
  page: number
  limit: number
  total: number
  totalPages: number
  facturas: FacturaCuentaPorPagar[]
}

// Recibo de pago
export interface ReciboPago {
  id: string
  numeroRecibo: string
  companyId: string
  tipoRecibo: TipoRecibo
  tipoPago: TipoPago
  facturasIds: string[]
  montoTotalBs: number
  montoTotalUsd?: number
  bancoDestino?: string
  formatoTxtId?: string
  archivoTxtGenerado: boolean
  notas?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Datos calculados/relacionados
  facturas?: FacturaCuentaPorPagar[]
  notasDebitoGeneradas?: NotaDebitoGenerada[]
}

// Nota de débito generada automáticamente
export interface NotaDebitoGenerada {
  id: string
  numero: string
  facturaId: string
  fecha: string
  tasaCambioOriginal: number
  tasaCambioPago: number
  montoUSDNeto: number
  diferencialCambiarioConIVA: number
  baseImponibleDiferencial: number
  ivaDiferencial: number
  retencionIVADiferencial: number
  montoNetoPagarNotaDebito: number
  companyId: string
  createdBy: string
  createdAt: string
  
  // Datos de la factura asociada
  factura?: FacturaCuentaPorPagar
}

// Formato TXT bancario
export interface FormatoTxtBancario {
  id: string
  nombreBanco: string
  codigoBanco?: string
  descripcion?: string
  formatoTemplate: {
    estructura: string[]
    separador: string
    [key: string]: any
  }
  camposRequeridos: string[]
  separador: string
  extensionArchivo: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

// Proveedor con datos bancarios
export interface ProveedorConBanco {
  id: string
  nombre: string
  rif: string
  direccion: string
  contacto?: string
  telefono?: string
  email?: string
  porcentajeRetencion: number
  tipoCambio: TipoCambio
  bancoId?: string
  bancos?: BancoProveedor[]
  bancoFavorito?: BancoProveedor
  companyId: string
  createdAt: string
  updatedAt: string
}

export interface BancoProveedor {
  id: string
  proveedorId: string
  bancoId: string
  numeroCuenta: string
  tipoCuenta: string
  esFavorita: boolean
  banco?: {
    id: string
    nombre: string
    codigo?: string
  }
}

// Tasas de cambio
export interface TasaCambio {
  moneda: 'USD' | 'EUR'
  tasa: number
  fecha: string
  fuente: string
}

export interface TasaCambioManual {
  moneda: 'PAR'
  tasa: number
  fecha: string
  usuario: string
  notas?: string
}

// Estados de alerta para el dashboard
export interface AlertaVencimiento {
  tipo: 'vencida' | 'por_vencer'
  facturas: FacturaCuentaPorPagar[]
  count: number
  montoTotal: number
}

// Selección múltiple de facturas
export interface SeleccionFacturas {
  seleccionadas: string[]
  todas: boolean
  cantidad: number
  montoTotal: number
  tiposPago: TipoPago[]
  proveedores: string[]
}

// Request para generar recibo de pago
export interface GenerarReciboRequest {
  facturasIds: string[]
  tipoPago: TipoPago
  notas?: string
  bancoDestino?: string
  formatoTxtId?: string
  tasaManualPAR?: number // Para proveedores con tipo PAR
}

// Response de generación de recibo
export interface GenerarReciboResponse {
  recibo: ReciboPago
  notasDebito: NotaDebitoGenerada[]
  archivoTxt?: string
  pdfRecibo: string
  pdfNotasDebito: string[]
}

// Datos para gráficos del dashboard
export interface DatosGraficoCuentasPorPagar {
  facturasPorEstado: {
    estado: EstadoPago
    cantidad: number
    monto: number
  }[]
  vencimientosPorMes: {
    mes: string
    cantidad: number
    monto: number
  }[]
  topProveedoresDeuda: {
    proveedor: string
    cantidad: number
    monto: number
  }[]
}

// Form data para formulario de factura
export interface FormDataFactura {
  numero: string
  numeroControl: string
  fecha: string
  fechaVencimiento: string
  proveedorId?: string
  proveedorNombre: string
  proveedorRif: string
  proveedorDireccion: string
  subTotal: number
  montoExento: number
  baseImponible: number
  alicuotaIVA: number
  iva: number
  total: number
  tasaCambio: number
  montoUSD: number
  porcentajeRetencion: number
  retencionIVA: number
}

// Respuesta de validación de facturas para pago
export interface ValidacionPagoFacturas {
  validas: FacturaCuentaPorPagar[]
  invalidas: {
    factura: FacturaCuentaPorPagar
    motivo: string
  }[]
  tiposPagoMezclados: boolean
  proveedoresDiferentes: boolean
  montoTotal: number
  requiereNotasDebito: boolean
}