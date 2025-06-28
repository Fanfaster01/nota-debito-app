'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { creditoService } from '@/lib/services/creditoService'
import { ClienteSearch } from '@/components/forms/ClienteSearch'
import { ClienteUI } from '@/lib/services/clienteService'
import { CreditoDetalladoUI } from '@/types/creditos'
import { useAsyncState } from '@/hooks/useAsyncState'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  DocumentArrowDownIcon,
  PrinterIcon,
  UserIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { exportEstadoCuentaClienteToExcel } from '@/utils/exportCreditosExcel'
import { generateEstadoCuentaClientePDF } from '@/utils/pdfGenerator'

export default function EstadoCuentaPage() {
  const { user } = useAuth()
  
  // Estados con useAsyncState
  const { data: estadoCuenta, loading, error, execute: loadEstadoCuentaData } = useAsyncState<any>()
  
  // Estados locales para UI
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null)

  // Verificar permisos
  const canAccess = user?.role === 'master' || user?.role === 'admin'

  const handleClienteSelect = async (cliente: ClienteUI) => {
    setSelectedCliente(cliente)
    await loadEstadoCuenta(cliente.id!)
  }

  const loadEstadoCuenta = async (clienteId: string) => {
    await loadEstadoCuentaData(async () => {
      const { data, error } = await creditoService.getEstadoCuentaCliente(clienteId)
      
      if (error) {
        console.error('Error cargando estado de cuenta:', error)
        throw error
      }
      
      return data
    })
  }

  const handleExportExcel = () => {
    if (!estadoCuenta) return
    
    try {
      exportEstadoCuentaClienteToExcel(
        estadoCuenta.cliente,
        estadoCuenta.creditos,
        estadoCuenta.totales
      )
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al generar el archivo Excel')
    }
  }

  const handlePrintPDF = () => {
    if (!estadoCuenta) return
    
    try {
      generateEstadoCuentaClientePDF(
        estadoCuenta.cliente,
        estadoCuenta.creditos,
        estadoCuenta.totales
      )
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el PDF')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'pagado': 'bg-green-100 text-green-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getVencimientoBadge = (estadoVencimiento: string) => {
    const badges = {
      'Pagado': 'bg-green-100 text-green-800',
      'Vigente': 'bg-blue-100 text-blue-800',
      'Por vencer': 'bg-yellow-100 text-yellow-800',
      'Vencido': 'bg-red-100 text-red-800'
    }
    return badges[estadoVencimiento as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estado de Cuenta por Cliente</h1>
            <p className="text-gray-600 mt-1">
              Consulta el historial completo de créditos de un cliente
            </p>
          </div>
          {estadoCuenta && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleExportExcel}
                className="flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant="secondary"
                onClick={handlePrintPDF}
                className="flex items-center"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Búsqueda de cliente */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Seleccionar Cliente</h3>
          <ClienteSearch
            onClienteSelect={handleClienteSelect}
          />
        </Card>

        {/* Estado de cuenta */}
        {loading && (
          <Card className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </Card>
        )}

        {estadoCuenta && !loading && (
          <div className="space-y-6">
            {/* Información del cliente */}
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{estadoCuenta.cliente.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-medium text-gray-900">
                    {estadoCuenta.cliente.tipo_documento}-{estadoCuenta.cliente.numero_documento}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{estadoCuenta.cliente.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dirección</p>
                  <p className="font-medium text-gray-900">{estadoCuenta.cliente.direccion || 'No registrada'}</p>
                </div>
              </div>
            </Card>

            {/* Resumen financiero */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center">
                  <CreditCardIcon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Créditos</p>
                    <p className="text-2xl font-bold text-gray-900">{estadoCuenta.totales.totalCreditos}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-600">{estadoCuenta.totales.creditosPendientes}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monto Pendiente</p>
                    <p className="text-2xl font-bold text-red-600">Bs {formatMoney(estadoCuenta.totales.montoPendiente)}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monto Abonado</p>
                    <p className="text-2xl font-bold text-green-600">Bs {formatMoney(estadoCuenta.totales.montoAbonado)}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Historial de créditos */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Créditos</h3>
              
              {estadoCuenta.creditos.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Este cliente no tiene créditos registrados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {estadoCuenta.creditos.map((credito: CreditoDetalladoUI) => (
                    <div key={credito.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Factura #{credito.numeroFactura}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(credito.estado)}`}>
                              {credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVencimientoBadge(credito.estadoVencimiento)}`}>
                              {credito.estadoVencimiento}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Fecha del Crédito</p>
                              <p className="font-medium">{format(credito.fechaHora, 'dd/MM/yyyy', { locale: es })}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Monto Total</p>
                              <p className="font-medium">Bs {formatMoney(credito.montoBs)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Monto Abonado</p>
                              <p className="font-medium text-green-600">Bs {formatMoney(credito.montoAbonado)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Saldo Pendiente</p>
                              <p className="font-medium text-red-600">Bs {formatMoney(credito.saldoPendiente)}</p>
                            </div>
                          </div>

                          {credito.fechaVencimiento && (
                            <div className="mt-2 text-sm">
                              <p className="text-gray-600">
                                Vence el: {format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                          )}

                          {credito.observaciones && (
                            <div className="mt-2 text-sm">
                              <p className="text-gray-600">
                                <span className="font-medium">Observaciones:</span> {credito.observaciones}
                              </p>
                            </div>
                          )}

                          {/* Progreso de pago */}
                          {credito.estado === 'pendiente' && credito.montoAbonado > 0 && (
                            <div className="mt-3">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progreso de pago</span>
                                <span>{Math.round((credito.montoAbonado / credito.montoBs) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${(credito.montoAbonado / credito.montoBs) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}