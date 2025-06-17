'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import type { MetricasCuentasPorPagar, DatosGraficoCuentasPorPagar } from '@/types/cuentasPorPagar'

interface DashboardCuentasPorPagarProps {
  metricas: MetricasCuentasPorPagar | null
  companyId?: string
  onRefresh: () => void
}

export function DashboardCuentasPorPagar({ 
  metricas, 
  companyId,
  onRefresh 
}: DashboardCuentasPorPagarProps) {
  const [datosGraficos, setDatosGraficos] = useState<DatosGraficoCuentasPorPagar | null>(null)
  const [loadingGraficos, setLoadingGraficos] = useState(false)

  useEffect(() => {
    if (companyId) {
      cargarDatosGraficos()
    }
  }, [companyId])

  const cargarDatosGraficos = async () => {
    if (!companyId) return

    setLoadingGraficos(true)
    try {
      const result = await cuentasPorPagarService.getDatosGraficos(companyId)
      if (result.data) {
        setDatosGraficos(result.data)
      }
    } catch (error) {
      console.error('Error cargando datos de gráficos:', error)
    } finally {
      setLoadingGraficos(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'vencida':
        return 'text-red-600 bg-red-100'
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-100'
      case 'pagada':
        return 'text-green-600 bg-green-100'
      case 'pendiente_aprobacion':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'vencida':
        return 'Vencidas'
      case 'pendiente':
        return 'Pendientes'
      case 'pagada':
        return 'Pagadas'
      case 'pendiente_aprobacion':
        return 'Pendiente Aprobación'
      default:
        return estado
    }
  }

  if (!metricas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Facturas */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">{metricas.totalFacturas}</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatCurrency(metricas.totalMontoPendiente)} pendiente
              </p>
            </div>
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </Card>

        {/* Facturas Vencidas */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-2xl font-bold text-red-600">{metricas.facturasVencidas}</p>
              <p className="text-sm text-red-500 mt-1">
                {formatCurrency(metricas.montoVencido)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
          </div>
        </Card>

        {/* Por Vencer (7 días) */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Por Vencer (7d)</p>
              <p className="text-2xl font-bold text-yellow-600">{metricas.facturasPorVencer}</p>
              <p className="text-sm text-yellow-500 mt-1">
                {formatCurrency(metricas.montoPorVencer)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </Card>

        {/* Facturas Pagadas */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{metricas.facturasPagadas}</p>
              <p className="text-sm text-green-500 mt-1">
                {formatCurrency(metricas.montoPagado)}
              </p>
            </div>
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tarjetas adicionales si hay facturas pendientes de aprobación */}
      {metricas.facturasPendientesAprobacion > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-blue-500 mr-4" />
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Facturas Pendientes de Aprobación
                </h3>
                <p className="text-sm text-blue-700">
                  {metricas.facturasPendientesAprobacion} facturas por {formatCurrency(metricas.montoPendienteAprobacion)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      )}

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Estado */}
        <Card title="Distribución por Estado">
          <div className="p-6">
            {loadingGraficos ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : datosGraficos?.facturasPorEstado ? (
              <div className="space-y-4">
                {datosGraficos.facturasPorEstado.map((item, index) => {
                  const porcentaje = metricas.totalFacturas > 0 
                    ? (item.cantidad / metricas.totalFacturas * 100).toFixed(1)
                    : '0'
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded mr-3 ${getEstadoColor(item.estado)}`}></div>
                        <span className="text-sm font-medium text-gray-900">
                          {getEstadoLabel(item.estado)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {item.cantidad} ({porcentaje}%)
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.monto)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <ChartBarIcon className="h-8 w-8 mr-2" />
                <span>No hay datos disponibles</span>
              </div>
            )}
          </div>
        </Card>

        {/* Top Proveedores con Deuda */}
        <Card title="Top Proveedores con Deuda">
          <div className="p-6">
            {loadingGraficos ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : datosGraficos?.topProveedoresDeuda && datosGraficos.topProveedoresDeuda.length > 0 ? (
              <div className="space-y-4">
                {datosGraficos.topProveedoresDeuda.slice(0, 5).map((proveedor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {proveedor.proveedor}
                      </p>
                      <p className="text-xs text-gray-500">
                        {proveedor.cantidad} factura{proveedor.cantidad !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(proveedor.monto)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <DocumentTextIcon className="h-8 w-8 mr-2" />
                <span>No hay deudas pendientes</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Vencimientos por mes */}
      {datosGraficos?.vencimientosPorMes && datosGraficos.vencimientosPorMes.length > 0 && (
        <Card title="Vencimientos por Mes">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {datosGraficos.vencimientosPorMes.slice(0, 12).map((mes, index) => {
                const fecha = new Date(mes.mes + '-01')
                const nombreMes = fecha.toLocaleDateString('es-VE', { 
                  year: 'numeric', 
                  month: 'short' 
                })
                
                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {nombreMes}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {mes.cantidad}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(mes.monto)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Botón de actualización */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={onRefresh}
          className="inline-flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Actualizar Datos
        </Button>
      </div>
    </div>
  )
}