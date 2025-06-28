// src/app/admin/settings/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MainLayout } from '@/components/layout/MainLayout'
import { settingsService, SystemStats } from '@/lib/services/settingsService'
import { handleServiceError } from '@/utils/errorHandler'
import { useAsyncState } from '@/hooks/useAsyncState'
import { 
  CogIcon,
  CircleStackIcon,
  BellIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Esquemas de validación
const systemConfigSchema = z.object({
  app_name: z.string().min(1, 'El nombre de la aplicación es requerido'),
  default_iva_rate: z.number().min(0).max(100, 'La tasa de IVA debe estar entre 0 y 100'),
  default_retention_rate: z.number().min(0).max(100, 'La tasa de retención debe estar entre 0 y 100'),
  auto_backup_enabled: z.boolean(),
  backup_frequency: z.enum(['daily', 'weekly', 'monthly']),
  max_users_per_company: z.number().min(1, 'Debe permitir al menos 1 usuario por compañía'),
})

const notificationConfigSchema = z.object({
  email_notifications: z.boolean(),
  invoice_reminders: z.boolean(),
  system_alerts: z.boolean(),
  user_registration_alerts: z.boolean(),
})

type SystemConfigFormData = z.infer<typeof systemConfigSchema>
type NotificationConfigFormData = z.infer<typeof notificationConfigSchema>

export default function SettingsPage() {
  const { user } = useAuth()
  
  // Estados con useAsyncState
  const { data: systemStats, loading: statsLoading, error: statsError, execute: loadSystemStatsData } = useAsyncState<SystemStats | null>()
  const { loading: saveLoading, error: saveError, execute: saveSettings } = useAsyncState<unknown>()
  
  // Estados locales para UI
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'backup' | 'system'>('general')
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Loading y error consolidados
  const loading = statsLoading || saveLoading
  const error = statsError || saveError || localError

  // Formulario de configuración general
  const systemForm = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      app_name: 'Admin DSL',
      default_iva_rate: 16,
      default_retention_rate: 75,
      auto_backup_enabled: true,
      backup_frequency: 'weekly',
      max_users_per_company: 50,
    }
  })

  // Formulario de notificaciones
  const notificationForm = useForm<NotificationConfigFormData>({
    resolver: zodResolver(notificationConfigSchema),
    defaultValues: {
      email_notifications: true,
      invoice_reminders: true,
      system_alerts: true,
      user_registration_alerts: true,
    }
  })

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    if (user?.role === 'master') {
      loadSettings()
      loadSystemStats()
    }
  }, [user])

  const loadSettings = async () => {
    try {
      const config = await settingsService.getConfigWithDefaults()
      
      // Actualizar formulario de configuración general
      systemForm.reset({
        app_name: String(config.general.app_name || 'NotaDebito App'),
        default_iva_rate: Number(config.general.default_iva_rate || 16),
        default_retention_rate: Number(config.general.default_retention_rate || 75),
        max_users_per_company: Number(config.general.max_users_per_company || 10),
        auto_backup_enabled: Boolean(config.backup.auto_backup_enabled),
        backup_frequency: (config.backup.backup_frequency as 'daily' | 'weekly' | 'monthly') || 'weekly',
      })

      // Actualizar formulario de notificaciones
      notificationForm.reset({
        email_notifications: Boolean(config.notifications.email_notifications),
        invoice_reminders: Boolean(config.notifications.invoice_reminders),
        system_alerts: Boolean(config.notifications.system_alerts),
        user_registration_alerts: Boolean(config.notifications.user_registration_alerts),
      })
    } catch (err) {
      setLocalError('Error al cargar configuraciones: ' + handleServiceError(err, 'Error desconocido'))
    }
  }

  const loadSystemStats = async () => {
    await loadSystemStatsData(async () => {
      const { data, error } = await settingsService.getSystemStats()
      if (error) {
        console.error('Error loading system stats:', error)
        throw error
      }
      return data
    })
  }

  const handleSystemConfigSubmit = async (data: SystemConfigFormData) => {
    await saveSettings(async () => {
      setLocalError(null)
      setSuccess(null)

      const settingsToUpdate = {
        app_name: data.app_name,
        default_iva_rate: data.default_iva_rate,
        default_retention_rate: data.default_retention_rate,
        max_users_per_company: data.max_users_per_company,
        auto_backup_enabled: data.auto_backup_enabled,
        backup_frequency: data.backup_frequency,
      }

      const { error } = await settingsService.updateMultipleSettings(settingsToUpdate)
      
      if (error) {
        const errorMessage = handleServiceError(error)
        throw new Error('Error al guardar la configuración: ' + errorMessage)
      }
      
      setSuccess('Configuración del sistema actualizada exitosamente')
      return true
    })
  }

  const handleNotificationConfigSubmit = async (data: NotificationConfigFormData) => {
    await saveSettings(async () => {
      setLocalError(null)
      setSuccess(null)

      const { error } = await settingsService.updateMultipleSettings(data)
      
      if (error) {
        const errorMessage = handleServiceError(error)
        throw new Error('Error al guardar las notificaciones: ' + errorMessage)
      }
      
      setSuccess('Configuración de notificaciones actualizada exitosamente')
      return true
    })
  }

  const handleManualBackup = async () => {
    await saveSettings(async () => {
      setLocalError(null)
      setSuccess(null)

      const { error } = await settingsService.performManualBackup()
      
      if (error) {
        const errorMessage = handleServiceError(error)
        throw new Error('Error al realizar el backup: ' + errorMessage)
      }
      
      setSuccess('Backup manual completado exitosamente')
      await loadSystemStats()
      return true
    })
  }

  const handleClearCache = async () => {
    await saveSettings(async () => {
      setLocalError(null)
      setSuccess(null)

      const { error } = await settingsService.clearSystemCache()
      
      if (error) {
        const errorMessage = handleServiceError(error)
        throw new Error('Error al limpiar el caché: ' + errorMessage)
      }
      
      setSuccess('Caché del sistema limpiado exitosamente')
      return true
    })
  }

  // Control de acceso
  if (user?.role !== 'master') {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">No tienes permisos para acceder a esta página</p>
        </div>
      </MainLayout>
    )
  }

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'backup', name: 'Respaldo', icon: CircleStackIcon },
    { id: 'system', name: 'Sistema', icon: ServerIcon },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra la configuración general de Admin DSL
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setLocalError(null)}
              className="ml-auto text-sm text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-green-600">{success}</p>
            <button 
              onClick={() => setSuccess(null)}
              className="ml-auto text-sm text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'general' | 'notifications' | 'security' | 'backup' | 'system')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* General Configuration */}
          {activeTab === 'general' && (
            <Card title="Configuración General del Sistema">
              <form onSubmit={systemForm.handleSubmit(handleSystemConfigSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Nombre de la Aplicación"
                    {...systemForm.register('app_name')}
                    error={systemForm.formState.errors.app_name?.message}
                  />
                  <Input
                    label="Máximo de Usuarios por Compañía"
                    type="number"
                    {...systemForm.register('max_users_per_company', { valueAsNumber: true })}
                    error={systemForm.formState.errors.max_users_per_company?.message}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Tasa de IVA por Defecto (%)"
                    type="number"
                    step="0.01"
                    {...systemForm.register('default_iva_rate', { valueAsNumber: true })}
                    error={systemForm.formState.errors.default_iva_rate?.message}
                  />
                  <Input
                    label="Tasa de Retención por Defecto (%)"
                    type="number"
                    step="0.01"
                    {...systemForm.register('default_retention_rate', { valueAsNumber: true })}
                    error={systemForm.formState.errors.default_retention_rate?.message}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card title="Configuración de Notificaciones">
              <form onSubmit={notificationForm.handleSubmit(handleNotificationConfigSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Notificaciones por Email</label>
                      <p className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</p>
                    </div>
                    <input
                      type="checkbox"
                      {...notificationForm.register('email_notifications')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Recordatorios de Facturas</label>
                      <p className="text-sm text-gray-500">Alertas sobre facturas pendientes o vencidas</p>
                    </div>
                    <input
                      type="checkbox"
                      {...notificationForm.register('invoice_reminders')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Alertas del Sistema</label>
                      <p className="text-sm text-gray-500">Notificaciones sobre errores y mantenimiento del sistema</p>
                    </div>
                    <input
                      type="checkbox"
                      {...notificationForm.register('system_alerts')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Registro de Usuarios</label>
                      <p className="text-sm text-gray-500">Alertas cuando se registren nuevos usuarios</p>
                    </div>
                    <input
                      type="checkbox"
                      {...notificationForm.register('user_registration_alerts')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Notificaciones'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <Card title="Configuración de Seguridad">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 p-4 rounded-md">
                    <h4 className="font-medium text-green-800 mb-2">Autenticación</h4>
                    <p className="text-sm text-green-600 mb-3">Sistema de autenticación habilitado</p>
                    <Button variant="outline" size="sm">Configurar 2FA</Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Sesiones</h4>
                    <p className="text-sm text-blue-600 mb-3">Gestión automática de sesiones activa</p>
                    <Button variant="outline" size="sm">Ver Sesiones Activas</Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Políticas de Contraseña</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Mínimo 8 caracteres</p>
                    <p>• Al menos una letra mayúscula</p>
                    <p>• Al menos un número</p>
                    <p>• Expiración cada 90 días</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Backup */}
          {activeTab === 'backup' && (
            <Card title="Configuración de Respaldos">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Respaldos Automáticos
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...systemForm.register('auto_backup_enabled')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-600">Habilitar respaldos automáticos</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia de Respaldo
                    </label>
                    <select
                      {...systemForm.register('backup_frequency')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Información de Respaldos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Último Respaldo:</span>
                      <span className="ml-2 text-gray-600">
                        {systemStats?.lastBackup && systemStats.lastBackup !== 'Nunca' 
                          ? new Date(systemStats.lastBackup).toLocaleString()
                          : 'Nunca'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Tamaño del Respaldo:</span>
                      <span className="ml-2 text-gray-600">{systemStats?.backupSize || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button onClick={handleManualBackup} disabled={loading}>
                      {loading ? 'Creando Respaldo...' : 'Crear Respaldo Manual'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* System Info */}
          {activeTab === 'system' && (
            <Card title="Información del Sistema">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <CircleStackIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Base de Datos</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.databaseSize || 'Cargando...'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-blue-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Facturas</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.totalFacturas || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-8 w-8 text-green-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Usuarios Activos</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.activeUsers || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-purple-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Tiempo Activo</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.serverUptime || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <ServerIcon className="h-8 w-8 text-orange-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Sesiones Activas</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.activeSessions || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex items-center">
                      <CircleStackIcon className="h-8 w-8 text-indigo-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Total Compañías</p>
                        <p className="text-lg font-bold text-gray-600">{systemStats?.totalCompanies || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Mantenimiento del Sistema</h4>
                  <div className="space-y-3">
                    <Button variant="outline" onClick={handleClearCache} disabled={loading}>
                      {loading ? 'Limpiando...' : 'Limpiar Caché del Sistema'}
                    </Button>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <InformationCircleIcon className="h-4 w-4 mr-2" />
                      La limpieza de caché puede mejorar el rendimiento del sistema
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Información de la Aplicación</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Versión:</span>
                      <span>Admin DSL v1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Entorno:</span>
                      <span>Producción</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Base de Datos:</span>
                      <span>PostgreSQL 15.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Framework:</span>
                      <span>Next.js 14</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}