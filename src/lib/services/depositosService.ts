// src/lib/services/depositosService.ts
import { createClient } from '@/utils/supabase/client-wrapper'
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
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export class BancosDepositosService {
  private supabase = createClient()

  /**
   * Manejar errores de manera consistente
   */
  private handleError(error: unknown, context: string): string {
    console.error(`Error en ${context}:`, error)
    return handleServiceError(error, `Error inesperado en ${context}`)
  }

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
  async getBancos(): Promise<{ data: BancoDepositoUI[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      if (error) throw error

      const bancos = data?.map(banco => this.mapBancoFromDB(banco)) || []
      return { data: bancos, error: null }
    } catch (error) {
      return { data: null, error: this.handleError(error, 'getBancos') }
    }
  }

  // Crear nuevo banco (solo Master)
  async createBanco(bancoData: BancoFormData): Promise<{ data: BancoDepositoUI | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }

  // Actualizar banco (solo Master)
  async updateBanco(id: string, updates: Partial<BancoFormData>): Promise<{ data: BancoDepositoUI | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }

  // Desactivar banco (solo Master)
  async toggleBancoStatus(id: string, isActive: boolean): Promise<{ data: BancoDepositoUI | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos_depositos')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapBancoFromDB(data), error: null }
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }
}

export class DepositosService {
  private supabase = createClient()

  /**
   * Validar parámetros requeridos
   */
  private validateRequired(value: unknown, name: string): void {
    if (!value || (typeof value === 'string' && !value.trim())) {
      throw new Error(`${name} es requerido`)
    }
  }

  /**
   * Manejar errores de manera consistente
   */
  private handleError(error: unknown, context: string): string {
    console.error(`Error en ${context}:`, error)
    return handleServiceError(error, `Error inesperado en ${context}`)
  }

  // Mapear de DB a UI
  private mapDepositoFromDB(depositoDB: unknown): DepositoBancarioUI {
    const deposito = depositoDB as any // Type assertion for complex nested object
    return {
      id: deposito.id,
      numeroRecibo: deposito.numero_recibo,
      companyId: deposito.company_id,
      bancoId: deposito.banco_id,
      userId: deposito.user_id,
      montoBs: deposito.monto_bs,
      fechaDeposito: new Date(deposito.fecha_deposito),
      observaciones: deposito.observaciones,
      createdAt: new Date(deposito.created_at),
      updatedAt: new Date(deposito.updated_at),
      banco: deposito.bancos_depositos ? {
        id: deposito.bancos_depositos.id,
        nombre: deposito.bancos_depositos.nombre,
        numeroCuenta: deposito.bancos_depositos.numero_cuenta,
        isActive: deposito.bancos_depositos.is_active,
        createdAt: new Date(deposito.bancos_depositos.created_at),
        updatedAt: new Date(deposito.bancos_depositos.updated_at)
      } : undefined,
      company: deposito.companies ? {
        id: deposito.companies.id,
        name: deposito.companies.name,
        rif: deposito.companies.rif
      } : undefined,
      usuario: undefined // Se establecerá mediante consulta separada
    }
  }

  // Obtener depósitos con filtros
  async getDepositos(filtros?: FiltrosDepositos, page: number = 1, limit: number = 10): Promise<{ 
    data: DepositoBancarioUI[] | null, 
    error: unknown,
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

      let depositos = data?.map(deposito => this.mapDepositoFromDB(deposito)) || []

      // Obtener información de usuarios para los depósitos (consulta separada para evitar problemas de foreign key)
      if (depositos.length > 0) {
        const userIds = [...new Set(depositos.map(d => d.userId))]
        const { data: usuarios, error: usersError } = await this.supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)
        
        if (!usersError && usuarios) {
          const usersMap = new Map(usuarios.map(u => [u.id, u]))
          depositos = depositos.map(deposito => ({
            ...deposito,
            usuario: usersMap.get(deposito.userId)
          }))
        }
      }

      return { data: depositos, error: null, count: count || 0 }
    } catch (err) {
      console.error('Error getting depositos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener depósitos'), count: 0 }
    }
  }

  // Crear nuevo depósito
  async createDeposito(
    depositoData: DepositoFormData, 
    userId: string, 
    companyId: string
  ): Promise<{ data: DepositoBancarioUI | null, error: unknown }> {
    try {
      // Validaciones básicas
      this.validateRequired(depositoData.bancoId, 'bancoId')
      this.validateRequired(userId, 'userId')
      this.validateRequired(companyId, 'companyId')
      
      if (depositoData.montoBs <= 0) {
        throw new Error('El monto debe ser mayor que cero')
      }

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

      if (error) throw error

      return { data: this.mapDepositoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error: this.handleError(error, 'createDeposito') }
    }
  }

  // Obtener depósito por ID
  async getDeposito(id: string): Promise<{ data: DepositoBancarioUI | null, error: unknown }> {
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
          )
        `)
        .eq('id', id)
        .single()

      if (error) return { data: null, error }

      let deposito = this.mapDepositoFromDB(data)

      // Obtener información del usuario mediante consulta separada
      const { data: usuario, error: userError } = await this.supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', deposito.userId)
        .single()

      if (!userError && usuario) {
        deposito = {
          ...deposito,
          usuario
        }
      }

      return { data: deposito, error: null }
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }

  // Obtener datos para el recibo PDF
  async getReciboData(depositoId: string): Promise<{ data: ReciboDepositoData | null, error: unknown }> {
    try {
      const { data: deposito, error } = await this.getDeposito(depositoId)
      
      if (error || !deposito) {
        return { data: null, error: handleServiceError(error || new Error('Depósito no encontrado'), 'Depósito no encontrado') }
      }

      if (!deposito.banco || !deposito.company || !deposito.usuario) {
        return { data: null, error: handleServiceError(new Error('Datos incompletos del depósito'), 'Datos incompletos') }
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
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }

  // Obtener resumen estadístico
  async getResumenDepositos(companyId?: string): Promise<{ data: ResumenDepositos | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error in depositos operation:', err)
      return { data: null, error: handleServiceError(err, 'Error en operación de depósitos') }
    }
  }
}

// Instancias de los servicios
export const bancosDepositosService = new BancosDepositosService()
export const depositosService = new DepositosService()