// src/lib/services/notificationService.ts
import { createClient } from '@/utils/supabase/client'
import { CreditoDetalladoUI } from '@/types/creditos'
import { creditoService } from './creditoService'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export interface NotificacionCredito {
  id: string
  type: 'vencimiento_proximo' | 'vencido' | 'pago_recibido' | 'credito_completado'
  title: string
  message: string
  creditoId: string
  credito?: CreditoDetalladoUI
  priority: 'low' | 'medium' | 'high'
  read: boolean
  createdAt: Date
}

export class NotificationService {
  private supabase = createClient()

  // Obtener créditos próximos a vencer (en los próximos 7 días)
  async getCreditosProximosAVencer(companyId?: string): Promise<{ data: CreditoDetalladoUI[] | null, error: unknown }> {
    try {
      const hoy = new Date()
      const enUnaSemanà = new Date()
      enUnaSemanà.setDate(hoy.getDate() + 7)

      const filtros = {
        fechaVencimientoDesde: hoy,
        fechaVencimientoHasta: enUnaSemanà,
        estado: 'pendiente' as const,
        companyId
      }

      const { data: creditos, error } = await creditoService.getCreditos(filtros)
      
      if (error) return { data: null, error }

      // Filtrar solo los que están por vencer
      const creditosProximosAVencer = creditos?.filter(c => 
        c.fechaVencimiento && 
        c.estadoVencimiento === 'Por vencer' &&
        c.estado === 'pendiente'
      ) || []

      return { data: creditosProximosAVencer, error: null }
    } catch (err) {
      console.error('Error getting creditos proximos a vencer:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener créditos próximos a vencer') }
    }
  }

  // Obtener créditos vencidos
  async getCreditosVencidos(companyId?: string): Promise<{ data: CreditoDetalladoUI[] | null, error: unknown }> {
    try {
      const filtros = {
        estado: 'pendiente' as const,
        companyId
      }

      const { data: creditos, error } = await creditoService.getCreditos(filtros)
      
      if (error) return { data: null, error }

      // Filtrar solo los vencidos
      const creditosVencidos = creditos?.filter(c => 
        c.estadoVencimiento === 'Vencido' &&
        c.estado === 'pendiente'
      ) || []

      return { data: creditosVencidos, error: null }
    } catch (err) {
      console.error('Error getting creditos vencidos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener créditos vencidos') }
    }
  }

  // Obtener clientes con múltiples créditos pendientes
  async getClientesConMultiplesCreditos(companyId?: string): Promise<{ 
    data: Array<{
      cliente: unknown,
      creditos: CreditoDetalladoUI[],
      totalPendiente: number,
      cantidadCreditos: number
    }> | null, 
    error: unknown 
  }> {
    try {
      const filtros = {
        estado: 'pendiente' as const,
        companyId
      }

      const { data: creditos, error } = await creditoService.getCreditos(filtros)
      
      if (error) return { data: null, error }

      // Agrupar por cliente
      const clientesMap = new Map()
      
      creditos?.forEach(credito => {
        if (!credito.clienteId || !credito.cliente) return
        
        const clienteId = credito.clienteId
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            cliente: credito.cliente,
            creditos: [],
            totalPendiente: 0,
            cantidadCreditos: 0
          })
        }
        
        const clienteData = clientesMap.get(clienteId)
        clienteData.creditos.push(credito)
        clienteData.totalPendiente += credito.saldoPendiente
        clienteData.cantidadCreditos++
      })

      // Filtrar solo clientes con múltiples créditos
      const clientesConMultiplesCreditos = Array.from(clientesMap.values())
        .filter(cliente => cliente.cantidadCreditos > 1)
        .sort((a, b) => b.totalPendiente - a.totalPendiente)

      return { data: clientesConMultiplesCreditos, error: null }
    } catch (err) {
      console.error('Error getting clientes con multiples creditos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener clientes con múltiples créditos') }
    }
  }

  // Generar notificaciones automáticas
  async generateNotifications(companyId?: string): Promise<{ data: NotificacionCredito[] | null, error: unknown }> {
    try {
      const notificaciones: NotificacionCredito[] = []

      // Notificaciones de vencimientos próximos
      const { data: proximosAVencer } = await this.getCreditosProximosAVencer(companyId)
      proximosAVencer?.forEach(credito => {
        const diasRestantes = credito.fechaVencimiento 
          ? Math.ceil((credito.fechaVencimiento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 0

        notificaciones.push({
          id: `venc_${credito.id}`,
          type: 'vencimiento_proximo',
          title: 'Crédito próximo a vencer',
          message: `La factura #${credito.numeroFactura} de ${credito.nombreCliente} vence en ${diasRestantes} día(s). Saldo: Bs ${credito.saldoPendiente.toFixed(2)}`,
          creditoId: credito.id,
          credito,
          priority: diasRestantes <= 2 ? 'high' : 'medium',
          read: false,
          createdAt: new Date()
        })
      })

      // Notificaciones de créditos vencidos
      const { data: vencidos } = await this.getCreditosVencidos(companyId)
      vencidos?.forEach(credito => {
        const diasVencido = credito.fechaVencimiento 
          ? Math.ceil((new Date().getTime() - credito.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24))
          : 0

        notificaciones.push({
          id: `vencido_${credito.id}`,
          type: 'vencido',
          title: 'Crédito vencido',
          message: `La factura #${credito.numeroFactura} de ${credito.nombreCliente} está vencida desde hace ${diasVencido} día(s). Saldo: Bs ${credito.saldoPendiente.toFixed(2)}`,
          creditoId: credito.id,
          credito,
          priority: 'high',
          read: false,
          createdAt: new Date()
        })
      })

      // Notificaciones de clientes con múltiples créditos
      const { data: clientesMultiples } = await this.getClientesConMultiplesCreditos(companyId)
      clientesMultiples?.slice(0, 5).forEach(clienteData => { // Solo los top 5
        const cliente = clienteData.cliente as { id: string; nombre: string }
        notificaciones.push({
          id: `multiple_${cliente.id}`,
          type: 'vencimiento_proximo',
          title: 'Cliente con múltiples créditos',
          message: `${cliente.nombre} tiene ${clienteData.cantidadCreditos} créditos pendientes por Bs ${clienteData.totalPendiente.toFixed(2)}`,
          creditoId: clienteData.creditos[0].id,
          credito: clienteData.creditos[0],
          priority: 'medium',
          read: false,
          createdAt: new Date()
        })
      })

      return { data: notificaciones, error: null }
    } catch (err) {
      console.error('Error generating notifications:', err)
      return { data: null, error: handleServiceError(err, 'Error al generar notificaciones') }
    }
  }

  // Obtener estadísticas de alertas
  async getAlertStats(companyId?: string): Promise<{ 
    data: {
      creditosVencidos: number,
      creditosProximosAVencer: number,
      clientesConMultiplesCreditos: number,
      montoTotalVencido: number,
      montoTotalProximoAVencer: number
    } | null, 
    error: unknown 
  }> {
    try {
      const [vencidos, proximosAVencer, clientesMultiples] = await Promise.all([
        this.getCreditosVencidos(companyId),
        this.getCreditosProximosAVencer(companyId),
        this.getClientesConMultiplesCreditos(companyId)
      ])

      const stats = {
        creditosVencidos: vencidos.data?.length || 0,
        creditosProximosAVencer: proximosAVencer.data?.length || 0,
        clientesConMultiplesCreditos: clientesMultiples.data?.length || 0,
        montoTotalVencido: vencidos.data?.reduce((sum, c) => sum + c.saldoPendiente, 0) || 0,
        montoTotalProximoAVencer: proximosAVencer.data?.reduce((sum, c) => sum + c.saldoPendiente, 0) || 0
      }

      return { data: stats, error: null }
    } catch (err) {
      console.error('Error getting alert stats:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener estadísticas de alertas') }
    }
  }
}

export const notificationService = new NotificationService()