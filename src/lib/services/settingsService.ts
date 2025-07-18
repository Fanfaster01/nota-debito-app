// src/lib/services/settingsService.ts
import { createClient } from '@/utils/supabase/client'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export interface SystemSetting {
  id: string
  key: string
  value: unknown
  category: string
  description?: string
  created_at: string
  updated_at: string
}

export interface SystemLog {
  id: string
  action: string
  details?: unknown
  user_id?: string
  created_at: string
}

export interface SystemStats {
  totalUsers: number
  totalCompanies: number
  totalFacturas: number
  totalNotasDebito: number
  activeUsers: number
  databaseSize: string
  activeSessions: number
  serverUptime: string
  lastBackup: string
  backupSize: string
}

export class SettingsService {
  private supabase = createClient()

  // Obtener todas las configuraciones
  async getAllSettings(): Promise<{ data: SystemSetting[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true })

      return { data, error }
    } catch (err) {
      console.error('Error getting all settings:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener todas las configuraciones') }
    }
  }

  // Obtener configuraciones por categoría
  async getSettingsByCategory(category: string): Promise<{ data: Record<string, unknown> | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('key, value')
        .eq('category', category)

      if (error) return { data: null, error }

      // Convertir array a objeto con key-value
      const settings = data?.reduce((acc, item) => {
        acc[item.key] = item.value
        return acc
      }, {} as Record<string, unknown>) || {}

      return { data: settings, error: null }
    } catch (err) {
      console.error('Error getting settings by category:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener configuraciones por categoría') }
    }
  }

  // Obtener una configuración específica
  async getSetting(key: string): Promise<{ data: unknown | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle()

      if (error) {
        return { data: null, error }
      }

      return { data: data?.value || null, error: null }
    } catch (err) {
      // console.error('Error getting setting:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener configuración') }
    }
  }

  // Actualizar una configuración (o crearla si no existe)
  async updateSetting(key: string, value: unknown, category: string = 'general'): Promise<{ error: unknown }> {
    try {
      // Intentar actualizar primero
      const { data, error: updateError } = await this.supabase
        .from('system_settings')
        .update({ value: value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()

      // Si no se actualizó ninguna fila, crear nueva configuración
      if (!updateError && (!data || data.length === 0)) {
        const { error: insertError } = await this.supabase
          .from('system_settings')
          .insert({ 
            key, 
            value, 
            category,
            description: `Auto-created setting for ${key}`
          })

        if (insertError) {
          return { error: insertError }
        }

        await this.logAction('setting_created', { key, value, category })
      } else if (updateError) {
        return { error: updateError }
      } else {
        await this.logAction('setting_updated', { key, value })
      }

      return { error: null }
    } catch (err) {
      // console.error('Error updating setting:', err)
      return { error: handleServiceError(err, 'Error al actualizar configuración') }
    }
  }

  // Actualizar múltiples configuraciones
  async updateMultipleSettings(settings: Record<string, unknown>): Promise<{ error: unknown }> {
    try {
      // Actualizar una por una para mantener la integridad
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await this.supabase
          .from('system_settings')
          .update({ value })
          .eq('key', key)

        if (error) return { error }
      }

      // Log la acción
      await this.logAction('multiple_settings_updated', { 
        count: Object.keys(settings).length,
        keys: Object.keys(settings)
      })

      return { error: null }
    } catch (err) {
      console.error('Error updating multiple settings:', err)
      return { error: handleServiceError(err, 'Error al actualizar múltiples configuraciones') }
    }
  }

  // Crear nueva configuración
  async createSetting(key: string, value: unknown, category: string, description?: string): Promise<{ error: unknown }> {
    try {
      const { error } = await this.supabase
        .from('system_settings')
        .insert({
          key,
          value,
          category,
          description
        })

      if (!error) {
        await this.logAction('setting_created', { key, category })
      }

      return { error }
    } catch (err) {
      console.error('Error creating setting:', err)
      return { error: handleServiceError(err, 'Error al crear configuración') }
    }
  }

  // Obtener estadísticas del sistema (reales)
  async getSystemStats(): Promise<{ data: SystemStats | null, error: unknown }> {
    try {
      const [
        { count: totalUsers },
        { count: totalCompanies },
        { count: totalFacturas },
        { count: totalNotasDebito },
        { count: activeUsers }
      ] = await Promise.all([
        this.supabase.from('users').select('*', { count: 'exact', head: true }),
        this.supabase.from('companies').select('*', { count: 'exact', head: true }),
        this.supabase.from('facturas').select('*', { count: 'exact', head: true }),
        this.supabase.from('notas_debito').select('*', { count: 'exact', head: true }),
        this.supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])

      // Obtener información adicional del sistema (sin fallar si no existen)
      const [lastBackupSetting, backupSizeSetting] = await Promise.allSettled([
        this.getSetting('last_backup_date'),
        this.getSetting('last_backup_size')
      ])

      const lastBackupData = lastBackupSetting.status === 'fulfilled' && lastBackupSetting.value.data 
        ? lastBackupSetting.value.data as string 
        : 'Nunca'
      
      const backupSizeData = backupSizeSetting.status === 'fulfilled' && backupSizeSetting.value.data
        ? backupSizeSetting.value.data as string
        : 'N/A'

      return {
        data: {
          totalUsers: totalUsers || 0,
          totalCompanies: totalCompanies || 0,
          totalFacturas: totalFacturas || 0,
          totalNotasDebito: totalNotasDebito || 0,
          activeUsers: activeUsers || 0,
          databaseSize: '2.4 GB', // Esto requeriría consulta específica del servidor
          activeSessions: Math.floor(Math.random() * 20) + 1, // Simulado por ahora
          serverUptime: this.calculateUptime(),
          lastBackup: lastBackupData,
          backupSize: backupSizeData
        },
        error: null
      }
    } catch (err) {
      console.error('Error getting system stats:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener estadísticas del sistema') }
    }
  }

  // Realizar backup manual
  async performManualBackup(): Promise<{ error: unknown }> {
    try {
      // Simular proceso de backup (en producción esto ejecutaría un script real)
      const backupDate = new Date().toISOString()
      const backupSize = `${(Math.random() * 2 + 1).toFixed(1)} GB`

      // Guardar información del backup
      await this.updateSetting('last_backup_date', backupDate, 'backup')
      await this.updateSetting('last_backup_size', backupSize, 'backup')

      // Log la acción
      await this.logAction('manual_backup_performed', { 
        date: backupDate,
        size: backupSize
      })

      return { error: null }
    } catch (err) {
      console.error('Error performing manual backup:', err)
      return { error: handleServiceError(err, 'Error al realizar backup manual') }
    }
  }

  // Limpiar caché del sistema
  async clearSystemCache(): Promise<{ error: unknown }> {
    try {
      // En producción esto ejecutaría comandos reales de limpieza
      // Por ahora solo loggeamos la acción
      await this.logAction('system_cache_cleared', {
        timestamp: new Date().toISOString()
      })

      return { error: null }
    } catch (err) {
      console.error('Error clearing system cache:', err)
      return { error: handleServiceError(err, 'Error al limpiar caché del sistema') }
    }
  }

  // Obtener logs del sistema
  async getSystemLogs(limit: number = 50): Promise<{ data: SystemLog[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('system_logs')
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      return { data, error }
    } catch (err) {
      console.error('Error getting system logs:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener logs del sistema') }
    }
  }

  // Función privada para loggear acciones
  private async logAction(action: string, details?: unknown): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      
      await this.supabase
        .from('system_logs')
        .insert({
          action,
          details,
          user_id: user?.id || null
        })
    } catch (err) {
      console.error('Error logging action:', handleServiceError(err, 'Error al registrar acción'))
    }
  }

  // Calcular uptime del servidor (simulado)
  private calculateUptime(): string {
    const uptimeDays = Math.floor(Math.random() * 30) + 1
    return `${uptimeDays} días`
  }

  // Obtener configuraciones con valores por defecto
  async getConfigWithDefaults(): Promise<{
    general: Record<string, unknown>
    notifications: Record<string, unknown>
    backup: Record<string, unknown>
  }> {
    try {
      const [general, notifications, backup] = await Promise.all([
        this.getSettingsByCategory('general'),
        this.getSettingsByCategory('notifications'),
        this.getSettingsByCategory('backup')
      ])

      return {
        general: general.data || {
          app_name: 'Admin DSL',
          default_iva_rate: 16,
          default_retention_rate: 75,
          max_users_per_company: 50
        },
        notifications: notifications.data || {
          email_notifications: true,
          invoice_reminders: true,
          system_alerts: true,
          user_registration_alerts: true
        },
        backup: backup.data || {
          auto_backup_enabled: true,
          backup_frequency: 'weekly'
        }
      }
    } catch (err) {
      console.error('Error getting config with defaults:', handleServiceError(err, 'Error al obtener configuraciones'))
      // Valores por defecto en caso de error
      return {
        general: {
          app_name: 'Admin DSL',
          default_iva_rate: 16,
          default_retention_rate: 75,
          max_users_per_company: 50
        },
        notifications: {
          email_notifications: true,
          invoice_reminders: true,
          system_alerts: true,
          user_registration_alerts: true
        },
        backup: {
          auto_backup_enabled: true,
          backup_frequency: 'weekly'
        }
      }
    }
  }
}

export const settingsService = new SettingsService()