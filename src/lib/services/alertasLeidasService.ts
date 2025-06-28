// src/lib/services/alertasLeidasService.ts
import { createClient } from '@/utils/supabase/client'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export interface AlertaLeida {
  id: string
  user_id: string
  company_id: string | null
  alerta_id: string
  fecha_leida: string
  created_at: string
}

export class AlertasLeidasService {
  private supabase = createClient()

  // Obtener todas las alertas leídas para un usuario y compañía
  async getAlertasLeidas(userId: string, companyId?: string): Promise<{ data: string[] | null, error: unknown }> {
    try {
      let query = this.supabase
        .from('alertas_leidas')
        .select('alerta_id')
        .eq('user_id', userId)

      if (companyId) {
        query = query.eq('company_id', companyId)
      } else {
        query = query.is('company_id', null)
      }

      const { data, error } = await query

      if (error) return { data: null, error }

      const alertasIds = data?.map(item => item.alerta_id) || []
      return { data: alertasIds, error: null }
    } catch (err) {
      console.error('Error getting alertas leidas:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener alertas leídas') }
    }
  }

  // Marcar una alerta como leída
  async marcarAlertaLeida(userId: string, alertaId: string, companyId?: string): Promise<{ error: unknown }> {
    try {
      // Primero intentar insertar
      const { error: insertError } = await this.supabase
        .from('alertas_leidas')
        .insert({
          user_id: userId,
          company_id: companyId || null,
          alerta_id: alertaId,
          fecha_leida: new Date().toISOString()
        })

      // Si hay error de duplicado, actualizar
      if (insertError && insertError.code === '23505') {
        let updateQuery = this.supabase
          .from('alertas_leidas')
          .update({ fecha_leida: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('alerta_id', alertaId)
        
        if (companyId) {
          updateQuery = updateQuery.eq('company_id', companyId)
        } else {
          updateQuery = updateQuery.is('company_id', null)
        }

        const { error: updateError } = await updateQuery

        return { error: updateError }
      }

      return { error: insertError }
    } catch (err) {
      console.error('Error marking alerta as read:', err)
      return { error: handleServiceError(err, 'Error al marcar alerta como leída') }
    }
  }

  // Marcar múltiples alertas como leídas
  async marcarMultiplesAlertasLeidas(userId: string, alertasIds: string[], companyId?: string): Promise<{ error: unknown }> {
    try {
      // Procesar cada alerta individualmente para manejar conflictos
      for (const alertaId of alertasIds) {
        await this.marcarAlertaLeida(userId, alertaId, companyId)
      }

      return { error: null }
    } catch (err) {
      console.error('Error marking multiple alertas as read:', err)
      return { error: handleServiceError(err, 'Error al marcar múltiples alertas como leídas') }
    }
  }

  // Desmarcar una alerta como leída (por si se necesita)
  async desmarcarAlertaLeida(userId: string, alertaId: string, companyId?: string): Promise<{ error: unknown }> {
    try {
      let query = this.supabase
        .from('alertas_leidas')
        .delete()
        .eq('user_id', userId)
        .eq('alerta_id', alertaId)

      if (companyId) {
        query = query.eq('company_id', companyId)
      } else {
        query = query.is('company_id', null)
      }

      const { error } = await query

      return { error }
    } catch (err) {
      console.error('Error unmarking alerta as read:', err)
      return { error: handleServiceError(err, 'Error al desmarcar alerta como leída') }
    }
  }

  // Limpiar alertas leídas antiguas (opcional, para mantenimiento)
  async limpiarAlertasAntiguas(diasAntiguedad: number = 30): Promise<{ error: unknown }> {
    try {
      const fechaLimite = new Date()
      fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad)

      const { error } = await this.supabase
        .from('alertas_leidas')
        .delete()
        .lt('fecha_leida', fechaLimite.toISOString())

      return { error }
    } catch (err) {
      console.error('Error cleaning old alertas:', err)
      return { error: handleServiceError(err, 'Error al limpiar alertas antiguas') }
    }
  }
}

export const alertasLeidasService = new AlertasLeidasService()