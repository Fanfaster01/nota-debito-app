// src/components/cajas/PagoMovilForm.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PagoMovilUI } from '@/types/caja'
import { CreditCardIcon } from '@heroicons/react/24/outline'

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
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      if (!editingPago) {
        reset()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    reset()
    onCancelEdit?.()
  }

  return (
    <Card title={editingPago ? 'Editar Pago Móvil' : 'Registrar Pago Móvil'}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Monto (Bs)"
            type="number"
            step="0.01"
            {...register('monto', { valueAsNumber: true })}
            error={errors.monto?.message}
            disabled={loading || isSubmitting}
            autoFocus
          />
          
          <Input
            label="Número de Referencia"
            {...register('numeroReferencia')}
            error={errors.numeroReferencia?.message}
            disabled={loading || isSubmitting}
            placeholder="Ej: 00001234567890"
          />
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
            <CreditCardIcon className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Guardando...' : editingPago ? 'Actualizar' : 'Agregar'} Pago
          </Button>
        </div>
      </form>
    </Card>
  )
}