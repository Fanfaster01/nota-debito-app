// src/lib/services/adminServices.ts
import { createClient } from '@/utils/supabase/client'
import { Company, User, TablesInsert, TablesUpdate } from '@/types/database'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

// Servicio para gestionar compañías
export class CompanyService {
  private supabase = createClient()

  async createCompany(company: TablesInsert<'companies'>): Promise<{ data: Company | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .insert(company)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error creating company:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear la compañía') }
    }
  }

  async getAllCompanies(): Promise<{ data: Company[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .order('name')

      return { data, error }
    } catch (err) {
      console.error('Error getting all companies:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener las compañías') }
    }
  }

  async getCompanyById(id: string): Promise<{ data: Company | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error getting company by id:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener la compañía') }
    }
  }

  async updateCompany(id: string, updates: TablesUpdate<'companies'>): Promise<{ data: Company | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error updating company:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar la compañía') }
    }
  }

  async deleteCompany(id: string): Promise<{ error: unknown }> {
    try {
      const { error } = await this.supabase
        .from('companies')
        .delete()
        .eq('id', id)

      return { error }
    } catch (err) {
      console.error('Error deleting company:', err)
      return { error: handleServiceError(err, 'Error al eliminar la compañía') }
    }
  }

  async toggleCompanyStatus(id: string, isActive: boolean): Promise<{ data: Company | null, error: unknown }> {
    return this.updateCompany(id, { is_active: isActive })
  }
}

// Servicio para gestión avanzada de usuarios
export class AdminUserService {
  private supabase = createClient()

  async getAllUsers(): Promise<{ data: User[] | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error getting all users:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener los usuarios') }
    }
  }

  async getUserById(id: string): Promise<{ data: User | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error getting user by id:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener el usuario') }
    }
  }

  async updateUser(id: string, updates: TablesUpdate<'users'>): Promise<{ data: User | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error updating user:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar el usuario') }
    }
  }

  async assignUserToCompany(userId: string, companyId: string | null): Promise<{ data: User | null, error: unknown }> {
    return this.updateUser(userId, { company_id: companyId })
  }

  async updateUserRole(userId: string, role: 'master' | 'admin' | 'user'): Promise<{ data: User | null, error: unknown }> {
    return this.updateUser(userId, { role })
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ data: User | null, error: unknown }> {
    return this.updateUser(userId, { is_active: isActive })
  }

  async deleteUser(id: string): Promise<{ error: unknown }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id)

      return { error }
    } catch (err) {
      console.error('Error deleting user:', err)
      return { error: handleServiceError(err, 'Error al eliminar el usuario') }
    }
  }

  async getUsersByCompany(companyId: string): Promise<{ data: User[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name')

      return { data, error }
    } catch (err) {
      console.error('Error getting users by company:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener usuarios de la compañía') }
    }
  }

  async createUser(userData: {
    email: string
    password: string
    fullName: string
    role: 'master' | 'admin' | 'user'
    companyId?: string | null
  }): Promise<{ data: User | null, error: unknown }> {
    try {
      // Primero crear el usuario en auth.users
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName
          },
          emailRedirectTo: undefined // No enviar email de confirmación
        }
      })

      if (authError || !authData.user) {
        return { data: null, error: handleServiceError(authError || new Error('No se pudo crear el usuario'), 'Error al crear usuario en auth') }
      }

      // Luego crear el perfil en la tabla users
      const { data: userProfile, error: profileError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role,
          company_id: userData.companyId || null,
          is_active: true
        })
        .select(`
          *,
          companies (
            id,
            name,
            rif
          )
        `)
        .single()

      if (profileError) {
        // Si falla la creación del perfil, intentar eliminar el usuario de auth
        // Nota: Esto puede requerir permisos de service_role
        console.error('Error creating user profile:', profileError)
        return { data: null, error: handleServiceError(profileError, 'Error al crear perfil de usuario') }
      }

      return { data: userProfile, error: null }
    } catch (err) {
      console.error('Error creating user:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear el usuario') }
    }
  }
}

// Interfaces para métricas extendidas
export interface MasterDashboardStats {
  // Estadísticas básicas
  totalFacturas: number
  totalNotasCredito: number
  totalNotasDebito: number
  totalCompanies?: number
  totalUsers?: number
  
  // Métricas de caja
  cajaMetrics: {
    totalCajas: number
    cajasAbiertas: number
    cajasConDiscrepancias: number
    promedioDiscrepancia: number
    totalPagosMovil: number
    totalZelleUsd: number
    totalZelleBs: number
    totalNotasCreditoCaja: number
    totalCreditosBs: number
    totalCreditosUsd: number
  }
  
  // Métricas de créditos
  creditoMetrics: {
    totalCreditos: number
    creditosPendientes: number
    creditosPagados: number
    creditosVencidos: number
    montoPendienteTotal: number
    montoAbonado: number
    clientesConCredito: number
  }
  
  // Rendimiento por cajeros
  topCajeros: Array<{
    userId: string
    nombreUsuario: string
    cantidadCierres: number
    promedioDiscrepancia: number
  }>
  
  // Alertas activas
  alertasActivas: number
  alertasSeveridad: {
    leves: number
    medias: number
    altas: number
  }
}

export interface CompanyRanking {
  id: string
  name: string
  rif: string
  totalVentas: number
  totalCajas: number
  promedioPrecision: number
  usuariosActivos: number
  isActive: boolean
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
    error: unknown 
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

      const stats: {
        totalFacturas: number
        totalNotasCredito: number
        totalNotasDebito: number
        totalCompanies?: number
        totalUsers?: number
      } = {
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
    } catch (err) {
      console.error('Error getting dashboard stats:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener estadísticas del dashboard') }
    }
  }

  // Obtener métricas completas para dashboard master
  async getMasterDashboardStats(companyId?: string): Promise<{ 
    data: MasterDashboardStats | null, 
    error: unknown 
  }> {
    try {
      // Obtener estadísticas básicas
      const { data: basicStats, error: basicError } = await this.getDashboardStats(companyId)
      if (basicError || !basicStats) {
        return { data: null, error: basicError }
      }

      // Inicializar métricas con valores por defecto
      let cajaResumen = {
        totalCajas: 0,
        cajasAbiertas: 0,
        totalPagosMovil: 0,
        totalZelleUsd: 0,
        totalZelleBs: 0,
        totalNotasCredito: 0,
        totalCreditosBs: 0,
        totalCreditosUsd: 0
      }

      interface UsuarioActivo {
        userId: string
        nombreUsuario: string
        cantidadCierres: number
        promedioDiscrepancia: number
      }

      let cierresResumen: {
        cierresConDiscrepancias: number
        promedioDiscrepancia: number
        usuariosMasActivos: UsuarioActivo[]
      } = {
        cierresConDiscrepancias: 0,
        promedioDiscrepancia: 0,
        usuariosMasActivos: []
      }

      let creditosResumen = {
        totalCreditos: 0,
        creditosPendientes: 0,
        creditosPagados: 0,
        creditosVencidos: 0,
        montoPendienteTotal: 0,
        montoAbonado: 0,
        clientesConCredito: 0
      }

      interface Alerta {
        severidad: 'leve' | 'media' | 'alta'
        [key: string]: unknown
      }
      
      let alertas: Alerta[] = []

      // Intentar cargar métricas de servicios externos (si están disponibles)
      try {
        const { cajaService } = await import('./cajaService')
        const { data: cajaData } = await cajaService.getResumenCajas(companyId || '', 30)
        if (cajaData) {
          Object.assign(cajaResumen, cajaData)
        }
      } catch (error) {
        console.warn('CajaService no disponible:', handleServiceError(error, 'Error al cargar CajaService'))
      }

      try {
        const { cierresCajaService } = await import('./cierresCajaService')
        const { data: cierresData } = await cierresCajaService.getResumenCierres(companyId, 30)
        if (cierresData) {
          Object.assign(cierresResumen, cierresData)
        }

        const { data: alertasData } = await cierresCajaService.getAlertasDiscrepancias(companyId)
        if (alertasData) {
          alertas = alertasData as Alerta[]
        }
      } catch (error) {
        console.warn('CierresCajaService no disponible:', handleServiceError(error, 'Error al cargar CierresCajaService'))
      }

      // Obtener alertas de notificaciones de créditos
      try {
        const { notificationService } = await import('./notificationService')
        const { data: notificacionesData } = await notificationService.generateNotifications(companyId)
        
        // Obtener usuario actual para filtrar alertas leídas
        const { data: { user } } = await this.supabase.auth.getUser()
        
        if (notificacionesData && user) {
          // Obtener alertas leídas
          const { alertasLeidasService } = await import('./alertasLeidasService')
          const { data: alertasLeidasIds } = await alertasLeidasService.getAlertasLeidas(user.id, companyId)
          
          // Filtrar alertas no leídas
          const alertasNoLeidas = notificacionesData.filter(notif => 
            !alertasLeidasIds?.includes(notif.id)
          )
          
          // Convertir notificaciones a formato de alertas
          const alertasNotificaciones: Alerta[] = alertasNoLeidas.map(notif => ({
            severidad: notif.priority === 'high' ? 'alta' : 
                      notif.priority === 'medium' ? 'media' : 'leve',
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message
          }))
          
          // Agregar a las alertas existentes
          alertas = [...alertas, ...alertasNotificaciones]
        }
      } catch (error) {
        console.warn('NotificationService no disponible:', handleServiceError(error, 'Error al cargar NotificationService'))
      }

      try {
        const { creditoService } = await import('./creditoService')
        const { data: creditosData } = await creditoService.getResumenCreditos(companyId)
        if (creditosData) {
          Object.assign(creditosResumen, creditosData)
        }
      } catch (error) {
        console.warn('CreditoService no disponible:', handleServiceError(error, 'Error al cargar CreditoService'))
      }

      // Construir estadísticas completas
      const masterStats: MasterDashboardStats = {
        ...basicStats,
        
        cajaMetrics: {
          totalCajas: cajaResumen.totalCajas || 0,
          cajasAbiertas: cajaResumen.cajasAbiertas || 0,
          cajasConDiscrepancias: cierresResumen.cierresConDiscrepancias || 0,
          promedioDiscrepancia: cierresResumen.promedioDiscrepancia || 0,
          totalPagosMovil: cajaResumen.totalPagosMovil || 0,
          totalZelleUsd: cajaResumen.totalZelleUsd || 0,
          totalZelleBs: cajaResumen.totalZelleBs || 0,
          totalNotasCreditoCaja: cajaResumen.totalNotasCredito || 0,
          totalCreditosBs: cajaResumen.totalCreditosBs || 0,
          totalCreditosUsd: cajaResumen.totalCreditosUsd || 0
        },
        
        creditoMetrics: {
          totalCreditos: creditosResumen.totalCreditos || 0,
          creditosPendientes: creditosResumen.creditosPendientes || 0,
          creditosPagados: creditosResumen.creditosPagados || 0,
          creditosVencidos: creditosResumen.creditosVencidos || 0,
          montoPendienteTotal: creditosResumen.montoPendienteTotal || 0,
          montoAbonado: creditosResumen.montoAbonado || 0,
          clientesConCredito: creditosResumen.clientesConCredito || 0
        },
        
        topCajeros: cierresResumen.usuariosMasActivos?.slice(0, 5) || [],
        
        alertasActivas: alertas.length || 0,
        alertasSeveridad: {
          leves: alertas.filter(a => a.severidad === 'leve').length || 0,
          medias: alertas.filter(a => a.severidad === 'media').length || 0,
          altas: alertas.filter(a => a.severidad === 'alta').length || 0
        }
      }

      return { data: masterStats, error: null }
    } catch (err) {
      console.error('Error getting master dashboard stats:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener estadísticas master del dashboard') }
    }
  }

  // Obtener ranking de compañías para vista global
  async getCompanyRanking(): Promise<{ data: CompanyRanking[] | null, error: unknown }> {
    try {
      // Obtener todas las compañías con estadísticas básicas
      const { data: companies, error: companiesError } = await this.supabase
        .from('companies')
        .select(`
          id,
          name,
          rif,
          is_active,
          users (id)
        `)
        .order('name')

      if (companiesError) return { data: null, error: companiesError }

      const ranking: CompanyRanking[] = []

      for (const company of companies || []) {
        try {
          // Obtener métricas para cada compañía
          const { data: stats } = await this.getMasterDashboardStats(company.id)
          
          ranking.push({
            id: company.id,
            name: company.name,
            rif: company.rif,
            totalVentas: (stats?.cajaMetrics.totalPagosMovil || 0) + 
                        (stats?.cajaMetrics.totalZelleBs || 0) + 
                        (stats?.cajaMetrics.totalCreditosBs || 0),
            totalCajas: stats?.cajaMetrics.totalCajas || 0,
            promedioPrecision: 100 - (stats?.cajaMetrics.promedioDiscrepancia || 0),
            usuariosActivos: company.users?.length || 0,
            isActive: company.is_active
          })
        } catch (err) {
          // Si falla para una compañía, continuar con las demás
          console.warn('Error getting stats for company:', company.name, handleServiceError(err, 'Error al obtener estadísticas de compañía'))
          ranking.push({
            id: company.id,
            name: company.name,
            rif: company.rif,
            totalVentas: 0,
            totalCajas: 0,
            promedioPrecision: 0,
            usuariosActivos: company.users?.length || 0,
            isActive: company.is_active
          })
        }
      }

      // Ordenar por total de ventas descendente
      ranking.sort((a, b) => b.totalVentas - a.totalVentas)

      return { data: ranking, error: null }
    } catch (err) {
      console.error('Error getting company ranking:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener ranking de compañías') }
    }
  }

  // Obtener lista de compañías activas para selector
  async getActiveCompanies(): Promise<{ data: Array<{id: string, name: string, rif: string, is_active: boolean}> | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('companies')
        .select('id, name, rif, is_active')
        .eq('is_active', true)
        .order('name')

      return { data, error }
    } catch (err) {
      console.error('Error getting active companies:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener compañías activas') }
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
    error: unknown 
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
    } catch (err) {
      console.error('Error getting recent activity:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener actividad reciente') }
    }
  }
}

// Instancias de los servicios
export const companyService = new CompanyService()
export const adminUserService = new AdminUserService()
export const dashboardService = new DashboardService()