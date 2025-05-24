// src/app/dashboard/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { MainLayout } from '@/components/layout/MainLayout'
import { dashboardService } from '@/lib/services/adminServices'
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UsersIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { formatearFecha } from '@/utils/dateUtils'

interface DashboardStats {
  totalFacturas: number
  totalNotasCredito: number
  totalNotasDebito: number
  totalCompanies?: number
  totalUsers?: number
}

interface RecentActivity {
  id: string
  type: 'factura' | 'nota_credito' | 'nota_debito'
  numero: string
  fecha: string
  total?: number
  created_at: string
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'factura':
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
    case 'nota_credito':
      return <DocumentTextIcon className="h-5 w-5 text-green-500" />
    case 'nota_debito':
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />
    default:
      return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
  }
}

const getActivityLabel = (type: string) => {
  switch (type) {
    case 'factura':
      return 'Factura'
    case 'nota_credito':
      return 'Nota de Crédito'
    case 'nota_debito':
      return 'Nota de Débito'
    default:
      return 'Documento'
  }
}

export default function DashboardPage() {
  const { user, company } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [user, company])

  const loadDashboardData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const companyId = user.role === 'master' ? undefined : company?.id

      // Cargar estadísticas
      const { data: statsData, error: statsError } = await dashboardService.getDashboardStats(companyId)
      if (statsError) {
        setError('Error al cargar estadísticas: ' + statsError.message)
        return
      }
      setStats(statsData)

      // Cargar actividad reciente
      const { data: activityData, error: activityError } = await dashboardService.getRecentActivity(companyId, 10)
      if (activityError) {
        setError('Error al cargar actividad reciente: ' + activityError.message)
        return
      }
      setRecentActivity(activityData || [])

    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'master' ? 'Dashboard Master' : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'master' 
              ? 'Vista general del sistema' 
              : `Resumen de actividades para ${company?.name}`
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Facturas */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Facturas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFacturas}</p>
                </div>
              </div>
            </Card>

            {/* Notas de Crédito */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Notas de Crédito</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNotasCredito}</p>
                </div>
              </div>
            </Card>

            {/* Notas de Débito */}
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Notas de Débito</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNotasDebito}</p>
                </div>
              </div>
            </Card>

            {/* Stats específicas para Master */}
            {user?.role === 'master' ? (
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Compañías</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies || 0}</p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-8 w-8 text-indigo-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Estado</p>
                    <p className="text-lg font-bold text-green-600">Activo</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Stats adicionales para Master */}
        {user?.role === 'master' && stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sistema</p>
                  <p className="text-lg font-bold text-green-600">Operativo</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Actions for regular users */}
          {user?.role !== 'master' && (
            <Card title="Acciones Rápidas">
              <div className="space-y-3">
                <Link
                  href="/notas-debito"
                  className="block w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 text-red-500 mr-3" />
                    <div>
                      <p className="font-medium">Generar Nota de Débito</p>
                      <p className="text-sm text-gray-500">Por diferencial cambiario</p>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          )}

          {/* Actions for master users */}
          {user?.role === 'master' && (
            <Card title="Acciones de Administración">
              <div className="space-y-3">
                <Link
                  href="/admin/companies"
                  className="block w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium">Gestionar Compañías</p>
                      <p className="text-sm text-gray-500">Crear y administrar compañías</p>
                    </div>
                  </div>
                </Link>
                <Link
                  href="/admin/users"
                  className="block w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-indigo-500 mr-3" />
                    <div>
                      <p className="font-medium">Gestionar Usuarios</p>
                      <p className="text-sm text-gray-500">Administrar usuarios y permisos</p>
                    </div>
                  </div>
                </Link>
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card title="Actividad Reciente">
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center p-2 border border-gray-100 rounded-md">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {getActivityLabel(activity.type)} #{activity.numero}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatearFecha(new Date(activity.fecha))}
                        {activity.total && (
                          <span className="ml-2">
                            • Bs. {activity.total.toFixed(2)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatearFecha(new Date(activity.created_at))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No hay actividad reciente</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}