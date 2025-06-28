// src/components/cierres-caja/ComparacionCierresModal.tsx
import React, { useState, useEffect } from 'react'
import { CierreDetalladoUI } from '@/lib/services/cierresCajaService'
import { Button } from '@/components/ui/Button'
import { 
  XMarkIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface DiferenciasData {
  diferenciaSistemico: number
  diferenciaEfectivo: number
  diferenciaPuntoVenta: number
  diferenciaDiscrepancia: number
  mejorPrecision: 'cierre1' | 'cierre2'
}

interface ComparacionCierresModalProps {
  cierres: CierreDetalladoUI[]
  isOpen: boolean
  onClose: () => void
}

interface ComparacionData {
  cierre1: CierreDetalladoUI
  cierre2: CierreDetalladoUI
  comparacion: {
    diferenciaSistemico: number
    diferenciaEfectivo: number
    diferenciaPuntoVenta: number
    diferenciaDiscrepancia: number
    mejorPrecision: 'cierre1' | 'cierre2'
    recomendaciones: string[]
  }
}

export default function ComparacionCierresModal({ 
  cierres, 
  isOpen, 
  onClose 
}: ComparacionCierresModalProps) {
  const [comparacionData, setComparacionData] = useState<ComparacionData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && cierres.length === 2) {
      compararCierres()
    }
  }, [isOpen, cierres])

  const compararCierres = async () => {
    if (cierres.length !== 2) return

    setLoading(true)
    
    const cierre1 = cierres[0]
    const cierre2 = cierres[1]

    // Realizar comparación detallada
    const diferenciaSistemico = cierre1.resumen.totalSistemico - cierre2.resumen.totalSistemico
    const diferenciaEfectivo = cierre1.resumen.totalEfectivoContado - cierre2.resumen.totalEfectivoContado
    const diferenciaPuntoVenta = cierre1.resumen.totalPuntoVenta - cierre2.resumen.totalPuntoVenta
    const diferenciaDiscrepancia = cierre1.resumen.discrepanciaTotal - cierre2.resumen.discrepanciaTotal

    const mejorPrecision = Math.abs(cierre1.resumen.discrepanciaTotal) < Math.abs(cierre2.resumen.discrepanciaTotal) 
      ? 'cierre1' : 'cierre2'

    // Generar recomendaciones
    const recomendaciones = generarRecomendaciones(cierre1, cierre2, {
      diferenciaSistemico,
      diferenciaEfectivo,
      diferenciaPuntoVenta,
      diferenciaDiscrepancia,
      mejorPrecision
    })

    setComparacionData({
      cierre1,
      cierre2,
      comparacion: {
        diferenciaSistemico,
        diferenciaEfectivo,
        diferenciaPuntoVenta,
        diferenciaDiscrepancia,
        mejorPrecision,
        recomendaciones
      }
    })

    setLoading(false)
  }

  const generarRecomendaciones = (
    cierre1: CierreDetalladoUI, 
    cierre2: CierreDetalladoUI, 
    diferencias: DiferenciasData
  ): string[] => {
    const recomendaciones: string[] = []

    // Análisis de precisión
    if (Math.abs(cierre1.resumen.discrepanciaTotal) < Math.abs(cierre2.resumen.discrepanciaTotal)) {
      recomendaciones.push(`El cierre del ${format(cierre1.caja.fecha, 'dd/MM/yyyy')} tiene mejor precisión (menor discrepancia)`)
    } else if (Math.abs(cierre2.resumen.discrepanciaTotal) < Math.abs(cierre1.resumen.discrepanciaTotal)) {
      recomendaciones.push(`El cierre del ${format(cierre2.caja.fecha, 'dd/MM/yyyy')} tiene mejor precisión (menor discrepancia)`)
    } else {
      recomendaciones.push('Ambos cierres tienen la misma precisión')
    }

    // Análisis de volumen
    if (Math.abs(diferencias.diferenciaSistemico) > 1000) {
      const mayorVolumen = diferencias.diferenciaSistemico > 0 ? cierre1 : cierre2
      recomendaciones.push(`El cierre del ${format(mayorVolumen.caja.fecha, 'dd/MM/yyyy')} manejó un volumen significativamente mayor`)
    }

    // Análisis de efectivo vs punto de venta
    const ratio1 = cierre1.resumen.totalEfectivoContado / (cierre1.resumen.totalEfectivoContado + cierre1.resumen.totalPuntoVenta)
    const ratio2 = cierre2.resumen.totalEfectivoContado / (cierre2.resumen.totalEfectivoContado + cierre2.resumen.totalPuntoVenta)
    
    if (Math.abs(ratio1 - ratio2) > 0.2) {
      if (ratio1 > ratio2) {
        recomendaciones.push(`El cierre del ${format(cierre1.caja.fecha, 'dd/MM/yyyy')} tuvo mayor proporción de efectivo`)
      } else {
        recomendaciones.push(`El cierre del ${format(cierre2.caja.fecha, 'dd/MM/yyyy')} tuvo mayor proporción de efectivo`)
      }
    }

    // Análisis de cajeros
    if (cierre1.caja.usuario?.id !== cierre2.caja.usuario?.id) {
      const mejorCajero = diferencias.mejorPrecision === 'cierre1' ? cierre1.caja.usuario : cierre2.caja.usuario
      recomendaciones.push(`${mejorCajero?.full_name || 'El cajero'} del cierre más preciso podría compartir mejores prácticas`)
    }

    // Análisis de Report Z
    if (cierre1.detallesEfectivo?.reporte_z && cierre2.detallesEfectivo?.reporte_z) {
      const discZ1 = Math.abs(cierre1.resumen.discrepanciaReporteZ)
      const discZ2 = Math.abs(cierre2.resumen.discrepanciaReporteZ)
      
      if (Math.abs(discZ1 - discZ2) > 10) {
        const mejorZ = discZ1 < discZ2 ? cierre1 : cierre2
        recomendaciones.push(`El cierre del ${format(mejorZ.caja.fecha, 'dd/MM/yyyy')} tiene mejor concordancia con Report Z`)
      }
    }

    // Análisis temporal
    const horasCierre1 = cierre1.caja.horaCierre ? 
      (cierre1.caja.horaCierre.getTime() - cierre1.caja.horaApertura.getTime()) / (1000 * 60 * 60) : 0
    const horasCierre2 = cierre2.caja.horaCierre ? 
      (cierre2.caja.horaCierre.getTime() - cierre2.caja.horaApertura.getTime()) / (1000 * 60 * 60) : 0

    if (Math.abs(horasCierre1 - horasCierre2) > 2) {
      const cierreMasLargo = horasCierre1 > horasCierre2 ? cierre1 : cierre2
      recomendaciones.push(`El cierre del ${format(cierreMasLargo.caja.fecha, 'dd/MM/yyyy')} tuvo una jornada más extensa`)
    }

    return recomendaciones
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getDiferenciaColor = (diferencia: number) => {
    if (Math.abs(diferencia) < 1) return 'text-green-600'
    if (diferencia > 0) return 'text-blue-600'
    return 'text-red-600'
  }

  const getDiferenciaIcon = (diferencia: number) => {
    if (Math.abs(diferencia) < 1) return <CheckCircleIcon className="h-4 w-4" />
    if (diferencia > 0) return <ArrowTrendingUpIcon className="h-4 w-4" />
    return <ArrowTrendingDownIcon className="h-4 w-4" />
  }

  if (!isOpen) return null

  if (cierres.length !== 2) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Comparación de Cierres</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Selecciona exactamente 2 cierres para realizar la comparación.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Actualmente tienes {cierres.length} cierre(s) seleccionado(s).
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !comparacionData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  const { cierre1, cierre2, comparacion } = comparacionData

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Comparación de Cierres
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Header de comparación */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Cierre 1 */}
            <div className={`bg-blue-50 rounded-lg p-4 ${comparacion.mejorPrecision === 'cierre1' ? 'ring-2 ring-green-500' : ''}`}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
                {format(cierre1.caja.fecha, 'dd/MM/yyyy')}
                {comparacion.mejorPrecision === 'cierre1' && (
                  <CheckCircleIcon className="h-5 w-5 ml-2 text-green-600" />
                )}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span className="font-medium">{cierre1.caja.usuario?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sistema:</span>
                  <span className="font-medium">Bs {formatMoney(cierre1.resumen.totalSistemico)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discrepancia:</span>
                  <span className={`font-medium ${getDiferenciaColor(cierre1.resumen.discrepanciaTotal)}`}>
                    Bs {formatMoney(Math.abs(cierre1.resumen.discrepanciaTotal))}
                  </span>
                </div>
              </div>
            </div>

            {/* Indicador de comparación */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <ArrowRightIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">vs</p>
              </div>
            </div>

            {/* Cierre 2 */}
            <div className={`bg-green-50 rounded-lg p-4 ${comparacion.mejorPrecision === 'cierre2' ? 'ring-2 ring-green-500' : ''}`}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                {format(cierre2.caja.fecha, 'dd/MM/yyyy')}
                {comparacion.mejorPrecision === 'cierre2' && (
                  <CheckCircleIcon className="h-5 w-5 ml-2 text-green-600" />
                )}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span className="font-medium">{cierre2.caja.usuario?.full_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Sistema:</span>
                  <span className="font-medium">Bs {formatMoney(cierre2.resumen.totalSistemico)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discrepancia:</span>
                  <span className={`font-medium ${getDiferenciaColor(cierre2.resumen.discrepanciaTotal)}`}>
                    Bs {formatMoney(Math.abs(cierre2.resumen.discrepanciaTotal))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Análisis de diferencias */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Análisis de Diferencias</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`flex items-center justify-center mb-2 ${getDiferenciaColor(comparacion.diferenciaSistemico)}`}>
                  {getDiferenciaIcon(comparacion.diferenciaSistemico)}
                  <span className="ml-1 font-medium">Total Sistema</span>
                </div>
                <p className={`text-lg font-bold ${getDiferenciaColor(comparacion.diferenciaSistemico)}`}>
                  {comparacion.diferenciaSistemico >= 0 ? '+' : ''}Bs {formatMoney(comparacion.diferenciaSistemico)}
                </p>
                <p className="text-xs text-gray-500">Diferencia absoluta</p>
              </div>

              <div className="text-center">
                <div className={`flex items-center justify-center mb-2 ${getDiferenciaColor(comparacion.diferenciaEfectivo)}`}>
                  {getDiferenciaIcon(comparacion.diferenciaEfectivo)}
                  <span className="ml-1 font-medium">Efectivo</span>
                </div>
                <p className={`text-lg font-bold ${getDiferenciaColor(comparacion.diferenciaEfectivo)}`}>
                  {comparacion.diferenciaEfectivo >= 0 ? '+' : ''}Bs {formatMoney(comparacion.diferenciaEfectivo)}
                </p>
                <p className="text-xs text-gray-500">En efectivo contado</p>
              </div>

              <div className="text-center">
                <div className={`flex items-center justify-center mb-2 ${getDiferenciaColor(comparacion.diferenciaPuntoVenta)}`}>
                  {getDiferenciaIcon(comparacion.diferenciaPuntoVenta)}
                  <span className="ml-1 font-medium">Punto Venta</span>
                </div>
                <p className={`text-lg font-bold ${getDiferenciaColor(comparacion.diferenciaPuntoVenta)}`}>
                  {comparacion.diferenciaPuntoVenta >= 0 ? '+' : ''}Bs {formatMoney(comparacion.diferenciaPuntoVenta)}
                </p>
                <p className="text-xs text-gray-500">En punto de venta</p>
              </div>

              <div className="text-center">
                <div className={`flex items-center justify-center mb-2 ${getDiferenciaColor(comparacion.diferenciaDiscrepancia)}`}>
                  {getDiferenciaIcon(comparacion.diferenciaDiscrepancia)}
                  <span className="ml-1 font-medium">Discrepancia</span>
                </div>
                <p className={`text-lg font-bold ${getDiferenciaColor(comparacion.diferenciaDiscrepancia)}`}>
                  {comparacion.diferenciaDiscrepancia >= 0 ? '+' : ''}Bs {formatMoney(comparacion.diferenciaDiscrepancia)}
                </p>
                <p className="text-xs text-gray-500">En precisión</p>
              </div>
            </div>
          </div>

          {/* Comparación detallada */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Desglose transaccional */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Desglose Transaccional</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                  <span>Tipo</span>
                  <span className="text-center">{format(cierre1.caja.fecha, 'dd/MM')}</span>
                  <span className="text-center">{format(cierre2.caja.fecha, 'dd/MM')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Pagos Móvil</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.totalPagosMovil)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.totalPagosMovil)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Zelle</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.totalZelleBs)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.totalZelleBs)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Notas Crédito</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.totalNotasCredito)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.totalNotasCredito)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Créditos</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.totalCreditosBs)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.totalCreditosBs)}</span>
                </div>
              </div>
            </div>

            {/* Información temporal */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Información Temporal</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                  <span>Detalle</span>
                  <span className="text-center">{format(cierre1.caja.fecha, 'dd/MM')}</span>
                  <span className="text-center">{format(cierre2.caja.fecha, 'dd/MM')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Apertura</span>
                  <span className="text-center">{format(cierre1.caja.horaApertura, 'HH:mm')}</span>
                  <span className="text-center">{format(cierre2.caja.horaApertura, 'HH:mm')}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Cierre</span>
                  <span className="text-center">
                    {cierre1.caja.horaCierre ? format(cierre1.caja.horaCierre, 'HH:mm') : 'N/A'}
                  </span>
                  <span className="text-center">
                    {cierre2.caja.horaCierre ? format(cierre2.caja.horaCierre, 'HH:mm') : 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Tasa del Día</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.tasaDia)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.tasaDia)}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span>Monto Apertura</span>
                  <span className="text-center">Bs {formatMoney(cierre1.caja.montoApertura)}</span>
                  <span className="text-center">Bs {formatMoney(cierre2.caja.montoApertura)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recomendaciones y conclusiones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-blue-600" />
              Recomendaciones y Análisis
            </h3>
            <div className="space-y-3">
              {comparacion.recomendaciones.map((recomendacion, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-blue-800">{recomendacion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Comparación
          </Button>
        </div>
      </div>
    </div>
  )
}