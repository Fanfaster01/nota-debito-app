// src/components/forms/ProveedorModalNew.tsx
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { TipoCambio, ProveedorCuentaBancaria } from '@/types/index'

const cuentaBancariaSchema = z.object({
  banco_nombre: z.string().min(1, 'El nombre del banco es requerido'),
  numero_cuenta: z.string().min(1, 'El número de cuenta es requerido'),
  titular_cuenta: z.string().optional(),
  es_favorita: z.boolean().default(false)
})

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, 'Formato de RIF inválido (J-XXXXXXXX-X)'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  contacto: z.string().optional(),
  porcentaje_retencion: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
  tipo_cambio: z.enum(['USD', 'EUR', 'PAR'], { required_error: 'Seleccione el tipo de cambio' }),
  cuentas_bancarias: z.array(cuentaBancariaSchema).min(0, 'Debe agregar al menos una cuenta bancaria')
})

type ProveedorFormData = z.infer<typeof proveedorSchema>

interface ProveedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProveedorFormData) => Promise<void>
  initialRif?: string
  editingProveedor?: any
}

export const ProveedorModalNew: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRif,
  editingProveedor
}) => {
  const [cuentasBancarias, setCuentasBancarias] = useState<ProveedorCuentaBancaria[]>(
    editingProveedor?.cuentas_bancarias || []
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<ProveedorFormData>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: {
      nombre: editingProveedor?.nombre || '',
      rif: editingProveedor?.rif || initialRif || '',
      direccion: editingProveedor?.direccion || '',
      telefono: editingProveedor?.telefono || '',
      email: editingProveedor?.email || '',
      contacto: editingProveedor?.contacto || '',
      porcentaje_retencion: editingProveedor?.porcentaje_retencion || 75,
      tipo_cambio: editingProveedor?.tipo_cambio || 'PAR',
      cuentas_bancarias: editingProveedor?.cuentas_bancarias || []
    }
  })

  const tiposCambio: { value: TipoCambio; label: string }[] = [
    { value: 'USD', label: 'Dólares (USD)' },
    { value: 'EUR', label: 'Euros (EUR)' },
    { value: 'PAR', label: 'Paralelo (PAR)' }
  ]


  const agregarCuentaBancaria = () => {
    const nuevaCuenta: ProveedorCuentaBancaria = {
      proveedor_id: editingProveedor?.id || '',
      banco_nombre: '',
      numero_cuenta: '',
      titular_cuenta: '',
      es_favorita: cuentasBancarias.length === 0,
      activo: true
    }
    setCuentasBancarias([...cuentasBancarias, nuevaCuenta])
  }

  const eliminarCuentaBancaria = (index: number) => {
    const nuevasCuentas = cuentasBancarias.filter((_, i) => i !== index)
    setCuentasBancarias(nuevasCuentas)
  }

  const actualizarCuentaBancaria = (index: number, campo: keyof ProveedorCuentaBancaria, valor: any) => {
    const nuevasCuentas = [...cuentasBancarias]
    ;(nuevasCuentas[index] as any)[campo] = valor
    setCuentasBancarias(nuevasCuentas)
  }

  const marcarComoFavorita = (index: number) => {
    const nuevasCuentas = cuentasBancarias.map((cuenta, i) => ({
      ...cuenta,
      es_favorita: i === index
    }))
    setCuentasBancarias(nuevasCuentas)
  }

  const handleClose = () => {
    reset()
    setCuentasBancarias([])
    onClose()
  }

  const onSubmit = async (data: ProveedorFormData) => {
    const formDataWithCuentas = {
      ...data,
      cuentas_bancarias: cuentasBancarias
    }
    await onSave(formDataWithCuentas)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {editingProveedor ? 'Editar Proveedor' : 'Agregar Nuevo Proveedor'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Persona de Contacto"
              {...register('contacto')}
              error={errors.contacto?.message}
              placeholder="Juan Pérez"
            />
            <Input
              label="Porcentaje de Retención (%)"
              type="number"
              step="0.01"
              {...register('porcentaje_retencion', { valueAsNumber: true })}
              error={errors.porcentaje_retencion?.message}
              placeholder="75"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cambio
              </label>
              <select
                {...register('tipo_cambio')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {tiposCambio.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
              {errors.tipo_cambio && (
                <p className="mt-1 text-sm text-red-600">{errors.tipo_cambio.message}</p>
              )}
            </div>
          </div>

          {/* Cuentas bancarias */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-lg">Cuentas Bancarias</h4>
              <Button
                type="button"
                size="sm"
                onClick={agregarCuentaBancaria}
                className="flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Agregar Cuenta
              </Button>
            </div>
            
            {cuentasBancarias.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-lg mb-2">No hay cuentas bancarias agregadas</p>
                <p className="text-sm">Haz clic en "Agregar Cuenta" para añadir una cuenta bancaria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cuentasBancarias.map((cuenta, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-sm">
                        Cuenta {index + 1}
                        {cuenta.es_favorita && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Favorita
                          </span>
                        )}
                      </h5>
                      <div className="flex items-center space-x-2">
                        {!cuenta.es_favorita && (
                          <button
                            type="button"
                            onClick={() => marcarComoFavorita(index)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-200 rounded"
                          >
                            Marcar como favorita
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => eliminarCuentaBancaria(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nombre del Banco"
                        value={cuenta.banco_nombre}
                        onChange={(e) => actualizarCuentaBancaria(index, 'banco_nombre', e.target.value)}
                        placeholder="Banco de Venezuela"
                        required
                      />
                      
                      <Input
                        label="Número de Cuenta"
                        value={cuenta.numero_cuenta}
                        onChange={(e) => actualizarCuentaBancaria(index, 'numero_cuenta', e.target.value)}
                        placeholder="01340123456789012345"
                        required
                      />
                      
                      <Input
                        label="Titular de la Cuenta (Opcional)"
                        value={cuenta.titular_cuenta || ''}
                        onChange={(e) => actualizarCuentaBancaria(index, 'titular_cuenta', e.target.value)}
                        placeholder="Nombre del titular"
                        className="md:col-span-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {cuentasBancarias.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  ℹ️ Si el proveedor tiene múltiples cuentas, marca una como favorita para usarla por defecto en los pagos.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
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
              {isSubmitting ? 'Guardando...' : (editingProveedor ? 'Actualizar' : 'Guardar')} Proveedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}