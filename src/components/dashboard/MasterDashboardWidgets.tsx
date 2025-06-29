// src/components/dashboard/MasterDashboardWidgets.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MasterDashboardStats, CompanyRanking } from '@/lib/services/adminServices'
import { useAuth } from '@/contexts/AuthContext'
import { useAsyncState } from '@/hooks/useAsyncState'
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BellIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface WidgetProps {
  stats: MasterDashboardStats
  companyName?: string
}

interface CompanyRankingProps {
  companies: CompanyRanking[]
}

// Tipo para las alertas de cierres
interface AlertaCierre {
  cierre: any // CierreDetalladoUI del servicio
  tipoAlerta: 'discrepancia_alta' | 'discrepancia_reporte_z' | 'sin_detalles'
  severidad: 'leve' | 'media' | 'alta' | 'critica'
  mensaje: string
}

// Widget de KPIs principales
export function MainKPIsWidget({ stats, companyName }: WidgetProps) {
  const totalVentas = stats.cajaMetrics.totalPagosMovil + 
                     stats.cajaMetrics.totalZelleBs + 
                     stats.cajaMetrics.totalCreditosBs

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Ventas */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Ventas</p>
            <p className="text-2xl font-bold text-gray-900">
              {totalVentas > 0 ? `Bs. ${totalVentas.toLocaleString()}` : 'Bs. 0'}
            </p>
            <p className="text-xs text-gray-400">
              {companyName ? `${companyName} - Últimos 30 días` : 'Todas las compañías'}
            </p>
          </div>
        </div>
      </Card>

      {/* Cajas Activas */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BanknotesIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Cajas</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.cajaMetrics.totalCajas}
            </p>
            <p className="text-xs text-gray-500">
              {stats.cajaMetrics.cajasAbiertas} abiertas
            </p>
          </div>
        </div>
      </Card>

      {/* Créditos Pendientes */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CreditCardIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Créditos</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.creditoMetrics.creditosPendientes}
            </p>
            <p className="text-xs text-gray-500">
              Bs. {stats.creditoMetrics.montoPendienteTotal.toLocaleString()} pendientes
            </p>
          </div>
        </div>
      </Card>

      {/* Alertas */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className={`h-8 w-8 ${
              stats.alertasSeveridad.altas > 0 ? 'text-red-500' : 
              stats.alertasSeveridad.medias > 0 ? 'text-yellow-500' : 'text-green-500'
            }`} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Alertas</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.alertasActivas}
            </p>
            <p className="text-xs text-gray-500">
              {stats.alertasSeveridad.altas} críticas
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Widget de métricas de caja
export function CajaMetricsWidget({ stats }: WidgetProps) {
  const precisionPromedio = 100 - stats.cajaMetrics.promedioDiscrepancia
  const hayCajas = stats.cajaMetrics.totalCajas > 0

  if (!hayCajas) {
    return (
      <Card title="Rendimiento de Cajas">
        <div className="text-center py-8 text-gray-500">
          <BanknotesIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de cajas disponibles</p>
          <p className="text-sm">Los datos aparecerán cuando se registren cajas</p>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Rendimiento de Cajas">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {stats.cajaMetrics.totalCajas - stats.cajaMetrics.cajasConDiscrepancias}
          </div>
          <div className="text-sm text-gray-500">Cierres Precisos</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">
            {stats.cajaMetrics.cajasConDiscrepancias}
          </div>
          <div className="text-sm text-gray-500">Con Discrepancias</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {precisionPromedio.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Precisión Promedio</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">
            ${stats.cajaMetrics.promedioDiscrepancia.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">Discrepancia Promedio</div>
        </div>
      </div>
    </Card>
  )
}

// Widget de distribución de ventas
export function VentasDistribucionWidget({ stats }: WidgetProps) {
  const total = stats.cajaMetrics.totalPagosMovil + 
                stats.cajaMetrics.totalZelleBs + 
                stats.cajaMetrics.totalCreditosBs

  const getPorcentaje = (valor: number) => total > 0 ? (valor / total * 100).toFixed(1) : '0'

  return (
    <Card title="Distribución de Ventas">
      <div className="space-y-4">
        {/* Pagos Móvil */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">Pagos Móvil</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">
              Bs. {stats.cajaMetrics.totalPagosMovil.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPorcentaje(stats.cajaMetrics.totalPagosMovil)}%
            </div>
          </div>
        </div>

        {/* Zelle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">Zelle</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">
              Bs. {stats.cajaMetrics.totalZelleBs.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPorcentaje(stats.cajaMetrics.totalZelleBs)}%
            </div>
          </div>
        </div>

        {/* Créditos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
            <span className="text-sm font-medium">Créditos</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">
              Bs. {stats.cajaMetrics.totalCreditosBs.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPorcentaje(stats.cajaMetrics.totalCreditosBs)}%
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Widget de top cajeros
export function TopCajerosWidget({ stats }: WidgetProps) {
  return (
    <Card title="Top Cajeros">
      {stats.topCajeros.length > 0 ? (
        <div className="space-y-3">
          {stats.topCajeros.map((cajero, index) => (
            <div key={cajero.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{cajero.nombreUsuario}</div>
                  <div className="text-xs text-gray-500">{cajero.cantidadCierres} cierres</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${
                  cajero.promedioDiscrepancia <= 1 ? 'text-green-600' :
                  cajero.promedioDiscrepancia <= 5 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  ${cajero.promedioDiscrepancia.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">promedio</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos de cajeros</p>
        </div>
      )}
    </Card>
  )
}

// Widget de estado de créditos
export function CreditosStatusWidget({ stats }: WidgetProps) {
  const totalCreditos = stats.creditoMetrics.totalCreditos
  const porcentajePagados = totalCreditos > 0 ? 
    (stats.creditoMetrics.creditosPagados / totalCreditos * 100).toFixed(1) : '0'
  const porcentajeVencidos = totalCreditos > 0 ? 
    (stats.creditoMetrics.creditosVencidos / totalCreditos * 100).toFixed(1) : '0'

  return (
    <Card title="Estado de Créditos">
      <div className="space-y-4">
        {/* Pagados */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium">Pagados</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-green-600">
              {stats.creditoMetrics.creditosPagados}
            </div>
            <div className="text-xs text-gray-500">{porcentajePagados}%</div>
          </div>
        </div>

        {/* Pendientes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium">Pendientes</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600">
              {stats.creditoMetrics.creditosPendientes}
            </div>
            <div className="text-xs text-gray-500">
              Bs. {stats.creditoMetrics.montoPendienteTotal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Vencidos */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-sm font-medium">Vencidos</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-red-600">
              {stats.creditoMetrics.creditosVencidos}
            </div>
            <div className="text-xs text-gray-500">{porcentajeVencidos}%</div>
          </div>
        </div>

        {/* Clientes activos */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Clientes con Crédito</span>
            <span className="text-lg font-bold text-gray-900">
              {stats.creditoMetrics.clientesConCredito}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Widget de ranking de compañías (solo vista global)
export function CompanyRankingWidget({ companies }: CompanyRankingProps) {
  return (
    <Card title="Ranking de Compañías">
      {companies.length > 0 ? (
        <div className="space-y-3">
          {companies.slice(0, 5).map((company, index) => (
            <div key={company.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">{company.name}</div>
                  <div className="text-xs text-gray-500">{company.rif}</div>
                </div>
                {!company.isActive && (
                  <div className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded">
                    Inactiva
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  Bs. {company.totalVentas.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {company.totalCajas} cajas • {company.usuariosActivos} usuarios
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay compañías registradas</p>
        </div>
      )}
    </Card>
  )
}

// Widget de alertas con datos específicos de cierres-caja
export function AlertasWidget({ stats, companyName }: WidgetProps) {
  const [showingDetails, setShowingDetails] = useState(false)
  const { user } = useAuth()
  
  // Usar useAsyncState para manejar el estado de las alertas
  const {
    data: alertasDetalle,
    loading,
    error,
    execute: loadAlertasDetalle
  } = useAsyncState<AlertaCierre[]>([])
  
  const companyId = user?.role === 'master' ? undefined : user?.company_id || undefined
  
  useEffect(() => {
    loadAlertasDetalle(async () => {
      const { cierresCajaService } = await import('@/lib/services/cierresCajaService')
      const { data: alertasData } = await cierresCajaService.getAlertasDiscrepancias(companyId, 0)
      
      if (alertasData) {
        // Tomar solo las 5 alertas más críticas
        const alertasOrdenadas = alertasData
          .sort((a, b) => {
            const severidadOrden = { critica: 4, alta: 3, media: 2, leve: 1 }
            const ordenA = severidadOrden[a.severidad as keyof typeof severidadOrden] || 1
            const ordenB = severidadOrden[b.severidad as keyof typeof severidadOrden] || 1
            return ordenB - ordenA
          })
          .slice(0, 5)
        return alertasOrdenadas
      }
      return []
    })
  }, [companyId])
  
  const getSeveridadColor = (cantidad: number, tipo: 'leve' | 'media' | 'alta') => {
    if (cantidad === 0) return 'text-gray-400'
    switch (tipo) {
      case 'leve': return 'text-blue-600'
      case 'media': return 'text-yellow-600'
      case 'alta': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  const getSeveridadIcon = (severidad: string) => {
    switch (severidad) {
      case 'critica': return <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
      case 'alta': return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
      case 'media': return <ClockIcon className="h-4 w-4 text-yellow-600" />
      case 'leve': return <BellIcon className="h-4 w-4 text-blue-600" />
      default: return <BellIcon className="h-4 w-4 text-gray-600" />
    }
  }
  
  const getSeveridadBadgeColor = (severidad: string) => {
    switch (severidad) {
      case 'critica': return 'bg-red-100 text-red-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'leve': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const totalAlertas = stats.alertasActivas || 0

  if (loading) {
    return (
      <Card title="Sistema de Alertas">
        <div className="animate-pulse space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-12 mx-auto"></div>
              </div>
            ))}
          </div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Sistema de Alertas">
      <div className="space-y-4">
        {/* Resumen de alertas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSeveridadColor(stats.alertasSeveridad.altas, 'alta')}`}>
              {stats.alertasSeveridad.altas}
            </div>
            <div className="text-xs text-gray-500">Críticas</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSeveridadColor(stats.alertasSeveridad.medias, 'media')}`}>
              {stats.alertasSeveridad.medias}
            </div>
            <div className="text-xs text-gray-500">Medias</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getSeveridadColor(stats.alertasSeveridad.leves, 'leve')}`}>
              {stats.alertasSeveridad.leves}
            </div>
            <div className="text-xs text-gray-500">Leves</div>
          </div>
        </div>

        {/* Estado general y alertas específicas */}
        <div className={`rounded-lg ${
          totalAlertas === 0 ? 'bg-green-50' :
          stats.alertasSeveridad.altas > 0 ? 'bg-red-50' :
          stats.alertasSeveridad.medias > 0 ? 'bg-yellow-50' :
          'bg-blue-50'
        }`}>
          {totalAlertas === 0 ? (
            <div className="p-3 text-center text-green-700">
              <div className="flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Sistema Operando Normalmente</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BellIcon className="h-5 w-5 mr-2 text-red-600" />
                  <span className="font-medium text-gray-900">
                    {totalAlertas} {totalAlertas === 1 ? 'Alerta Activa' : 'Alertas Activas'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowingDetails(!showingDetails)}
                  className="text-xs"
                >
                  <EyeIcon className="h-3 w-3 mr-1" />
                  {showingDetails ? 'Ocultar' : 'Ver'} Alertas de Cierres
                </Button>
              </div>
              
              {showingDetails && alertasDetalle && alertasDetalle.length > 0 && (
                <div className="p-3 border-t border-gray-200 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alertas de Cierres de Caja:</h4>
                  {alertasDetalle.map((alerta, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-white bg-opacity-75 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        {getSeveridadIcon(alerta.severidad)}
                        <span className="text-gray-700 truncate max-w-[150px]">
                          {alerta.cierre?.caja?.usuario?.full_name || 'Sin cajero'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSeveridadBadgeColor(alerta.severidad)}`}>
                          {alerta.severidad}
                        </span>
                        <span className="text-gray-600">
                          ${Math.abs(alerta.cierre?.resumen?.discrepanciaReporteZUsd || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => window.location.href = '/cierres-caja'}
                    >
                      Ver Todas las Alertas en Cierres de Caja
                    </Button>
                  </div>
                </div>
              )}
              
              {!showingDetails && (
                <div className="px-3 pb-3 text-xs text-center text-gray-600">
                  <div>Incluye discrepancias en cierres de caja</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}