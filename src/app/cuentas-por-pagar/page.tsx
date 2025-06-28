'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAsyncState } from '@/hooks/useAsyncState'
import { 
  DocumentPlusIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import type { MetricasCuentasPorPagar } from '@/types/cuentasPorPagar'

// Importar componentes que crearemos
import { DashboardCuentasPorPagar } from '@/components/cuentas-por-pagar/DashboardCuentasPorPagar'
import { ListaFacturasCuentasPorPagar } from '@/components/cuentas-por-pagar/ListaFacturasCuentasPorPagar'
import { FacturaFormCuentasPorPagar } from '@/components/cuentas-por-pagar/FacturaFormCuentasPorPagar'
import { NotasDebitoContent } from '@/components/notas-debito/NotasDebitoContent'

type TabActivo = 'dashboard' | 'agregar-factura' | 'consultar-facturas' | 'consultar-notas-debito'

export default function CuentasPorPagarPage() {
  const { user, company } = useAuth()
  const [tabActivo, setTabActivo] = useState<TabActivo>('dashboard')
  // Estados con useAsyncState
  const { data: metricas, loading, error, execute: loadMetricas } = useAsyncState<MetricasCuentasPorPagar | null>()
  
  // Estado local para UI
  const [displayError, setDisplayError] = useState<string | null>(null)

  const cargarMetricas = useCallback(async () => {
    if (!company?.id) return

    await loadMetricas(async () => {
      const result = await cuentasPorPagarService.getMetricas(company.id!)
      if (result.error) {
        setDisplayError(result.error)
        throw new Error(result.error)
      }
      return result.data
    })
  }, [company?.id, loadMetricas])

  // Cargar métricas al montar el componente
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'master')) {
      cargarMetricas()
    }
  }, [company?.id, user?.role, cargarMetricas])

  // Solo admin y master pueden acceder
  if (!user || (user.role !== 'admin' && user.role !== 'master')) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Card title="Acceso Denegado">
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                Solo los administradores y usuarios master pueden acceder a la gestión de cuentas por pagar.
              </p>
            </div>
          </Card>
        </div>
      </MainLayout>
    )
  }

  const handleFacturaCreada = () => {
    setTabActivo('dashboard') // Volver al dashboard después de crear factura
    cargarMetricas() // Recargar métricas después de crear factura
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cuentas por Pagar
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestión integral de facturas de proveedores, pagos y notas de débito
              </p>
            </div>
            
            {(tabActivo === 'dashboard' || tabActivo === 'consultar-facturas') && (
              <div className="mt-4 sm:mt-0">
                <Button
                  onClick={() => setTabActivo('agregar-factura')}
                  className="inline-flex items-center"
                >
                  <DocumentPlusIcon className="h-5 w-5 mr-2" />
                  Nueva Factura
                </Button>
              </div>
            )}
          </div>

          {/* Alertas rápidas si hay facturas vencidas o por vencer */}
          {metricas && (metricas.facturasVencidas > 0 || metricas.facturasPorVencer > 0) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {metricas.facturasVencidas > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        {metricas.facturasVencidas} facturas vencidas
                      </p>
                      <p className="text-sm text-red-600">
                        Monto: Bs. {metricas.montoVencido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {metricas.facturasPorVencer > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        {metricas.facturasPorVencer} facturas por vencer (7 días)
                      </p>
                      <p className="text-sm text-yellow-600">
                        Monto: Bs. {metricas.montoPorVencer.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setTabActivo('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tabActivo === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Dashboard
            </button>

            <button
              onClick={() => setTabActivo('agregar-factura')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tabActivo === 'agregar-factura'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentPlusIcon className="h-5 w-5 inline mr-2" />
              Agregar Factura
            </button>

            <button
              onClick={() => setTabActivo('consultar-facturas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tabActivo === 'consultar-facturas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Consultar Facturas
            </button>
            
            <button
              onClick={() => setTabActivo('consultar-notas-debito')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                tabActivo === 'consultar-notas-debito'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Consultar Notas de Débito
            </button>
          </nav>
        </div>

        {/* Contenido de los tabs */}
        {tabActivo === 'dashboard' && (
          <div className="space-y-8">
            {/* Dashboard con métricas */}
            <DashboardCuentasPorPagar 
              metricas={metricas}
              companyId={company?.id}
              onRefresh={cargarMetricas}
            />
          </div>
        )}

        {tabActivo === 'agregar-factura' && (
          <div>
            <FacturaFormCuentasPorPagar
              companyId={company?.id}
              userId={user?.id}
              onClose={() => setTabActivo('dashboard')}
              onFacturaCreada={handleFacturaCreada}
            />
          </div>
        )}

        {tabActivo === 'consultar-facturas' && (
          <div>
            {/* Lista de facturas */}
            <ListaFacturasCuentasPorPagar 
              companyId={company?.id}
              onFacturaUpdated={cargarMetricas}
            />
          </div>
        )}

        {tabActivo === 'consultar-notas-debito' && (
          <NotasDebitoContent embedded={true} />
        )}

        {/* Error message */}
        {(error || displayError) && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              <span>{error || displayError}</span>
              <button
                onClick={() => setDisplayError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}