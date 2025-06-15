// src/lib/services/depositosService.ts
import { createClient } from '@/utils/supabase/client'
import { 
  BancoDeposito, 
  DepositoBancario, 
  BancoDepositoUI, 
  DepositoBancarioUI,
  BancoFormData,
  DepositoFormData,
  FiltrosDepositos,
  ResumenDepositos,
  ReciboDepositoData
} from '@/types/depositos'
import { TablesInsert, TablesUpdate } from '@/types/database'

export class BancosDepositosService {
  private supabase = createClient()

  // Mapear de DB a UI
  private mapBancoFromDB(bancoDB: BancoDeposito): BancoDepositoUI {
    return {
      id: bancoDB.id,
      nombre: bancoDB.nombre,
      numeroCuenta: bancoDB.numero_cuenta,
      isActive: bancoDB.is_active,
      createdAt: new Date(bancoDB.created_at),
      updatedAt: new Date(bancoDB.updated_at)
    }
  }

  // Obtener todos los bancos
  async getBancos(): Promise<{ data: BancoDepositoUI[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      if (error) return { data: null, error }

      const bancos = data?.map(banco => this.mapBancoFromDB(banco)) || []
      return { data: bancos, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear nuevo banco (solo Master)
  async createBanco(bancoData: BancoFormData): Promise<{ data: BancoDepositoUI | null, error: any }> {
    try {
      const newBanco: TablesInsert<'bancos_depositos'> = {
        nombre: bancoData.nombre,
        numero_cuenta: bancoData.numeroCuenta
      }

      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .insert(newBanco)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapBancoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar banco (solo Master)
  async updateBanco(id: string, updates: Partial<BancoFormData>): Promise<{ data: BancoDepositoUI | null, error: any }> {
    try {
      const dbUpdates: TablesUpdate<'bancos_depositos'> = {}
      
      if (updates.nombre !== undefined) dbUpdates.nombre = updates.nombre
      if (updates.numeroCuenta !== undefined) dbUpdates.numero_cuenta = updates.numeroCuenta

      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapBancoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Desactivar banco (solo Master)
  async toggleBancoStatus(id: string, isActive: boolean): Promise<{ data: BancoDepositoUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapBancoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

export class DepositosService {
  private supabase = createClient()

  // Mapear de DB a UI
  private mapDepositoFromDB(depositoDB: any): DepositoBancarioUI {
    return {
      id: depositoDB.id,
      numeroRecibo: depositoDB.numero_recibo,
      companyId: depositoDB.company_id,
      bancoId: depositoDB.banco_id,
      userId: depositoDB.user_id,
      montoBs: depositoDB.monto_bs,
      fechaDeposito: new Date(depositoDB.fecha_deposito),
      observaciones: depositoDB.observaciones,
      createdAt: new Date(depositoDB.created_at),
      updatedAt: new Date(depositoDB.updated_at),
      banco: depositoDB.bancos_depositos ? {
        id: depositoDB.bancos_depositos.id,
        nombre: depositoDB.bancos_depositos.nombre,
        numeroCuenta: depositoDB.bancos_depositos.numero_cuenta,
        isActive: depositoDB.bancos_depositos.is_active,
        createdAt: new Date(depositoDB.bancos_depositos.created_at),
        updatedAt: new Date(depositoDB.bancos_depositos.updated_at)
      } : undefined,
      company: depositoDB.companies ? {
        id: depositoDB.companies.id,
        name: depositoDB.companies.name,
        rif: depositoDB.companies.rif
      } : undefined,
      usuario: depositoDB.users_view ? {
        id: depositoDB.users_view.id,
        full_name: depositoDB.users_view.full_name,
        email: depositoDB.users_view.email
      } : undefined
    }
  }

  // Obtener depósitos con filtros
  async getDepositos(filtros?: FiltrosDepositos, page: number = 1, limit: number = 10): Promise<{ 
    data: DepositoBancarioUI[] | null, 
    error: any,
    count?: number 
  }> {
    try {
      let query = this.supabase
        .from('depositos_bancarios')
        .select(`
          *,
          bancos_depositos (
            id,
            nombre,
            numero_cuenta,
            is_active,
            created_at,
            updated_at
          ),
          companies (
            id,
            name,
            rif
          ),
          users_view (
            id,
            full_name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filtros?.fechaDesde) {
        query = query.gte('fecha_deposito', filtros.fechaDesde.toISOString().split('T')[0])
      }
      
      if (filtros?.fechaHasta) {
        query = query.lte('fecha_deposito', filtros.fechaHasta.toISOString().split('T')[0])
      }
      
      if (filtros?.bancoId) {
        query = query.eq('banco_id', filtros.bancoId)
      }
      
      if (filtros?.companyId) {
        query = query.eq('company_id', filtros.companyId)
      }
      
      if (filtros?.userId) {
        query = query.eq('user_id', filtros.userId)
      }

      // Paginación
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) return { data: null, error, count: 0 }

      const depositos = data?.map(deposito => this.mapDepositoFromDB(deposito)) || []
      return { data: depositos, error: null, count: count || 0 }
    } catch (error) {
      return { data: null, error, count: 0 }
    }
  }

  // Crear nuevo depósito
  async createDeposito(
    depositoData: DepositoFormData, 
    userId: string, 
    companyId: string
  ): Promise<{ data: DepositoBancarioUI | null, error: any }> {
    try {
      const newDeposito: TablesInsert<'depositos_bancarios'> = {
        company_id: depositoData.companyId || companyId,
        banco_id: depositoData.bancoId,
        user_id: userId,
        monto_bs: depositoData.montoBs,
        fecha_deposito: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        observaciones: depositoData.observaciones || null
      }

      const { data, error } = await this.supabase
        .from('depositos_bancarios')
        .insert(newDeposito)
        .select(`
          *,
          bancos_depositos (
            id,
            nombre,
            numero_cuenta,
            is_active,
            created_at,
            updated_at
          ),
          companies (
            id,
            name,
            rif
          ),
          users_view (
            id,
            full_name,
            email
          )
        `)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapDepositoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener depósito por ID
  async getDeposito(id: string): Promise<{ data: DepositoBancarioUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('depositos_bancarios')
        .select(`
          *,
          bancos_depositos (
            id,
            nombre,
            numero_cuenta,
            is_active,
            created_at,
            updated_at
          ),
          companies (
            id,
            name,
            rif
          ),
          users_view (
            id,
            full_name,
            email
          )
        `)
        .eq('id', id)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapDepositoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener datos para el recibo PDF
  async getReciboData(depositoId: string): Promise<{ data: ReciboDepositoData | null, error: any }> {
    try {
      const { data: deposito, error } = await this.getDeposito(depositoId)
      
      if (error || !deposito) {
        return { data: null, error: error || new Error('Depósito no encontrado') }
      }

      if (!deposito.banco || !deposito.company || !deposito.usuario) {
        return { data: null, error: new Error('Datos incompletos del depósito') }
      }

      const reciboData: ReciboDepositoData = {
        numeroRecibo: deposito.numeroRecibo,
        empresa: {
          nombre: deposito.company.name,
          rif: deposito.company.rif
        },
        banco: {
          nombre: deposito.banco.nombre,
          numeroCuenta: deposito.banco.numeroCuenta
        },
        montoBs: deposito.montoBs,
        fechaDeposito: deposito.fechaDeposito,
        observaciones: deposito.observaciones,
        usuario: {
          nombre: deposito.usuario.full_name
        }
      }

      return { data: reciboData, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener resumen estadístico
  async getResumenDepositos(companyId?: string): Promise<{ data: ResumenDepositos | null, error: any }> {
    try {
      let query = this.supabase
        .from('depositos_bancarios')
        .select(`
          *,
          bancos_depositos (
            id,
            nombre,
            numero_cuenta,
            is_active,
            created_at,
            updated_at
          )
        `)

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) return { data: null, error }

      const depositos = data?.map(d => this.mapDepositoFromDB(d)) || []
      const hoy = new Date().toISOString().split('T')[0]
      const depositosHoy = depositos.filter(d => d.fechaDeposito.toISOString().split('T')[0] === hoy)

      // Calcular banco más usado
      const bancoStats = new Map()
      depositos.forEach(deposito => {
        if (deposito.banco) {
          const bancoId = deposito.banco.id
          if (!bancoStats.has(bancoId)) {
            bancoStats.set(bancoId, {
              banco: deposito.banco,
              cantidad: 0,
              montoTotal: 0
            })
          }
          const stats = bancoStats.get(bancoId)
          stats.cantidad++
          stats.montoTotal += deposito.montoBs
        }
      })

      const bancoMasUsado = Array.from(bancoStats.values())
        .sort((a, b) => b.cantidad - a.cantidad)[0]

      const resumen: ResumenDepositos = {
        totalDepositos: depositos.length,
        montoTotalBs: depositos.reduce((sum, d) => sum + d.montoBs, 0),
        depositosHoy: depositosHoy.length,
        montoHoyBs: depositosHoy.reduce((sum, d) => sum + d.montoBs, 0),
        bancoMasUsado
      }

      return { data: resumen, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Instancias de los servicios
export const bancosDepositosService = new BancosDepositosService()
export const depositosService = new DepositosService()