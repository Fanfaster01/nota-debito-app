// src/components/cajas/PagoZelleForm.tsx
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PagoZelleUI } from '@/types/caja'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import { useAsyncForm } from '@/hooks/useAsyncState'

const pagoZelleSchema = z.object({
  montoUsd: z.number().positive('El monto debe ser mayor a 0'),
  nombreCliente: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
})

type PagoZelleFormData = z.infer<typeof pagoZelleSchema>

interface PagoZelleFormProps {
  tasaDia: number
  onSubmit: (data: PagoZelleFormData & { tasa: number }) => Promise<void>
  loading?: boolean
  editingPago?: PagoZelleUI | null
  onCancelEdit?: () => void
}

export const PagoZelleForm: React.FC<PagoZelleFormProps> = ({
  tasaDia,
  onSubmit,
  loading,
  editingPago,
  onCancelEdit
}) => {
  // Estado unificado con useAsyncForm
  const submitState = useAsyncForm<void>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<PagoZelleFormData>({
    resolver: zodResolver(pagoZelleSchema),
    defaultValues: {
      montoUsd: editingPago?.montoUsd || 0,
      nombreCliente: editingPago?.nombreCliente || '',
      telefono: editingPago?.telefono || ''
    }
  })

  const montoUsd = watch('montoUsd')
  
  // Calcular monto en bolívares cuando cambia el monto en USD
  const montoBs = (montoUsd || 0) * tasaDia

  useEffect(() => {
    if (editingPago) {
      setValue('montoUsd', editingPago.montoUsd)
      setValue('nombreCliente', editingPago.nombreCliente)
      setValue('telefono', editingPago.telefono)
    }
  }, [editingPago, setValue])

  const onFormSubmit = async (data: PagoZelleFormData) => {
    const result = await submitState.executeWithValidation(
      async () => {
        await onSubmit({
          ...data,
          tasa: tasaDia
        })
        if (!editingPago) {
          reset()
        }
        return void 0
      },
      'Error al procesar el pago Zelle'
    )
    
    // Si la operación fue exitosa, el resultado será truthy
    if (result !== null) {
      // La operación fue exitosa, el formulario ya se reseteó si no era edición
    }
  }

  const handleCancel = () => {
    reset()
    onCancelEdit?.()
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  return (
    <Card title={editingPago ? 'Editar Pago Zelle' : 'Registrar Pago Zelle'}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {submitState.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {submitState.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto (USD)"
            type="number"
            step="0.01"
            {...register('montoUsd', { valueAsNumber: true })}
            error={errors.montoUsd?.message}
            disabled={loading || submitState.loading}
            autoFocus
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equivalente en Bs.
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-lg font-semibold text-gray-900">
                Bs. {formatMonto(montoBs)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tasa: Bs. {formatMonto(tasaDia)} / USD
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del Cliente"
            {...register('nombreCliente')}
            error={errors.nombreCliente?.message}
            disabled={loading || submitState.loading}
            placeholder="Nombre completo"
          />
          
          <Input
            label="Teléfono"
            {...register('telefono')}
            error={errors.telefono?.message}
            disabled={loading || submitState.loading}
            placeholder="04XX-XXXXXXX"
          />
        </div>

        <div className="flex justify-end space-x-3">
          {editingPago && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || submitState.loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || submitState.loading}
            className="flex items-center"
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            {submitState.loading ? 'Guardando...' : editingPago ? 'Actualizar' : 'Agregar'} Pago
          </Button>
        </div>
      </form>
    </Card>
  )
}