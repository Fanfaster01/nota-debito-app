'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  XMarkIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import type { FacturaCuentaPorPagar, EstadoPago } from '@/types/cuentasPorPagar'

interface ModalDetalleFacturaProps {
  factura: FacturaCuentaPorPagar
  onClose: () => void
  onFacturaUpdated: () => void
}

export function ModalDetalleFactura({
  factura,
  onClose,
  onFacturaUpdated
}: ModalDetalleFacturaProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editandoEstado, setEditandoEstado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPago>(factura.estadoPago)
  const [notasPago, setNotasPago] = useState(factura.notasPago || '')

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEstadoColor = (estado: EstadoPago) => {
    switch (estado) {
      case 'vencida':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pagada':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pendiente_aprobacion':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEstadoIcon = (estado: EstadoPago) => {
    switch (estado) {
      case 'vencida':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'pendiente':
        return <ClockIcon className="h-5 w-5" />
      case 'pagada':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'pendiente_aprobacion':
        return <CurrencyDollarIcon className="h-5 w-5" />
      default:
        return null
    }
  }

  const getDiasVencimiento = () => {
    if (!factura.fechaVencimiento) return null
    
    const hoy = new Date()
    const vencimiento = new Date(factura.fechaVencimiento)
    const diferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diferencia < 0) {
      return {
        texto: `Vencida hace ${Math.abs(diferencia)} días`,
        color: 'text-red-600 font-semibold'
      }
    } else if (diferencia === 0) {
      return {
        texto: 'Vence hoy',
        color: 'text-red-600 font-semibold'
      }
    } else if (diferencia <= 7) {
      return {
        texto: `Vence en ${diferencia} días`,
        color: 'text-yellow-600 font-semibold'
      }
    } else {
      return {
        texto: `Vence en ${diferencia} días`,
        color: 'text-gray-600'
      }
    }
  }

  const handleActualizarEstado = async () => {
    if (nuevoEstado === factura.estadoPago && notasPago === (factura.notasPago || '')) {
      setEditandoEstado(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await cuentasPorPagarService.updateEstadoPago(
        factura.id,
        nuevoEstado,
        notasPago
      )

      if (result.error) {
        setError(result.error)
      } else {
        setEditandoEstado(false)
        onFacturaUpdated()
        // Actualizar el estado local
        factura.estadoPago = nuevoEstado
        factura.notasPago = notasPago
      }
    } catch (err) {
      setError('Error al actualizar el estado')
      console.error('Error actualizando estado:', err)
    } finally {
      setLoading(false)
    }
  }

  const diasVencimiento = getDiasVencimiento()

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Factura {factura.numero}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
      <div className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Datos de la factura */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <DocumentTextIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Información de la Factura
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Número:</span>
                  <span className="text-sm text-gray-900">{factura.numero}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Control:</span>
                  <span className="text-sm text-gray-900">{factura.numeroControl}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Fecha:</span>
                  <span className="text-sm text-gray-900">{formatDate(factura.fecha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Vencimiento:</span>
                  <span className="text-sm text-gray-900">{formatDate(factura.fechaVencimiento)}</span>
                </div>
                {diasVencimiento && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Estado vencimiento:</span>
                    <span className={`text-sm ${diasVencimiento.color}`}>
                      {diasVencimiento.texto}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Tipo de pago:</span>
                  <span className="text-sm text-gray-900 capitalize">{factura.tipoPago}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Datos del proveedor */}
          <Card>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Proveedor
                </h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Nombre:</span>
                  <p className="text-sm text-gray-900 mt-1">{factura.proveedorNombre}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">RIF:</span>
                  <p className="text-sm text-gray-900 mt-1">{factura.proveedorRif}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Dirección:</span>
                  <p className="text-sm text-gray-900 mt-1">{factura.proveedorDireccion}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Montos y cálculos */}
        <Card>
          <div className="p-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Montos y Cálculos
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Montos básicos */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Montos Básicos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Subtotal:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Exento:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.montoExento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Base imponible:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.baseImponible)}</span>
                  </div>
                </div>
              </div>

              {/* Impuestos */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Impuestos</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">IVA ({factura.alicuotaIVA}%):</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.iva)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Retención ({factura.porcentajeRetencion}%):</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.retencionIVA)}</span>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-900">Totales</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total original:</span>
                    <span className="text-sm text-gray-900">{formatCurrency(factura.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Monto USD:</span>
                    <span className="text-sm text-gray-900">$ {factura.montoUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tasa cambio:</span>
                    <span className="text-sm text-gray-900">Bs. {factura.tasaCambio.toFixed(2)}</span>
                  </div>
                  {factura.montoFinalPagar && factura.montoFinalPagar !== factura.total && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-gray-900">Monto final a pagar:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(factura.montoFinalPagar)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Estado de pago y notas */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CalendarIcon className="h-6 w-6 text-orange-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Estado de Pago
                </h3>
              </div>
              
              {!editandoEstado && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditandoEstado(true)}
                  className="inline-flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            {editandoEstado ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de pago
                  </label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value as EstadoPago)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="pendiente_aprobacion">Pendiente de Aprobación</option>
                    <option value="pagada">Pagada</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas de pago
                  </label>
                  <textarea
                    value={notasPago}
                    onChange={(e) => setNotasPago(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agregar notas sobre el pago..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditandoEstado(false)
                      setNuevoEstado(factura.estadoPago)
                      setNotasPago(factura.notasPago || '')
                      setError(null)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleActualizarEstado}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(factura.estadoPago)}`}>
                    {getEstadoIcon(factura.estadoPago)}
                    <span className="ml-2 capitalize">{factura.estadoPago.replace('_', ' ')}</span>
                  </span>
                  
                  {factura.fechaPago && (
                    <span className="text-sm text-gray-500">
                      Pagada el {formatDate(factura.fechaPago)}
                    </span>
                  )}
                </div>

                {factura.notasPago && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Notas:</span>
                    <p className="text-sm text-gray-600 mt-1">{factura.notasPago}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          
          {(factura.estadoPago === 'pendiente' || factura.estadoPago === 'vencida') && (
            <Button className="inline-flex items-center">
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Generar Recibo
            </Button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}