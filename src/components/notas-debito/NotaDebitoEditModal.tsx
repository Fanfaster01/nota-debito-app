// src/components/notas-debito/NotaDebitoEditModal.tsx
import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { NotaDebito } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { XMarkIcon } from '@heroicons/react/24/outline'

const editSchema = z.object({
  fecha: z.date(),
  tasaCambioPago: z.number().positive('La tasa de cambio debe ser mayor a 0'),
})

type EditFormData = z.infer<typeof editSchema>

interface NotaDebitoEditModalProps {
  isOpen: boolean
  notaDebito: NotaDebito | null
  onClose: () => void
  onSave: (notaDebito: NotaDebito, updates: EditFormData) => Promise<void>
  loading?: boolean
}

export const NotaDebitoEditModal: React.FC<NotaDebitoEditModalProps> = ({
  isOpen,
  notaDebito,
  onClose,
  onSave,
  loading
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setValue
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (notaDebito) {
      setValue('fecha', new Date(notaDebito.fecha))
      setValue('tasaCambioPago', notaDebito.tasaCambioPago)
    }
  }, [notaDebito, setValue])

  const onSubmit = async (data: EditFormData) => {
    if (notaDebito) {
      await onSave(notaDebito, data)
    }
  }

  if (!isOpen || !notaDebito) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Editar Nota de Débito ND-{notaDebito.numero}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información de referencia (solo lectura) */}
          <Card title="Información de referencia">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Factura:</span> {notaDebito.factura.numero}
              </div>
              <div>
                <span className="font-medium">Proveedor:</span> {notaDebito.factura.proveedor.nombre}
              </div>
              <div>
                <span className="font-medium">Monto USD:</span> ${notaDebito.montoUSDNeto.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Tasa Original:</span> Bs. {notaDebito.tasaCambioOriginal.toFixed(2)}
              </div>
            </div>
          </Card>

          {/* Campos editables */}
          <Card title="Datos a modificar">
            <div className="space-y-4">
              <Controller
                name="fecha"
                control={control}
                render={({ field }) => (
                  <Input
                    label="Fecha de la nota de débito"
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null
                      field.onChange(date)
                    }}
                    error={errors.fecha?.message}
                    disabled={loading}
                  />
                )}
              />

              <Input
                label="Tasa de Cambio al Momento del Pago (Bs/USD)"
                type="number"
                step="0.01"
                {...register('tasaCambioPago', { valueAsNumber: true })}
                error={errors.tasaCambioPago?.message}
                disabled={loading}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Al cambiar la tasa de cambio, se recalcularán automáticamente todos los montos del diferencial cambiario.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}