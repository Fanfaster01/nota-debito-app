// src/lib/services/adminServices.ts
import { createClient } from '@/utils/supabase/client'
import { Company, User, TablesInsert, TablesUpdate } from '@/types/database'

// Servicio para gestionar compañías
export class CompanyService {
  private supabase = createClient()

  async createCompany(company: TablesInsert<'companies'>): Promise<{ data: Company | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .insert(company)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getAllCompanies(): Promise<{ data: Company[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .order('name')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getCompanyById(id: string): Promise<{ data: Company | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateCompany(id: string, updates: TablesUpdate<'companies'>): Promise<{ data: Company | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteCompany(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('companies')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  async toggleCompanyStatus(id: string, isActive: boolean): Promise<{ data: Company | null, error: any }> {
    return this.updateCompany(id, { is_active: isActive })
  }
}

// Servicio para gestión avanzada de usuarios
export class AdminUserService {
  private supabase = createClient()

  async getAllUsers(): Promise<{ data: User[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            rif
          )
        `)
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getUserById(id: string): Promise<{ data: User | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          *,
          companies (
            id,
            name,
            rif
          )
        `)
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateUser(id: string, updates: TablesUpdate<'users'>): Promise<{ data: User | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          companies (
            id,
            name,
            rif
          )
        `)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async assignUserToCompany(userId: string, companyId: string | null): Promise<{ data: User | null, error: any }> {
    return this.updateUser(userId, { company_id: companyId })
  }

  async updateUserRole(userId: string, role: 'master' | 'admin' | 'user'): Promise<{ data: User | null, error: any }> {
    return this.updateUser(userId, { role })
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ data: User | null, error: any }> {
    return this.updateUser(userId, { is_active: isActive })
  }

  async deleteUser(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  async getUsersByCompany(companyId: string): Promise<{ data: User[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async inviteUser(email: string, companyId?: string, role: 'admin' | 'user' = 'user'): Promise<{ error: any }> {
    try {
      // Aquí podrías implementar la lógica de invitación
      // Por ejemplo, enviar un email de invitación con un token
      // y crear un registro temporal hasta que el usuario confirme
      
      const { error } = await this.supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          company_id: companyId,
          role: role
        }
      })

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

// Servicio para estadísticas del dashboard
export class DashboardService {
  private supabase = createClient()

  async getDashboardStats(companyId?: string): Promise<{ 
    data: {
      totalFacturas: number
      totalNotasCredito: number
      totalNotasDebito: number
      totalCompanies?: number
      totalUsers?: number
    } | null, 
    error: any 
  }> {
    try {
      let facturaQuery = this.supabase.from('facturas').select('id', { count: 'exact' })
      let notaCreditoQuery = this.supabase.from('notas_credito').select('id', { count: 'exact' })
      let notaDebitoQuery = this.supabase.from('notas_debito').select('id', { count: 'exact' })

      if (companyId) {
        facturaQuery = facturaQuery.eq('company_id', companyId)
        notaCreditoQuery = notaCreditoQuery.eq('company_id', companyId)
        notaDebitoQuery = notaDebitoQuery.eq('company_id', companyId)
      }

      const [
        { count: totalFacturas, error: facturaError },
        { count: totalNotasCredito, error: notaCreditoError },
        { count: totalNotasDebito, error: notaDebitoError }
      ] = await Promise.all([
        facturaQuery,
        notaCreditoQuery,
        notaDebitoQuery
      ])

      if (facturaError || notaCreditoError || notaDebitoError) {
        return { 
          data: null, 
          error: facturaError || notaCreditoError || notaDebitoError 
        }
      }

      const stats: any = {
        totalFacturas: totalFacturas || 0,
        totalNotasCredito: totalNotasCredito || 0,
        totalNotasDebito: totalNotasDebito || 0,
      }

      // Si no se especifica companyId, obtener estadísticas globales
      if (!companyId) {
        const [
          { count: totalCompanies, error: companyError },
          { count: totalUsers, error: userError }
        ] = await Promise.all([
          this.supabase.from('companies').select('id', { count: 'exact' }),
          this.supabase.from('users').select('id', { count: 'exact' })
        ])

        if (companyError || userError) {
          return { data: null, error: companyError || userError }
        }

        stats.totalCompanies = totalCompanies || 0
        stats.totalUsers = totalUsers || 0
      }

      return { data: stats, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getRecentActivity(companyId?: string, limit: number = 10): Promise<{ 
    data: Array<{
      id: string
      type: 'factura' | 'nota_credito' | 'nota_debito'
      numero: string
      fecha: string
      total?: number
      created_at: string
    }> | null, 
    error: any 
  }> {
    try {
      let facturaQuery = this.supabase
        .from('facturas')
        .select('id, numero, fecha, total, created_at')
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 3))

      let notaCreditoQuery = this.supabase
        .from('notas_credito')
        .select('id, numero, fecha, total, created_at')
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 3))

      let notaDebitoQuery = this.supabase
        .from('notas_debito')
        .select('id, numero, fecha, created_at')
        .order('created_at', { ascending: false })
        .limit(Math.ceil(limit / 3))

      if (companyId) {
        facturaQuery = facturaQuery.eq('company_id', companyId)
        notaCreditoQuery = notaCreditoQuery.eq('company_id', companyId)
        notaDebitoQuery = notaDebitoQuery.eq('company_id', companyId)
      }

      const [
        { data: facturas, error: facturaError },
        { data: notasCredito, error: notaCreditoError },
        { data: notasDebito, error: notaDebitoError }
      ] = await Promise.all([
        facturaQuery,
        notaCreditoQuery,
        notaDebitoQuery
      ])

      if (facturaError || notaCreditoError || notaDebitoError) {
        return { 
          data: null, 
          error: facturaError || notaCreditoError || notaDebitoError 
        }
      }

      const activities = [
        ...(facturas || []).map(f => ({ ...f, type: 'factura' as const })),
        ...(notasCredito || []).map(nc => ({ ...nc, type: 'nota_credito' as const })),
        ...(notasDebito || []).map(nd => ({ ...nd, type: 'nota_debito' as const }))
      ]

      // Ordenar por fecha de creación y limitar
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)

      return { data: sortedActivities, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Instancias de los servicios
export const companyService = new CompanyService()
export const adminUserService = new AdminUserService()
export const dashboardService = new DashboardService()