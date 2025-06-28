// src/components/cajas/PagoMovilForm.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PagoMovilUI } from '@/types/caja'
import { CreditCardIcon } from '@heroicons/react/24/outline'
import { useAsyncForm } from '@/hooks/useAsyncState'

const pagoMovilSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0'),
  nombreCliente: z.string().min(1, 'El nombre es requerido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  numeroReferencia: z.string().regex(/^\d+$/, 'Solo se permiten números')
})

type PagoMovilFormData = z.infer<typeof pagoMovilSchema>

interface PagoMovilFormProps {
  onSubmit: (data: PagoMovilFormData) => Promise<void>
  loading?: boolean
  editingPago?: PagoMovilUI | null
  onCancelEdit?: () => void
}

export const PagoMovilForm: React.FC<PagoMovilFormProps> = ({
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
    setValue
  } = useForm<PagoMovilFormData>({
    resolver: zodResolver(pagoMovilSchema),
    defaultValues: {
      monto: editingPago?.monto || 0,
      nombreCliente: editingPago?.nombreCliente || '',
      telefono: editingPago?.telefono || '',
      numeroReferencia: editingPago?.numeroReferencia || ''
    }
  })

  React.useEffect(() => {
    if (editingPago) {
      setValue('monto', editingPago.monto)
      setValue('nombreCliente', editingPago.nombreCliente)
      setValue('telefono', editingPago.telefono)
      setValue('numeroReferencia', editingPago.numeroReferencia)
    }
  }, [editingPago, setValue])

  const onFormSubmit = async (data: PagoMovilFormData) => {
    const result = await submitState.executeWithValidation(
      async () => {
        await onSubmit(data)
        if (!editingPago) {
          reset()
        }
        return void 0
      },
      'Error al procesar el pago móvil'
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

  return (
    <Card title={editingPago ? 'Editar Pago Móvil' : 'Registrar Pago Móvil'}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        {submitState.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {submitState.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto (Bs)"
            type="number"
            step="0.01"
            {...register('monto', { valueAsNumber: true })}
            error={errors.monto?.message}
            disabled={loading || submitState.loading}
            autoFocus
          />
          
          <Input
            label="Número de Referencia"
            {...register('numeroReferencia')}
            error={errors.numeroReferencia?.message}
            disabled={loading || submitState.loading}
            placeholder="Ej: 00001234567890"
          />
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
            <CreditCardIcon className="h-4 w-4 mr-2" />
            {submitState.loading ? 'Guardando...' : editingPago ? 'Actualizar' : 'Agregar'} Pago
          </Button>
        </div>
      </form>
    </Card>
  )
}