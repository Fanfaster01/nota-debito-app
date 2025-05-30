// src/types/caja.ts

export interface CajaUI {
    id?: string
    userId: string
    companyId: string
    fecha: Date
    horaApertura: Date
    horaCierre?: Date | null
    montoApertura: number
    montoCierre?: number | null
    totalPagosMovil: number
    cantidadPagosMovil: number
    estado: 'abierta' | 'cerrada'
    observaciones?: string | null
    // Relaciones
    usuario?: {
      id: string
      full_name: string | null
      email: string
    }
    company?: {
      id: string
      name: string
      rif: string
    }
    pagosMovil?: PagoMovilUI[]
  }
  
  export interface PagoMovilUI {
    id?: string
    cajaId: string
    monto: number
    fechaHora: Date
    nombreCliente: string
    telefono: string
    numeroReferencia: string
    userId: string
    companyId: string
  }
  
  export interface CajaResumen {
    fecha: string
    totalPagosMovil: number
    cantidadPagosMovil: number
    estado: 'abierta' | 'cerrada'
    usuario: string
  }
  
  export interface FiltrosCaja {
    fechaDesde?: Date
    fechaHasta?: Date
    userId?: string
    estado?: 'abierta' | 'cerrada' | 'todas'
  }
  
  export interface ReporteCaja {
    caja: CajaUI
    pagosMovil: PagoMovilUI[]
    totales: {
      cantidadPagos: number
      montoTotal: number
    }
  }