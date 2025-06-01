// src/components/forms/ProveedorModal.tsx
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import { bancoService } from '@/lib/services/bancoService'
import { Banco } from '@/types/database'

const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, 'Formato de RIF inválido (J-XXXXXXXX-X)'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  contacto: z.string().optional(),
  porcentaje_retencion: z.number().min(0).max(100, 'El porcentaje debe estar entre 0 y 100'),
  numero_cuenta: z.string().optional(),
  banco_id: z.string().optional(),
})

type ProveedorFormData = z.infer<typeof proveedorSchema>

interface ProveedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProveedorFormData) => Promise<void>
  initialRif?: string
  editingProveedor?: any
}

export const ProveedorModal: React.FC<ProveedorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRif,
  editingProveedor
}) => {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loadingBancos, setLoadingBancos] = useState(false)
  const [showBancoForm, setShowBancoForm] = useState(false)
  const [newBancoNombre, setNewBancoNombre] = useState('')
  const [newBancoCodigo, setNewBancoCodigo] = useState('')
  const [bancoError, setBancoError] = useState('')

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
      numero_cuenta: editingProveedor?.numero_cuenta || '',
      banco_id: editingProveedor?.banco_id || '',
    }
  })

  const numero_cuenta = watch('numero_cuenta')

  useEffect(() => {
    if (isOpen) {
      loadBancos()
    }
  }, [isOpen])

  const loadBancos = async () => {
    setLoadingBancos(true)
    try {
      const { data, error } = await bancoService.getAllBancos()
      if (!error && data) {
        setBancos(data)
      }
    } catch (error) {
      console.error('Error cargando bancos:', error)
    } finally {
      setLoadingBancos(false)
    }
  }

  const handleCreateBanco = async () => {
    setBancoError('')
    
    if (!newBancoNombre.trim()) {
      setBancoError('El nombre del banco es requerido')
      return
    }
    
    if (!newBancoCodigo.match(/^\d{4}$/)) {
      setBancoError('El código debe tener exactamente 4 dígitos')
      return
    }

    try {
      const exists = await bancoService.checkCodigoExists(newBancoCodigo)
      if (exists) {
        setBancoError('Ya existe un banco con ese código')
        return
      }

      const { data, error } = await bancoService.createBanco({
        nombre: newBancoNombre.trim(),
        codigo: newBancoCodigo
      })

      if (error) {
        setBancoError('Error al crear el banco')
        return
      }

      if (data) {
        await loadBancos()
        setValue('banco_id', data.id)
        setNewBancoNombre('')
        setNewBancoCodigo('')
        setShowBancoForm(false)
      }
    } catch (error) {
      setBancoError('Error al crear el banco')
    }
  }

  const handleClose = () => {
    reset()
    setShowBancoForm(false)
    setNewBancoNombre('')
    setNewBancoCodigo('')
    setBancoError('')
    onClose()
  }

  const onSubmit = async (data: ProveedorFormData) => {
    await onSave(data)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Información Bancaria</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Número de Cuenta"
                {...register('numero_cuenta')}
                error={errors.numero_cuenta?.message}
                placeholder="01340123456789012345"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                {loadingBancos ? (
                  <div className="text-sm text-gray-500">Cargando bancos...</div>
                ) : (
                  <>
                    <select
                      {...register('banco_id')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      disabled={showBancoForm}
                    >
                      <option value="">Seleccione un banco</option>
                      {bancos.map((banco) => (
                        <option key={banco.id} value={banco.id}>
                          {banco.codigo} - {banco.nombre}
                        </option>
                      ))}
                    </select>
                    
                    {!showBancoForm && (
                      <button
                        type="button"
                        onClick={() => setShowBancoForm(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Agregar nuevo banco
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Formulario para nuevo banco */}
            {showBancoForm && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h5 className="font-medium mb-3">Agregar Nuevo Banco</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Banco"
                    value={newBancoNombre}
                    onChange={(e) => setNewBancoNombre(e.target.value)}
                    placeholder="Banco de Venezuela"
                  />
                  <Input
                    label="Código (4 dígitos)"
                    value={newBancoCodigo}
                    onChange={(e) => setNewBancoCodigo(e.target.value)}
                    placeholder="0102"
                    maxLength={4}
                  />
                </div>
                
                {bancoError && (
                  <p className="mt-2 text-sm text-red-600">{bancoError}</p>
                )}
                
                <div className="mt-3 flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateBanco}
                  >
                    Guardar Banco
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowBancoForm(false)
                      setNewBancoNombre('')
                      setNewBancoCodigo('')
                      setBancoError('')
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Mostrar información del banco si se selecciona cuenta */}
            {numero_cuenta && numero_cuenta.length >= 4 && (
              <div className="mt-2 text-sm text-gray-600">
                {(() => {
                  const codigoCuenta = numero_cuenta.substring(0, 4)
                  const banco = bancos.find(b => b.codigo === codigoCuenta)
                  if (banco) {
                    return (
                      <p className="text-green-600">
                        ✓ Cuenta corresponde a: {banco.nombre}
                      </p>
                    )
                  } else {
                    return (
                      <p className="text-yellow-600">
                        ⚠ No se encontró un banco con código {codigoCuenta}
                      </p>
                    )
                  }
                })()}
              </div>
            )}
          </div>

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
              {isSubmitting ? 'Guardando...' : (editingProveedor ? 'Actualizar' : 'Guardar')} Proveedor
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}