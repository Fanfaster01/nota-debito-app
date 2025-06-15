// src/types/depositos.ts

// Tipos para la base de datos
export interface BancoDeposito {
  id: string
  nombre: string
  numero_cuenta: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DepositoBancario {
  id: string
  numero_recibo: number
  company_id: string
  banco_id: string
  user_id: string
  monto_bs: number
  fecha_deposito: string
  observaciones?: string
  created_at: string
  updated_at: string
}

// Tipos para la UI
export interface BancoDepositoUI {
  id: string
  nombre: string
  numeroCuenta: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DepositoBancarioUI {
  id: string
  numeroRecibo: number
  companyId: string
  bancoId: string
  userId: string
  montoBs: number
  fechaDeposito: Date
  observaciones?: string
  createdAt: Date
  updatedAt: Date
  // Relaciones
  banco?: BancoDepositoUI
  company?: {
    id: string
    name: string
    rif: string
  }
  usuario?: {
    id: string
    full_name: string
    email: string
  }
}

// Tipos para formularios
export interface DepositoFormData {
  bancoId: string
  companyId?: string // Solo para Master
  montoBs: number
  observaciones?: string
}

export interface BancoFormData {
  nombre: string
  numeroCuenta: string
}

// Tipos para filtros
export interface FiltrosDepositos {
  fechaDesde?: Date
  fechaHasta?: Date
  bancoId?: string
  companyId?: string // Solo para Master
  userId?: string
}

// Tipos para estadísticas
export interface ResumenDepositos {
  totalDepositos: number
  montoTotalBs: number
  depositosHoy: number
  montoHoyBs: number
  bancoMasUsado?: {
    banco: BancoDepositoUI
    cantidad: number
    montoTotal: number
  }
}

// Tipo para datos del recibo PDF
export interface ReciboDepositoData {
  numeroRecibo: number
  empresa: {
    nombre: string
    rif: string
  }
  banco: {
    nombre: string
    numeroCuenta: string
  }
  montoBs: number
  fechaDeposito: Date
  observaciones?: string
  usuario: {
    nombre: string
  }
}