// src/components/creditos/CreditoEditModal.tsx
import React, { useState } from 'react'
import { CreditoDetalladoUI } from '@/types/creditos'
import { creditoService } from '@/lib/services/creditoService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAsyncForm } from '@/hooks/useAsyncState'

interface CreditoEditModalProps {
  credito: CreditoDetalladoUI
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreditoEditModal({ 
  credito, 
  isOpen, 
  onClose, 
  onSuccess 
}: CreditoEditModalProps) {
  // Estado unificado con useAsyncForm
  const updateState = useAsyncForm<void>()
  
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(
    credito.fechaVencimiento 
      ? credito.fechaVencimiento.toISOString().split('T')[0] 
      : ''
  )
  const [observaciones, setObservaciones] = useState(credito.observaciones || '')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await updateState.executeWithValidation(
      async () => {
        const updates = {
          fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
          observaciones: observaciones.trim() || undefined
        }

        const { error: updateError } = await creditoService.actualizarCredito(credito.id, updates)

        if (updateError) {
          throw updateError
        }

        return void 0
      },
      'Error al actualizar el crédito'
    )

    if (result !== null) {
      onSuccess()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Editar Crédito - Factura #{credito.numeroFactura}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {updateState.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {updateState.error}
            </div>
          )}

          {/* Información del crédito (solo lectura) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Crédito</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium text-gray-900">{credito.nombreCliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto</p>
                <p className="font-medium text-gray-900">
                  Bs {new Intl.NumberFormat('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(credito.montoBs)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className="font-medium text-gray-900">
                  {credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Pendiente</p>
                <p className="font-medium text-gray-900">
                  Bs {new Intl.NumberFormat('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(credito.saldoPendiente)}
                </p>
              </div>
            </div>
          </div>

          {/* Campos editables */}
          <div className="space-y-4">
            <Input
              label="Fecha de Vencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              disabled={updateState.loading}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Observaciones adicionales sobre el crédito..."
                disabled={updateState.loading}
              />
            </div>
          </div>

          {/* Warning si está pagado */}
          {credito.estado === 'pagado' && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <strong>Crédito Pagado:</strong> Este crédito ya ha sido completamente pagado. 
                    Solo puedes editar la fecha de vencimiento y las observaciones.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Warning si tiene abonos */}
          {credito.montoAbonado > 0 && credito.estado === 'pendiente' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Este crédito tiene abonos registrados por un total de Bs {
                      new Intl.NumberFormat('es-VE', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      }).format(credito.montoAbonado)
                    }. Solo puedes editar la fecha de vencimiento y las observaciones.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={updateState.loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateState.loading}
            >
              {updateState.loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}