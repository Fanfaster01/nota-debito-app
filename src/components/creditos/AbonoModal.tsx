// src/components/creditos/AbonoModal.tsx
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditoDetalladoUI } from '@/types/creditos'
import { creditoService } from '@/lib/services/creditoService'
import { bancoService } from '@/lib/services/bancoService'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { XMarkIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { generateReciboPagoPDF } from '@/utils/pdfGenerator'
import { useAsyncState, useAsyncForm } from '@/hooks/useAsyncState'

const abonoSchema = z.object({
  montoBs: z.number()
    .positive('El monto debe ser mayor a 0'),
  tasa: z.number()
    .positive('La tasa debe ser mayor a 0'),
  metodoPago: z.enum(['efectivo', 'transferencia', 'pago_movil', 'zelle', 'punto_venta', 'deposito']),
  referencia: z.string().optional(),
  bancoId: z.string().optional(),
  observaciones: z.string().optional()
})

type AbonoFormData = z.infer<typeof abonoSchema>

interface AbonoModalProps {
  credito: CreditoDetalladoUI
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AbonoModal({ 
  credito, 
  isOpen, 
  onClose, 
  onSuccess 
}: AbonoModalProps) {
  const { user } = useAuth()
  
  // Estados unificados con useAsyncState
  const banksState = useAsyncState<any[]>([])
  const submitState = useAsyncForm<any>()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<AbonoFormData>({
    resolver: zodResolver(abonoSchema),
    defaultValues: {
      tasa: credito.tasa,
      metodoPago: 'efectivo'
    }
  })

  const montoBs = watch('montoBs')
  const tasa = watch('tasa')
  const metodoPago = watch('metodoPago')

  const montoUsd = montoBs && tasa ? (montoBs / tasa).toFixed(2) : '0.00'
  const saldoDespuesAbono = credito.saldoPendiente - (montoBs || 0)

  useEffect(() => {
    if (isOpen) {
      loadBanks()
      reset({
        tasa: credito.tasa,
        metodoPago: 'efectivo'
      })
    }
  }, [isOpen, credito.tasa, reset])

  const loadBanks = async () => {
    await banksState.execute(
      async () => {
        const { data, error } = await bancoService.getBancos()
        if (error) {
          throw error
        }
        return data || []
      },
      'Error al cargar los bancos'
    )
  }

  const onSubmit = async (data: AbonoFormData) => {
    if (!user) return

    if (data.montoBs > credito.saldoPendiente) {
      // Usar el estado del formulario para mostrar el error
      submitState.clearError()
      submitState.setData(null)
      return
    }

    const result = await submitState.executeWithValidation(
      async () => {
        const nuevoAbono = {
          creditoId: credito.id,
          montoBs: data.montoBs,
          montoUsd: parseFloat((data.montoBs / data.tasa).toFixed(2)),
          tasa: data.tasa,
          metodoPago: data.metodoPago,
          referencia: data.referencia || null,
          bancoId: (data.metodoPago === 'transferencia' || data.metodoPago === 'punto_venta' || data.metodoPago === 'deposito') 
            ? data.bancoId || null 
            : null,
          observaciones: data.observaciones || null,
          userId: user.id,
          companyId: user.company_id!,
          fechaPago: new Date()
        }

        const { data: abonoCreado, error: createError } = await creditoService.registrarAbono(nuevoAbono)

        if (createError) {
          throw createError
        }

        // Generar recibo automáticamente
        if (abonoCreado) {
          try {
            generateReciboPagoPDF(credito, {
              ...abonoCreado,
              fechaPago: new Date()
            })
          } catch (error) {
            console.error('Error al generar recibo:', error)
          }
        }

        return abonoCreado
      },
      'Error al registrar el abono'
    )

    if (result) {
      onSuccess()
    }
  }

  if (!isOpen) return null

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const requiereBanco = ['transferencia', 'punto_venta', 'deposito'].includes(metodoPago)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Registrar Abono - Factura #{credito.numeroFactura}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {(submitState.error || banksState.error) && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {submitState.error || banksState.error}
            </div>
          )}
          
          {montoBs && montoBs > credito.saldoPendiente && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              El monto del abono no puede ser mayor al saldo pendiente
            </div>
          )}

          {/* Información del crédito */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Información del Crédito</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-medium text-gray-900">{credito.nombreCliente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="font-medium text-gray-900">Bs {formatMoney(credito.montoBs)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Pendiente</p>
                <p className="font-medium text-red-600">Bs {formatMoney(credito.saldoPendiente)}</p>
              </div>
            </div>
          </div>

          {/* Datos del abono */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Monto del Abono (Bs)"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('montoBs', { valueAsNumber: true })}
              error={errors.montoBs?.message}
              disabled={submitState.loading}
            />

            <Input
              label="Tasa de Cambio"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('tasa', { valueAsNumber: true })}
              error={errors.tasa?.message}
              disabled={submitState.loading}
            />
          </div>

          {/* Monto calculado */}
          {montoBs && montoBs > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-green-700">Monto en USD (calculado)</p>
                  <p className="text-lg font-semibold text-green-800">$ {montoUsd}</p>
                </div>
                <div>
                  <p className="text-sm text-green-700">Saldo después del abono</p>
                  <p className="text-lg font-semibold text-green-800">
                    Bs {formatMoney(Math.max(0, saldoDespuesAbono))}
                  </p>
                  {saldoDespuesAbono <= 0 && (
                    <p className="text-xs text-green-600">✓ Crédito completamente pagado</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Método de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <select
              {...register('metodoPago')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={submitState.loading}
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="pago_movil">Pago Móvil</option>
              <option value="zelle">Zelle</option>
              <option value="punto_venta">Punto de Venta</option>
              <option value="deposito">Depósito</option>
            </select>
          </div>

          {/* Banco (si es requerido) */}
          {requiereBanco && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Banco
              </label>
              <select
                {...register('bancoId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={submitState.loading || banksState.loading}
              >
                <option value="">Seleccionar banco</option>
                {(banksState.data || []).map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.nombre} - {bank.codigo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Referencia */}
          <Input
            label="Referencia (Opcional)"
            type="text"
            placeholder="Número de referencia, confirmación, etc."
            {...register('referencia')}
            disabled={submitState.loading}
          />

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales sobre el abono..."
              disabled={submitState.loading}
            />
          </div>

          {/* Validación del monto */}
          {montoBs && montoBs > credito.saldoPendiente && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> El monto del abono (Bs {formatMoney(montoBs)}) 
                no puede ser mayor al saldo pendiente (Bs {formatMoney(credito.saldoPendiente)}).
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitState.loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitState.loading || !montoBs || montoBs > credito.saldoPendiente}
            >
              {submitState.loading ? 'Registrando...' : 'Registrar Abono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}