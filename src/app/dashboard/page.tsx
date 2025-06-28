// src/app/dashboard/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { MainLayout } from '@/components/layout/MainLayout'
import { dashboardService, MasterDashboardStats, CompanyRanking } from '@/lib/services/adminServices'
import { useAsyncState, useAsyncList } from '@/hooks/useAsyncState'
import { 
  MainKPIsWidget,
  CajaMetricsWidget,
  VentasDistribucionWidget,
  TopCajerosWidget,
  CreditosStatusWidget,
  CompanyRankingWidget,
  AlertasWidget
} from '@/components/dashboard/MasterDashboardWidgets'
import { 
  DocumentTextIcon, 
  BuildingOfficeIcon, 
  UsersIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  GlobeAltIcon
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

interface Company {
  id: string
  name: string
  rif: string
  is_active: boolean
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
  
  // Estados con useAsyncState
  const { data: stats, loading: statsLoading, error: statsError, execute: loadStats } = useAsyncState<DashboardStats | null>()
  const { data: masterStats, loading: masterStatsLoading, error: masterStatsError, execute: loadMasterStats } = useAsyncState<MasterDashboardStats | null>()
  const { data: companyRanking, loading: rankingLoading, error: rankingError, execute: loadRanking } = useAsyncList<CompanyRanking>()
  const { data: companies, loading: companiesLoading, error: companiesError, execute: loadCompanies } = useAsyncList<Company>()
  const { data: recentActivity, loading: activityLoading, error: activityError, execute: loadActivity } = useAsyncList<RecentActivity>()
  
  // Estados locales para UI
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('')
  
  // Loading y error consolidados
  const loading = statsLoading || masterStatsLoading || rankingLoading || companiesLoading || activityLoading
  const error = statsError || masterStatsError || rankingError || companiesError || activityError

  useEffect(() => {
    loadInitialData()
  }, [user, company])

  useEffect(() => {
    if (user?.role === 'master') {
      loadMasterDashboardData()
    } else {
      loadDashboardData()
    }
  }, [selectedCompanyId, user])

  const loadInitialData = async () => {
    if (!user) return

    // Si es master, cargar lista de compañías
    if (user.role === 'master') {
      await loadCompanies(async () => {
        const { data: companiesData, error: companiesError } = await dashboardService.getActiveCompanies()
        if (companiesError) throw companiesError
        return companiesData || []
      })
    }
  }

  const loadDashboardData = async () => {
    if (!user) return

    const companyId = user.role === 'master' ? undefined : company?.id

    // Cargar estadísticas básicas
    await loadStats(async () => {
      const { data: statsData, error: statsError } = await dashboardService.getDashboardStats(companyId)
      if (statsError) throw new Error(`Error al cargar estadísticas: ${statsError instanceof Error ? statsError.message : 'Error desconocido'}`)
      return statsData
    })

    // Cargar actividad reciente
    await loadActivity(async () => {
      const { data: activityData, error: activityError } = await dashboardService.getRecentActivity(companyId, 10)
      if (activityError) throw new Error(`Error al cargar actividad reciente: ${activityError instanceof Error ? activityError.message : 'Error desconocido'}`)
      return activityData || []
    })
  }

  const loadMasterDashboardData = async () => {
    if (!user || user.role !== 'master') return

    // Si no hay compañía seleccionada, cargar vista global
    if (!selectedCompanyId) {
      // Cargar ranking de compañías
      await loadRanking(async () => {
        const { data: rankingData, error: rankingError } = await dashboardService.getCompanyRanking()
        if (rankingError) {
          console.warn('Error cargando ranking:', rankingError)
          return []
        }
        return rankingData || []
      })

      // Cargar estadísticas globales
      await loadMasterStats(async () => {
        const { data: globalStats, error: globalError } = await dashboardService.getMasterDashboardStats()
        if (globalError) throw new Error(`Error al cargar estadísticas globales: ${globalError instanceof Error ? globalError.message : 'Error desconocido'}`)
        return globalStats
      })
    } else {
      // Cargar estadísticas de la compañía seleccionada
      await loadMasterStats(async () => {
        const { data: companyStats, error: companyError } = await dashboardService.getMasterDashboardStats(selectedCompanyId)
        if (companyError) throw new Error(`Error al cargar estadísticas de la compañía: ${companyError instanceof Error ? companyError.message : 'Error desconocido'}`)
        return companyStats
      })
    }

    // Cargar actividad reciente
    await loadActivity(async () => {
      const { data: activityData, error: activityError } = await dashboardService.getRecentActivity(selectedCompanyId || undefined, 10)
      if (activityError) {
        console.warn('Error al cargar actividad reciente:', activityError)
        return []
      }
      return activityData || []
    })
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId)
    const selectedCompany = companies?.find(c => c.id === companyId)
    setSelectedCompanyName(selectedCompany?.name || '')
    // Los datos se limpiarán automáticamente cuando se ejecuten los nuevos hooks
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

  // Renderizar dashboard master mejorado
  if (user?.role === 'master') {
    return (
      <MainLayout>
        <div className="space-y-6">
          {/* Header con selector de compañía */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Master</h1>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCompanyId ? `Análisis detallado de ${selectedCompanyName}` : 'Vista global del sistema'}
              </p>
            </div>
            
            {/* Selector de compañía */}
            <div className="relative">
              <select
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-64"
              >
                <option value="">
                  🌐 Vista Global (Todas las Compañías)
                </option>
                {companies?.map((company) => (
                  <option key={company.id} value={company.id}>
                    🏢 {company.name} - {company.rif}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-2 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => user?.role === 'master' ? loadMasterDashboardData() : loadDashboardData()}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Dashboard content */}
          {masterStats ? (
            <div className="space-y-6">
              {/* KPIs principales */}
              <MainKPIsWidget stats={masterStats} companyName={selectedCompanyName} />

              {/* Grid de widgets principales */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                  {/* Métricas de caja */}
                  <CajaMetricsWidget stats={masterStats} />
                  
                  {/* Distribución de ventas */}
                  <VentasDistribucionWidget stats={masterStats} />
                </div>
                
                <div className="space-y-6">
                  {/* Top cajeros */}
                  <TopCajerosWidget stats={masterStats} />
                  
                  {/* Sistema de alertas */}
                  <AlertasWidget stats={masterStats} />
                </div>
              </div>

              {/* Segunda fila de widgets */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Estado de créditos */}
                <CreditosStatusWidget stats={masterStats} />
                
                {/* Vista global: Ranking de compañías */}
                {!selectedCompanyId && companyRanking && companyRanking.length > 0 && (
                  <CompanyRankingWidget companies={companyRanking} />
                )}
                
                {/* Vista por compañía: Actividad reciente */}
                {selectedCompanyId && (
                  <Card title="Actividad Reciente">
                    {recentActivity && recentActivity.length > 0 ? (
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
                )}
              </div>

              {/* Acciones de administración */}
              <Card title="Acciones de Administración">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/admin/companies"
                    className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-6 w-6 text-purple-500 mr-3" />
                      <div>
                        <p className="font-medium">Gestionar Compañías</p>
                        <p className="text-sm text-gray-500">Crear y administrar</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <UsersIcon className="h-6 w-6 text-indigo-500 mr-3" />
                      <div>
                        <p className="font-medium">Gestionar Usuarios</p>
                        <p className="text-sm text-gray-500">Roles y permisos</p>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-6 w-6 text-green-500 mr-3" />
                      <div>
                        <p className="font-medium">Configuración</p>
                        <p className="text-sm text-gray-500">Sistema global</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </Card>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center min-h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : null}
        </div>
      </MainLayout>
    )
  }

  // Dashboard normal para usuarios admin/user
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Resumen de actividades para {company?.name}
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

            {/* Estado */}
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
          </div>
        )}

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Actions for regular users */}
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

          {/* Recent Activity */}
          <Card title="Actividad Reciente">
            {recentActivity && recentActivity.length > 0 ? (
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