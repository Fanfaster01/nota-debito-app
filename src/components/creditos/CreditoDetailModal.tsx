// src/components/creditos/CreditoDetailModal.tsx
import React from 'react'
import { CreditoDetalladoUI } from '@/types/creditos'
import { Button } from '@/components/ui/Button'
import { 
  XMarkIcon,
  PencilIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreditoDetailModalProps {
  credito: CreditoDetalladoUI
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
  onAbono: () => void
}

export default function CreditoDetailModal({ 
  credito, 
  isOpen, 
  onClose, 
  onEdit, 
  onAbono 
}: CreditoDetailModalProps) {
  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Crédito - Factura #{credito.numeroFactura}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(credito.estado)}`}>
              {credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVencimientoBadge(credito.estadoVencimiento)}`}>
              {credito.estadoVencimiento}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <UserIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Información del Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{credito.nombreCliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium text-gray-900">{credito.telefonoCliente}</p>
              </div>
              {credito.cliente && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">Documento</p>
                    <p className="font-medium text-gray-900">
                      {credito.cliente.tipoDocumento}-{credito.cliente.numeroDocumento}
                    </p>
                  </div>
                  {credito.cliente.direccion && (
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium text-gray-900">{credito.cliente.direccion}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Información del Crédito */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CreditCardIcon className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Detalles del Crédito</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="text-xl font-bold text-gray-900">Bs {formatMoney(credito.montoBs)}</p>
                <p className="text-sm text-gray-600">$ {formatMoney(credito.montoUsd)} (Tasa: {credito.tasa})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto Abonado</p>
                <p className="text-xl font-bold text-green-600">Bs {formatMoney(credito.montoAbonado)}</p>
                <p className="text-sm text-gray-600">{credito.cantidadAbonos} abono(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Pendiente</p>
                <p className="text-xl font-bold text-red-600">Bs {formatMoney(credito.saldoPendiente)}</p>
                {credito.saldoPendiente > 0 && (
                  <p className="text-sm text-gray-600">
                    {Math.round((credito.montoAbonado / credito.montoBs) * 100)}% pagado
                  </p>
                )}
              </div>
            </div>

            {/* Progreso de pago */}
            {credito.estado === 'pendiente' && credito.montoAbonado > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progreso de pago</span>
                  <span>{Math.round((credito.montoAbonado / credito.montoBs) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(credito.montoAbonado / credito.montoBs) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CalendarIcon className="h-5 w-5 text-gray-600 mr-2" />
                <h4 className="font-medium text-gray-900">Fecha de Crédito</h4>
              </div>
              <p className="text-lg text-gray-900">
                {format(credito.fechaHora, "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-gray-600">
                {format(credito.fechaHora, 'hh:mm a')}
              </p>
            </div>

            {credito.fechaVencimiento && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Fecha de Vencimiento</h4>
                </div>
                <p className="text-lg text-gray-900">
                  {format(credito.fechaVencimiento, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
                <p className="text-sm text-gray-600">{credito.estadoVencimiento}</p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {credito.observaciones && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <DocumentTextIcon className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="font-medium text-gray-900">Observaciones</h4>
              </div>
              <p className="text-gray-700">{credito.observaciones}</p>
            </div>
          )}

          {/* Historial de Abonos */}
          {credito.abonos && credito.abonos.length > 0 && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Historial de Abonos</h4>
              <div className="space-y-3">
                {credito.abonos.map((abono, index) => (
                  <div key={abono.id || index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-green-800">
                            Bs {formatMoney(abono.montoBs)}
                          </span>
                          <span className="text-sm text-green-600">
                            {abono.metodoPago.replace('_', ' ').toUpperCase()}
                          </span>
                          {abono.referencia && (
                            <span className="text-sm text-gray-600">
                              Ref: {abono.referencia}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {format(abono.fechaPago, "dd/MM/yyyy 'a las' hh:mm a", { locale: es })}
                        </p>
                        {abono.observaciones && (
                          <p className="text-sm text-gray-600 mt-1">{abono.observaciones}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="secondary"
            onClick={onEdit}
            className="flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Button>
          {credito.estado === 'pendiente' && (
            <Button
              onClick={onAbono}
              className="flex items-center"
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Registrar Abono
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}