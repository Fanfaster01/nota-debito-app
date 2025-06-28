// src/components/ui/BancoSelector.tsx
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { bancoService } from '@/lib/services/bancoService'
import { handleServiceError } from '@/utils/errorHandler'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

interface Banco {
  id: string
  nombre: string
  codigo: string
}

interface BancoSelectorProps {
  value: string
  onChange: (bancoId: string) => void
  disabled?: boolean
  placeholder?: string
  label?: string
  error?: string
  required?: boolean
  onBancoAdded?: (banco: {id: string, nombre: string, codigo: string}) => void
}

const bancoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del banco es requerido'),
  codigo: z.string().min(1, 'El código del banco es requerido').max(4, 'Máximo 4 caracteres'),
})

type BancoFormData = z.infer<typeof bancoSchema>

export const BancoSelector: React.FC<BancoSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Seleccione banco",
  label = "Banco",
  error,
  required = false,
  onBancoAdded
}) => {
  const [bancos, setBancos] = useState<Banco[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBancos, setLoadingBancos] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<BancoFormData>({
    resolver: zodResolver(bancoSchema)
  })

  useEffect(() => {
    setMounted(true)
    cargarBancos()
  }, [])

  const cargarBancos = async () => {
    setLoadingBancos(true)
    try {
      const { data, error } = await bancoService.getBancos()
      if (!error && data) {
        setBancos(data)
      }
    } catch (error) {
      console.error('Error cargando bancos:', error)
    } finally {
      setLoadingBancos(false)
    }
  }

  const handleAgregarBanco = async (data: BancoFormData) => {
    setLoading(true)
    try {
      const { data: nuevoBanco, error } = await bancoService.createBanco({
        nombre: data.nombre,
        codigo: data.codigo.toUpperCase(),
        is_active: true
      })

      if (error) {
        console.error('Error creando banco:', error)
        alert('Error al crear el banco: ' + handleServiceError(error))
        return
      }

      if (nuevoBanco) {
        // Agregar el nuevo banco a la lista
        const bancoSimplificado = {
          id: nuevoBanco.id,
          nombre: nuevoBanco.nombre,
          codigo: nuevoBanco.codigo
        }
        setBancos(prev => [...prev, bancoSimplificado])
        
        // Notificar al componente padre sobre el nuevo banco
        if (onBancoAdded) {
          onBancoAdded(bancoSimplificado)
        }
        
        // Seleccionar automáticamente el nuevo banco
        onChange(nuevoBanco.id)
        
        // Cerrar modal y limpiar formulario
        setShowModal(false)
        reset()
      }
    } catch (error) {
      console.error('Error creando banco:', error)
      alert('Error al crear el banco')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    reset()
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && '*'}
        </label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled || loadingBancos}
              className="w-full h-10 pl-3 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{loadingBancos ? 'Cargando...' : placeholder}</option>
              {bancos.map(banco => (
                <option key={banco.id} value={banco.id}>
                  {banco.codigo} - {banco.nombre}
                </option>
              ))}
            </select>
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={disabled}
            className="flex items-center px-3"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modal para agregar banco - Renderizado con Portal para evitar forms anidados */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Agregar Nuevo Banco
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
                disabled={isSubmitting}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleAgregarBanco)} className="space-y-4">
              <Input
                label="Código del Banco"
                {...register('codigo')}
                error={errors.codigo?.message}
                placeholder="Ej: 0102"
                disabled={isSubmitting}
                className="uppercase"
              />

              <Input
                label="Nombre del Banco"
                {...register('nombre')}
                error={errors.nombre?.message}
                placeholder="Ej: Banco de Venezuela"
                disabled={isSubmitting}
              />

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creando...' : 'Crear Banco'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}