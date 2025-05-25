// src/components/forms/ProveedorModal.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, 'Formato de RIF inválido (J-XXXXXXXX-X)'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  contacto: z.string().optional(),
})

type ProveedorFormData = z.infer<typeof proveedorSchema>

interface ProveedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProveedorFormData) => Promise<void>
  initialRif?: string
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRif
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: '',
      rif: initialRif || '',
      direccion: '',
      telefono: '',
      email: '',
      contacto: '',
    }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data: ProveedorFormData) => {
    await onSave(data)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Agregar Nuevo Proveedor
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Proveedor"
              {...register('nombre')}
              error={errors.nombre?.message}
              placeholder="Empresa ABC C.A."
            />
            <Input
              label="RIF"
              {...register('rif')}
              error={errors.rif?.message}
              placeholder="J-12345678-9"
              className="uppercase"
            />
          </div>

          <Input
            label="Dirección"
            {...register('direccion')}
            error={errors.direccion?.message}
            placeholder="Av. Principal, Edificio XYZ, Piso 3"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              {...register('telefono')}
              error={errors.telefono?.message}
              placeholder="0212-1234567"
            />
            <Input
              label="Email"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="contacto@empresa.com"
            />
          </div>

          <Input
            label="Persona de Contacto"
            {...register('contacto')}
            error={errors.contacto?.message}
            placeholder="Juan Pérez"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}