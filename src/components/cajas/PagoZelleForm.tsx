// src/components/cajas/PagoZelleForm.tsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PagoZelleUI } from '@/types/caja'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [montoBs, setMontoBs] = useState(0)

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
  useEffect(() => {
    const calculatedBs = (montoUsd || 0) * tasaDia
    setMontoBs(calculatedBs)
  }, [montoUsd, tasaDia])

  useEffect(() => {
    if (editingPago) {
      setValue('montoUsd', editingPago.montoUsd)
      setValue('nombreCliente', editingPago.nombreCliente)
      setValue('telefono', editingPago.telefono)
    }
  }, [editingPago, setValue])

  const onFormSubmit = async (data: PagoZelleFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...data,
        tasa: tasaDia
      })
      if (!editingPago) {
        reset()
        setMontoBs(0)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    setMontoBs(0)
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto (USD)"
            type="number"
            step="0.01"
            {...register('montoUsd', { valueAsNumber: true })}
            error={errors.montoUsd?.message}
            disabled={loading || isSubmitting}
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
            disabled={loading || isSubmitting}
            placeholder="Nombre completo"
          />
          
          <Input
            label="Teléfono"
            {...register('telefono')}
            error={errors.telefono?.message}
            disabled={loading || isSubmitting}
            placeholder="04XX-XXXXXXX"
          />
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Información del pago:</p>
              <p>• Monto en USD: $ {formatMonto(montoUsd || 0)}</p>
              <p>• Tasa del día: Bs. {formatMonto(tasaDia)} / USD</p>
              <p>• Total en Bs: {formatMonto(montoBs)}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          {editingPago && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading || isSubmitting}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || isSubmitting}
            className="flex items-center"
          >
            <CurrencyDollarIcon className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : editingPago ? 'Actualizar' : 'Agregar'} Pago
          </Button>
        </div>
      </form>
    </Card>
  )
}