// src/types/comparadorPrecios.ts

export interface ListaPrecio {
  id: string
  companyId: string
  proveedorId: string
  proveedorNombre: string
  fechaLista: Date
  fechaCarga: Date
  moneda: 'USD' | 'BS'
  tasaCambio?: number
  archivoOriginal: string
  formatoArchivo: 'xlsx' | 'xls' | 'csv'
  estadoProcesamiento: 'pendiente' | 'procesando' | 'completado' | 'error'
  productosExtraidos: number
  configuracionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductoLista {
  id: string
  listaPrecioId: string
  codigoOriginal?: string
  nombreOriginal: string
  nombreNormalizado?: string
  presentacion?: string
  unidadMedida?: string
  precioUnitario: number
  precioMonedaOriginal: number
  moneda: 'USD' | 'BS'
  categoria?: string
  marca?: string
  observaciones?: string
  confianzaExtraccion: number // 0-100
  matchingId?: string // ID del producto maestro matcheado
}

export interface ProductoMaestro {
  id: string
  companyId: string
  codigo: string
  nombre: string
  nombresBusqueda: string[] // Variaciones conocidas del nombre
  presentacion: string
  unidadMedida: string
  categoria: string
  marca?: string
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ConfiguracionProveedor {
  id: string
  companyId: string
  proveedorId: string
  proveedorNombre: string
  formatoEsperado: {
    tipoArchivo: string[]
    columnas?: {
      codigo?: string | number
      nombre: string | number
      precio: string | number
      presentacion?: string | number
    }
    filaInicio?: number
    hojaExcel?: string | number
    separadorCSV?: string
    encoding?: string
  }
  reglasNormalizacion?: {
    removerTexto?: string[]
    reemplazos?: Record<string, string>
    unidadesMedida?: Record<string, string>
  }
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ComparacionPrecios {
  id: string
  companyId: string
  fechaComparacion: Date
  listasComparadas: string[] // IDs de listas de precio
  totalProductos: number
  productosMatcheados: number
  tasaMatcheo: number // Porcentaje
  estadoComparacion: 'pendiente' | 'procesando' | 'completado' | 'error'
  resultadosId?: string // ID del archivo de resultados
  createdAt: Date
  updatedAt: Date
}

export interface ResultadoComparacion {
  id: string
  comparacionId: string
  productoMaestroId: string
  productoNombre: string
  presentacion: string
  precios: PrecioProveedor[]
  mejorPrecio: {
    proveedorId: string
    proveedorNombre: string
    precio: number
    moneda: 'USD' | 'BS'
  }
  diferenciaPorcentual: number // Entre el más bajo y más alto
  alertaPrecio?: 'subida_anormal' | 'bajada_anormal'
}

export interface PrecioProveedor {
  proveedorId: string
  proveedorNombre: string
  listaPrecioId: string
  productoListaId: string
  precio: number
  moneda: 'USD' | 'BS'
  precioUSD: number // Normalizado a USD para comparación
  fechaLista: Date
  confianzaMatch: number
}

// Tipos para la integración con IA
export interface ProcesamientoIA {
  id: string
  listaPrecioId: string
  tipoOperacion: 'extraccion' | 'matching'
  modelo: string // 'gpt-4', 'claude-3', etc
  tokensUsados: number
  costoEstimado: number
  tiempoProcesamiento: number // ms
  exitoso: boolean
  error?: string
  createdAt: Date
}

// Tipos para formularios y UI
export interface FiltrosComparacion {
  proveedores?: string[]
  categorias?: string[]
  fechaDesde?: Date
  fechaHasta?: Date
  soloConAlertas?: boolean
  busqueda?: string
}

export interface EstadisticasComparacion {
  totalProductos: number
  productosConVariacion: number
  promedioDiferenciaPrecio: number
  proveedorMasBarato: {
    id: string
    nombre: string
    porcentaje: number
  }
  proveedorMasCaro: {
    id: string
    nombre: string
    porcentaje: number
  }
  alertasPrecios: number
}

// Enums para constantes
export enum EstadoProcesamiento {
  PENDIENTE = 'pendiente',
  PROCESANDO = 'procesando',
  COMPLETADO = 'completado',
  ERROR = 'error'
}

export enum TipoAlertaPrecio {
  SUBIDA_ANORMAL = 'subida_anormal',
  BAJADA_ANORMAL = 'bajada_anormal'
}

export enum ModeloIA {
  GEMINI_15_FLASH = 'gemini-1.5-flash',
  GEMINI_15_PRO = 'gemini-1.5-pro',
  GEMINI_PRO = 'gemini-pro'
}

// Interfaces para respuestas de servicios
export interface UploadListaResponse {
  listaId: string
  mensaje: string
  productosDetectados?: number
}

export interface ProcesamientoListaResponse {
  listaId: string
  productosExtraidos: number
  productosMatcheados: number
  confianzaPromedio: number
  tiempoProcesamiento: number
  costoIA?: number
}

export interface ComparacionResponse {
  comparacionId: string
  resultados: ResultadoComparacion[]
  estadisticas: EstadisticasComparacion
  archivoExcel?: string
}