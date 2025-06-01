// src/types/creditos.ts

export interface CreditoDetalladoUI {
  id: string
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
  fechaVencimiento?: Date | null
  montoAbonado: number
  fechaUltimoPago?: Date | null
  observaciones?: string | null
  userId: string
  companyId: string
  // Campos calculados
  saldoPendiente: number
  estadoVencimiento: 'Pagado' | 'Vencido' | 'Por vencer' | 'Vigente'
  cantidadAbonos: number
  usuario?: {
    id: string
    full_name: string | null
    email: string
  }
  empresa?: {
    id: string
    name: string
    rif: string
  }
  abonos?: AbonoUI[]
}

export interface AbonoUI {
  id?: string
  creditoId: string
  montoBs: number
  montoUsd: number
  tasa: number
  metodoPago: 'efectivo' | 'transferencia' | 'pago_movil' | 'zelle' | 'punto_venta' | 'deposito'
  referencia?: string | null
  bancoId?: string | null
  banco?: {
    id: string
    nombre: string
    codigo: string
  }
  fechaPago: Date
  observaciones?: string | null
  userId: string
  companyId: string
  usuario?: {
    id: string
    full_name: string | null
  }
}

export interface FiltrosCredito {
  fechaDesde?: Date
  fechaHasta?: Date
  clienteId?: string
  estado?: 'todos' | 'pendiente' | 'pagado'
  estadoVencimiento?: 'todos' | 'vencido' | 'por_vencer' | 'vigente'
  numeroFactura?: string
  companyId?: string
}

export interface ResumenCreditos {
  totalCreditos: number
  creditosPendientes: number
  creditosPagados: number
  creditosVencidos: number
  montoPendienteTotal: number
  montoAbonado: number
  clientesConCredito: number
}