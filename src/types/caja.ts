// src/types/caja.ts - Versión actualizada completa

export interface CajaUI {
    id?: string
    userId: string
    companyId: string
    fecha: Date
    horaApertura: Date
    horaCierre?: Date | null
    montoApertura: number
    montoCierre?: number | null
    tasaDia: number // Nueva propiedad
    totalPagosMovil: number
    cantidadPagosMovil: number
    totalZelleUsd: number // Nueva propiedad
    totalZelleBs: number // Nueva propiedad
    cantidadZelle: number // Nueva propiedad
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
    pagosZelle?: PagoZelleUI[] // Nueva propiedad
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
  
  export interface PagoZelleUI {
    id?: string
    cajaId: string
    montoUsd: number
    tasa: number
    montoBs: number
    fechaHora: Date
    nombreCliente: string
    telefono: string
    userId: string
    companyId: string
  }
  
  export interface CajaResumen {
    fecha: string
    totalPagosMovil: number
    cantidadPagosMovil: number
    totalZelleUsd: number
    totalZelleBs: number
    cantidadZelle: number
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
    pagosZelle: PagoZelleUI[]
    totales: {
      cantidadPagosMovil: number
      montoTotalMovil: number
      cantidadZelle: number
      montoTotalZelleUsd: number
      montoTotalZelleBs: number
      montoTotalGeneral: number // Total en Bs de todo
    }
  }