// src/components/cierres-caja/CierresCajaList.tsx
import React from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CierreDetalladoUI } from '@/lib/services/cierresCajaService'
import { 
  EyeIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CierresCajaListProps {
  cierres: CierreDetalladoUI[]
  loading: boolean
  onViewDetail: (cierre: CierreDetalladoUI) => void
  onCompare?: (cierre: CierreDetalladoUI) => void
  selectedForComparison?: CierreDetalladoUI[]
}

export default function CierresCajaList({ 
  cierres, 
  loading, 
  onViewDetail,
  onCompare,
  selectedForComparison = []
}: CierresCajaListProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getDiscrepanciaColor = (discrepancia: number) => {
    const abs = Math.abs(discrepancia)
    if (abs < 1) return 'text-green-600'
    if (abs < 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDiscrepanciaIcon = (discrepancia: number) => {
    const abs = Math.abs(discrepancia)
    if (abs < 1) return CheckCircleIcon
    return ExclamationTriangleIcon
  }

  const isSelectedForComparison = (cierre: CierreDetalladoUI) => {
    return selectedForComparison.some(c => c.caja.id === cierre.caja.id)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (cierres.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No se encontraron cierres de caja
          </h3>
          <p className="text-gray-600">
            No hay cierres que coincidan con los filtros aplicados.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {cierres.map((cierre) => {
          const DiscrepanciaIcon = getDiscrepanciaIcon(cierre.resumen.discrepanciaTotal)
          const isSelected = isSelectedForComparison(cierre)
          
          return (
            <div
              key={cierre.caja.id}
              className={`border rounded-lg p-6 hover:bg-gray-50 transition-colors ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header del cierre */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cierre del {format(cierre.caja.fecha, 'dd/MM/yyyy', { locale: es })}
                      </h3>
                    </div>
                    
                    {/* Estado de discrepancia */}
                    <div className={`flex items-center ${getDiscrepanciaColor(cierre.resumen.discrepanciaTotal)}`}>
                      <DiscrepanciaIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">
                        {Math.abs(cierre.resumen.discrepanciaTotal) < 1 
                          ? 'Sin discrepancia' 
                          : `Discrepancia: Bs ${formatMoney(Math.abs(cierre.resumen.discrepanciaTotal))}`
                        }
                      </span>
                    </div>
                  </div>

                  {/* Información básica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Cajero</p>
                        <p className="font-medium text-gray-900">
                          {cierre.caja.usuario?.full_name || 'Sin nombre'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Horarios</p>
                        <p className="font-medium text-gray-900">
                          {format(cierre.caja.horaApertura, 'HH:mm')} - {' '}
                          {cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'HH:mm') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Total Sistema</p>
                        <p className="font-medium text-gray-900">
                          Bs {formatMoney(cierre.resumen.totalSistemico)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <BanknotesIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Total Contado</p>
                        <p className="font-medium text-gray-900">
                          Bs {formatMoney(cierre.resumen.totalEfectivoContado + cierre.resumen.totalPuntoVenta)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desglose rápido */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Desglose del Cierre</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Pagos Móvil</p>
                        <p className="font-medium">
                          Bs {formatMoney(cierre.caja.totalPagosMovil)} ({cierre.caja.cantidadPagosMovil})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Zelle</p>
                        <p className="font-medium">
                          Bs {formatMoney(cierre.caja.totalZelleBs)} ({cierre.caja.cantidadZelle})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Notas Crédito</p>
                        <p className="font-medium">
                          Bs {formatMoney(cierre.caja.totalNotasCredito)} ({cierre.caja.cantidadNotasCredito})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Créditos</p>
                        <p className="font-medium">
                          Bs {formatMoney(cierre.caja.totalCreditosBs)} ({cierre.caja.cantidadCreditos})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Observaciones si existen */}
                  {cierre.caja.observaciones && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Observaciones:</span> {cierre.caja.observaciones}
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onViewDetail(cierre)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    Ver Detalle
                  </Button>
                  
                  {onCompare && (
                    <Button
                      variant={isSelected ? "primary" : "outline"}
                      size="sm"
                      onClick={() => onCompare(cierre)}
                      disabled={!isSelected && selectedForComparison.length >= 2}
                    >
                      {isSelected ? 'Seleccionado' : 'Comparar'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Indicador de alertas */}
              {(Math.abs(cierre.resumen.discrepanciaTotal) > 50 || 
                Math.abs(cierre.resumen.discrepanciaReporteZ) > 50 || 
                !cierre.detallesEfectivo) && (
                <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-800">Alertas detectadas:</p>
                      <ul className="text-orange-700 mt-1 space-y-1">
                        {Math.abs(cierre.resumen.discrepanciaTotal) > 50 && (
                          <li>• Discrepancia alta en el total ({formatMoney(cierre.resumen.discrepanciaTotal)} Bs)</li>
                        )}
                        {Math.abs(cierre.resumen.discrepanciaReporteZ) > 50 && (
                          <li>• Discrepancia con Report Z ({formatMoney(cierre.resumen.discrepanciaReporteZ)} Bs)</li>
                        )}
                        {!cierre.detallesEfectivo && (
                          <li>• Sin detalles de efectivo registrados</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}