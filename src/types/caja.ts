// src/types/caja.ts - Versión actualizada completa

export interface CajaUI {
    id?: string
    userId: string
    companyId: string
    fecha: Date
    horaApertura: Date
    horaCierre?: Date | null
    montoApertura: number
    montoAperturaUsd: number
    montoCierre?: number | null
    tasaDia: number // Nueva propiedad
    tipoMoneda: 'USD' | 'EUR' // Tipo de moneda para la tasa
    totalPagosMovil: number
    cantidadPagosMovil: number
    totalZelleUsd: number // Nueva propiedad
    totalZelleBs: number // Nueva propiedad
    cantidadZelle: number // Nueva propiedad
    totalNotasCredito: number
    cantidadNotasCredito: number
    totalCreditosBs: number
    totalCreditosUsd: number
    cantidadCreditos: number
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
    notasCredito?: NotaCreditoCajaUI[]
    creditos?: CreditoCajaUI[]
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

  export interface NotaCreditoCajaUI {
    id?: string
    cajaId: string
    numeroNotaCredito: string
    facturaAfectada: string
    montoBs: number
    nombreCliente: string
    explicacion: string
    fechaHora: Date
    userId: string
    companyId: string
  }

  export interface CreditoCajaUI {
    id?: string
    cajaId: string
    clienteId?: string | null
    cliente?: {
      id: string
      tipoDocumento: 'V' | 'E' | 'J' | 'G' | 'P'
      numeroDocumento: string
      nombre: string
      telefono?: string | null
      direccion?: string | null
    }
    numeroFactura: string
    nombreCliente: string
    telefonoCliente: string
    montoBs: number
    montoUsd: number
    tasa: number
    estado: 'pendiente' | 'pagado'
    fechaHora: Date
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
  
  export interface CierrePuntoVentaUI {
    id?: string
    bancoId: string
    banco?: {
      id: string
      nombre: string
      codigo: string
    }
    montoBs: number
    montoUsd: number
    numeroLote: string
  }

  export interface CierreCajaFormData {
    efectivoDolares: number
    efectivoEuros: number
    efectivoBs: number
    reporteZ: number
    fondoCajaDolares: number
    fondoCajaBs: number
    cierresPuntoVenta: CierrePuntoVentaUI[]
    observaciones?: string
  }

  export interface ReporteCaja {
    caja: CajaUI
    pagosMovil: PagoMovilUI[]
    pagosZelle: PagoZelleUI[]
    notasCredito: NotaCreditoCajaUI[]
    creditos: CreditoCajaUI[]
    totales: {
      cantidadPagosMovil: number
      montoTotalMovil: number
      cantidadZelle: number
      montoTotalZelleUsd: number
      montoTotalZelleBs: number
      cantidadNotasCredito: number
      montoTotalNotasCredito: number
      cantidadCreditos: number
      montoTotalCreditosBs: number
      montoTotalCreditosUsd: number
      montoTotalGeneral: number // Total en Bs de todo
      montoTotalGeneralUsd: number // Total en USD
    }
  }