'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cajaService } from '@/lib/services/cajaService'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { NotaCreditoCajaUI } from '@/types/caja'
import { useAsyncForm } from '@/hooks/useAsyncState'

const notaCreditoCajaSchema = z.object({
  numeroNotaCredito: z.string()
    .min(1, 'El número de nota de crédito es requerido')
    .regex(/^\d+$/, 'Solo se permiten números'),
  facturaAfectada: z.string()
    .min(1, 'La factura afectada es requerida')
    .regex(/^\d+$/, 'Solo se permiten números'),
  montoBs: z.number()
    .positive('El monto debe ser mayor a 0'),
  nombreCliente: z.string()
    .min(1, 'El nombre del cliente es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  explicacion: z.string()
    .min(1, 'La explicación es requerida')
    .min(10, 'La explicación debe tener al menos 10 caracteres')
})

type NotaCreditoCajaFormData = z.infer<typeof notaCreditoCajaSchema>

interface NotaCreditoCajaFormProps {
  cajaId: string
  onSuccess: (notaCredito: NotaCreditoCajaUI) => void
  onCancel: () => void
}

export default function NotaCreditoCajaForm({ cajaId, onSuccess, onCancel }: NotaCreditoCajaFormProps) {
  const { user } = useAuth()
  
  // Estado unificado con useAsyncForm
  const submitState = useAsyncForm<NotaCreditoCajaUI>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<NotaCreditoCajaFormData>({
    resolver: zodResolver(notaCreditoCajaSchema),
    defaultValues: {
      numeroNotaCredito: '',
      facturaAfectada: '',
      montoBs: 0,
      nombreCliente: '',
      explicacion: ''
    }
  })

  const onSubmit = async (data: NotaCreditoCajaFormData) => {
    if (!user || !user.id || !user.company_id) {
      submitState.setData(null)
      console.error('Usuario incompleto:', user)
      return
    }

    const result = await submitState.executeWithValidation(
      async () => {
        const nuevaNotaCredito: Omit<NotaCreditoCajaUI, 'id' | 'fechaHora'> = {
          cajaId,
          numeroNotaCredito: data.numeroNotaCredito,
          facturaAfectada: data.facturaAfectada,
          montoBs: data.montoBs,
          nombreCliente: data.nombreCliente,
          explicacion: data.explicacion,
          userId: user.id,
          companyId: user.company_id!
        }

        const { data: notaCreada, error: createError } = await cajaService.agregarNotaCreditoCaja(nuevaNotaCredito)

        if (createError) {
          throw createError
        }

        if (!notaCreada) {
          throw new Error('No se pudo crear la nota de crédito')
        }

        return notaCreada
      },
      'Error al crear la nota de crédito'
    )

    if (result) {
      reset()
      onSuccess(result)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {submitState.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {submitState.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nota de Crédito Nro"
          type="text"
          placeholder="00000"
          {...register('numeroNotaCredito')}
          error={errors.numeroNotaCredito?.message}
        />

        <Input
          label="Factura Afectada"
          type="text"
          placeholder="00000"
          {...register('facturaAfectada')}
          error={errors.facturaAfectada?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Monto en Bs"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('montoBs', { valueAsNumber: true })}
          error={errors.montoBs?.message}
        />

        <Input
          label="Nombre del Cliente"
          type="text"
          placeholder="Nombre completo"
          {...register('nombreCliente')}
          error={errors.nombreCliente?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Explicación
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Explique brevemente el motivo de la nota de crédito..."
          {...register('explicacion')}
        />
        {errors.explicacion && (
          <p className="mt-1 text-sm text-red-600">{errors.explicacion.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitState.loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitState.loading}
        >
          {submitState.loading ? 'Agregando...' : 'Agregar Nota de Crédito'}
        </Button>
      </div>
    </form>
  )
}