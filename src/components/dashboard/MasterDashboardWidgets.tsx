// src/components/dashboard/MasterDashboardWidgets.tsx
'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MasterDashboardStats, CompanyRanking } from '@/lib/services/adminServices'
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

// Widget de alertas
export function AlertasWidget({ stats }: WidgetProps) {
  const [showingDetails, setShowingDetails] = useState(false)
  
  const getSeveridadColor = (cantidad: number, tipo: 'leve' | 'media' | 'alta') => {
    if (cantidad === 0) return 'text-gray-400'
    switch (tipo) {
      case 'leve': return 'text-blue-600'
      case 'media': return 'text-yellow-600'
      case 'alta': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  const totalAlertas = stats.alertasActivas || 0

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

        {/* Estado general */}
        <div className={`p-3 rounded-lg text-center ${
          totalAlertas === 0 ? 'bg-green-50 text-green-700' :
          stats.alertasSeveridad.altas > 0 ? 'bg-red-50 text-red-700' :
          stats.alertasSeveridad.medias > 0 ? 'bg-yellow-50 text-yellow-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {totalAlertas === 0 ? (
            <div className="flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Sistema Operando Normalmente</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <BellIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  {totalAlertas} {totalAlertas === 1 ? 'Alerta Activa' : 'Alertas Activas'}
                </span>
              </div>
              <div className="text-xs opacity-75">
                Incluye créditos vencidos, próximos a vencer y discrepancias
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowingDetails(!showingDetails)}
                className="mt-2 text-xs"
              >
                <EyeIcon className="h-3 w-3 mr-1" />
                {showingDetails ? 'Ocultar' : 'Ver'} Detalles
              </Button>
              {showingDetails && (
                <div className="mt-2 text-xs text-left space-y-1 bg-white bg-opacity-50 p-2 rounded">
                  <div>• Revisa la sección de créditos para pagos vencidos</div>
                  <div>• Verifica discrepancias en cierres de caja</div>
                  <div>• Las alertas se actualizan automáticamente</div>
                  <div>• Marca como leídas en sus respectivas secciones</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}