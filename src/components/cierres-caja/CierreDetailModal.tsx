// src/components/cierres-caja/CierreDetailModal.tsx
import React from 'react'
import { CierreDetalladoUI } from '@/lib/services/cierresCajaService'
import { Button } from '@/components/ui/Button'
import { 
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { generateCierreDetallePDF } from '@/utils/pdfCierres'

interface CierreDetailModalProps {
  cierre: CierreDetalladoUI | null
  isOpen: boolean
  onClose: () => void
}

export default function CierreDetailModal({ 
  cierre, 
  isOpen, 
  onClose
}: CierreDetailModalProps) {
  if (!isOpen || !cierre) return null

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatMoneyUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getDiscrepanciaColor = (discrepancia: number) => {
    const abs = Math.abs(discrepancia)
    if (abs < 1) return 'text-green-600 bg-green-50 border-green-200'
    if (abs < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const DiscrepanciaIcon = Math.abs(cierre.resumen.discrepanciaTotal) < 1 ? CheckCircleIcon : ExclamationTriangleIcon

  const handlePrintReport = () => {
    if (!cierre) return
    
    try {
      generateCierreDetallePDF(cierre)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el reporte PDF')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Detalle de Cierre - {format(cierre.caja.fecha, 'dd/MM/yyyy', { locale: es })}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrintReport}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              Descargar PDF
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Información general del cierre */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Info básica */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                Información General
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 w-20">Cajero:</span>
                  <span className="font-medium">{cierre.caja.usuario?.full_name || 'Sin nombre'}</span>
                </div>
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 w-20">Compañía:</span>
                  <span className="font-medium">{cierre.caja.company?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 w-20">Apertura:</span>
                  <span className="font-medium">{format(cierre.caja.horaApertura, 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 w-20">Cierre:</span>
                  <span className="font-medium">
                    {cierre.caja.horaCierre ? format(cierre.caja.horaCierre, 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 w-20">Tasa:</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.tasaDia)} x USD</span>
                </div>
              </div>
            </div>

            {/* Estado de discrepancia */}
            <div className={`rounded-lg p-4 border ${getDiscrepanciaColor(cierre.resumen.discrepanciaTotal)}`}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <DiscrepanciaIcon className="h-5 w-5 mr-2" />
                Estado del Cierre
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Discrepancia Total</p>
                  <p className="text-2xl font-bold">
                    Bs {formatMoney(Math.abs(cierre.resumen.discrepanciaTotal))}
                    {cierre.resumen.discrepanciaTotal > 0 ? ' (Faltante)' : cierre.resumen.discrepanciaTotal < 0 ? ' (Sobrante)' : ''}
                  </p>
                </div>
                {cierre.detallesEfectivo?.reporte_z && (
                  <div>
                    <p className="text-sm font-medium">Discrepancia vs Report Z</p>
                    <p className="text-lg font-semibold">
                      Bs {formatMoney(Math.abs(cierre.resumen.discrepanciaReporteZ))}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    {Math.abs(cierre.resumen.discrepanciaTotal) < 1 
                      ? '✓ Cierre cuadrado sin discrepancias' 
                      : Math.abs(cierre.resumen.discrepanciaTotal) < 50
                      ? '⚠ Discrepancia menor, dentro del rango aceptable'
                      : '⚠ Discrepancia significativa, requiere revisión'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de totales */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Totales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Sistema</p>
                <p className="text-2xl font-bold text-blue-600">Bs {formatMoney(cierre.resumen.totalSistemico)}</p>
                <p className="text-xs text-gray-500">Calculado por el sistema</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Total Contado</p>
                <p className="text-2xl font-bold text-green-600">
                  Bs {formatMoney(cierre.resumen.totalEfectivoContado + cierre.resumen.totalPuntoVenta)}
                </p>
                <p className="text-xs text-gray-500">Efectivo + Punto de Venta</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Diferencia</p>
                <p className={`text-2xl font-bold ${cierre.resumen.discrepanciaTotal === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Bs {formatMoney(Math.abs(cierre.resumen.discrepanciaTotal))}
                </p>
                <p className="text-xs text-gray-500">
                  {cierre.resumen.discrepanciaTotal > 0 ? 'Faltante' : cierre.resumen.discrepanciaTotal < 0 ? 'Sobrante' : 'Cuadrado'}
                </p>
              </div>
            </div>
          </div>

          {/* Desglose de transacciones del sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Transacciones del Sistema</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pagos Móvil ({cierre.caja.cantidadPagosMovil})</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.totalPagosMovil)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Zelle ({cierre.caja.cantidadZelle})</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.totalZelleBs)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Notas Crédito ({cierre.caja.cantidadNotasCredito})</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.totalNotasCredito)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Créditos ({cierre.caja.cantidadCreditos})</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.totalCreditosBs)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Sistema</span>
                    <span>Bs {formatMoney(cierre.resumen.totalSistemico)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Montos de apertura y cierre */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Fondos de Caja</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Apertura (Bs)</span>
                  <span className="font-medium">Bs {formatMoney(cierre.caja.montoApertura)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Apertura (USD)</span>
                  <span className="font-medium">{formatMoneyUSD(cierre.caja.montoAperturaUsd)}</span>
                </div>
                {cierre.detallesEfectivo && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fondo Caja (Bs)</span>
                      <span className="font-medium">Bs {formatMoney(cierre.detallesEfectivo.fondo_caja_bs || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fondo Caja (USD)</span>
                      <span className="font-medium">{formatMoneyUSD(cierre.detallesEfectivo.fondo_caja_dolares || 0)}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Cierre Total</span>
                    <span>Bs {formatMoney(cierre.caja.montoCierre || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del efectivo contado */}
          {cierre.detallesEfectivo && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <BanknotesIcon className="h-5 w-5 mr-2 text-green-600" />
                Efectivo Contado en Cierre
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Dólares</span>
                  <p className="font-medium">{formatMoneyUSD(cierre.detallesEfectivo.efectivo_dolares || 0)}</p>
                  <p className="text-xs text-gray-500">
                    ≈ Bs {formatMoney((cierre.detallesEfectivo.efectivo_dolares || 0) * cierre.caja.tasaDia)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Euros</span>
                  <p className="font-medium">€ {formatMoney(cierre.detallesEfectivo.efectivo_euros || 0)}</p>
                  <p className="text-xs text-gray-500">
                    ≈ Bs {formatMoney((cierre.detallesEfectivo.efectivo_euros || 0) * cierre.caja.tasaDia * 1.1)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Bolívares</span>
                  <p className="font-medium">Bs {formatMoney(cierre.detallesEfectivo.efectivo_bs || 0)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Total Efectivo</span>
                  <p className="font-semibold text-green-600">Bs {formatMoney(cierre.resumen.totalEfectivoContado)}</p>
                </div>
              </div>
              
              {cierre.detallesEfectivo.reporte_z && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Report Z (Fiscal)</span>
                    <span className="font-medium">Bs {formatMoney(cierre.detallesEfectivo.reporte_z)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cierres de punto de venta */}
          {cierre.detallesPuntoVenta.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <CreditCardIcon className="h-5 w-5 mr-2 text-blue-600" />
                Cierres de Punto de Venta
              </h4>
              <div className="space-y-3">
                {cierre.detallesPuntoVenta.map((pv, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{pv.banco.nombre} ({pv.banco.codigo})</p>
                      {pv.numero_lote && (
                        <p className="text-xs text-gray-600">Lote: {pv.numero_lote}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Bs {formatMoney(pv.monto_bs)}</p>
                      <p className="text-xs text-gray-600">{formatMoneyUSD(pv.monto_usd)}</p>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total Punto de Venta</span>
                    <span>Bs {formatMoney(cierre.resumen.totalPuntoVenta)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {cierre.caja.observaciones && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Observaciones</h4>
              <p className="text-sm text-gray-700">{cierre.caja.observaciones}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}