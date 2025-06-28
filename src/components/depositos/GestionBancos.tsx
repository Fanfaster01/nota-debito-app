// src/components/depositos/GestionBancos.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { bancosDepositosService } from '@/lib/services/depositosService'
import { BancoDepositoUI, BancoFormData } from '@/types/depositos'
import { Tables } from '@/types/database'
import { createClient } from '@/utils/supabase/client'
import { 
  BuildingLibraryIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

const bancoSchema = z.object({
  nombre: z.string().min(1, 'El nombre del banco es requerido').max(100, 'Máximo 100 caracteres'),
  numeroCuenta: z.string()
    .min(1, 'El número de cuenta es requerido')
    .regex(/^\d+$/, 'El número de cuenta debe contener solo números')
    .max(20, 'Máximo 20 dígitos'),
})

type BancoFormInputs = z.infer<typeof bancoSchema>

interface Props {
  onError: (error: string) => void
}

export function GestionBancos({ onError }: Props) {
  const { user } = useAuth()
  const [bancos, setBancos] = useState<BancoDepositoUI[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<BancoFormInputs>({
    resolver: zodResolver(bancoSchema)
  })

  // Verificar permisos
  if (user?.role !== 'master') {
    return (
      <div className="text-center py-8">
        <BuildingLibraryIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
        <p className="text-gray-500">
          Solo los usuarios Master pueden gestionar los bancos.
        </p>
      </div>
    )
  }

  useEffect(() => {
    loadBancos()
  }, [])

  const loadBancos = async () => {
    setLoadingData(true)
    onError('')

    try {
      // Cargar todos los bancos (activos e inactivos)
      const { data, error } = await bancosDepositosService.getBancos()
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        onError('Error al cargar bancos: ' + errorMessage)
        return
      }

      // Para mostrar todos los bancos, necesitamos hacer una consulta sin filtro is_active
      // Creamos una nueva instancia de supabase para esta consulta específica
      const supabase = createClient()
      const { data: allBancos, error: allError } = await supabase
        .from('bancos_depositos')
        .select('*')
        .order('nombre')

      if (allError) {
        onError('Error al cargar bancos: ' + allError.message)
        return
      }

      const bancosUI = allBancos?.map((banco: Tables<'bancos_depositos'>) => ({
        id: banco.id,
        nombre: banco.nombre,
        numeroCuenta: banco.numero_cuenta,
        isActive: banco.is_active,
        createdAt: new Date(banco.created_at),
        updatedAt: new Date(banco.updated_at)
      })) || []

      setBancos(bancosUI)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      onError('Error al cargar bancos: ' + errorMessage)
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: BancoFormInputs) => {
    setLoading(true)
    onError('')

    try {
      if (editingId) {
        // Actualizar banco existente
        const { data: updatedBanco, error: updateError } = await bancosDepositosService.updateBanco(
          editingId, 
          data
        )

        if (updateError) {
          const errorMessage = updateError instanceof Error ? updateError.message : 'Error desconocido'
          onError('Error al actualizar banco: ' + errorMessage)
          return
        }

        setBancos(prev => prev.map(banco => 
          banco.id === editingId ? updatedBanco! : banco
        ))

        setEditingId(null)
      } else {
        // Crear nuevo banco
        const { data: newBanco, error: createError } = await bancosDepositosService.createBanco(data)

        if (createError) {
          const errorMessage = createError instanceof Error ? createError.message : 'Error desconocido'
          onError('Error al crear banco: ' + errorMessage)
          return
        }

        setBancos(prev => [newBanco!, ...prev])
      }

      reset()
      setShowForm(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      onError('Error al guardar banco: ' + errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (banco: BancoDepositoUI) => {
    setEditingId(banco.id)
    setValue('nombre', banco.nombre)
    setValue('numeroCuenta', banco.numeroCuenta)
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    reset()
    setShowForm(false)
  }

  const toggleBancoStatus = async (banco: BancoDepositoUI) => {
    try {
      const { data: updatedBanco, error } = await bancosDepositosService.toggleBancoStatus(
        banco.id, 
        !banco.isActive
      )

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        onError('Error al cambiar estado del banco: ' + errorMessage)
        return
      }

      setBancos(prev => prev.map(b => 
        b.id === banco.id ? updatedBanco! : b
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      onError('Error al cambiar estado del banco: ' + errorMessage)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando bancos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BuildingLibraryIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Gestión de Bancos</h2>
        </div>
        
        <Button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Agregar Banco
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingId ? 'Editar Banco' : 'Nuevo Banco'}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Banco *"
                  placeholder="Ej: Banco de Venezuela"
                  {...register('nombre')}
                  error={errors.nombre?.message}
                  disabled={loading}
                />

                <Input
                  label="Número de Cuenta *"
                  placeholder="Ej: 01020000000000000000"
                  {...register('numeroCuenta')}
                  error={errors.numeroCuenta?.message}
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Banco'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Lista de Bancos */}
      <Card>
        {bancos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número de Cuenta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bancos.map((banco) => (
                  <tr key={banco.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingLibraryIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {banco.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {banco.numeroCuenta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        banco.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {banco.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {banco.createdAt.toLocaleDateString('es-VE')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(banco)}
                        className="flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBancoStatus(banco)}
                        className={`flex items-center ${
                          banco.isActive 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {banco.isActive ? (
                          <>
                            <EyeSlashIcon className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <BuildingLibraryIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay bancos registrados</h3>
            <p className="text-gray-500 mb-4">
              Comienza agregando el primer banco para gestionar los depósitos.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Primer Banco
            </Button>
          </div>
        )}
      </Card>

      {/* Información adicional */}
      <div className="bg-yellow-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">⚠️ Información Importante:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Solo puedes desactivar bancos que no tengan depósitos asociados</li>
          <li>• Los bancos inactivos no aparecerán en el formulario de nuevos depósitos</li>
          <li>• Asegúrate de que los números de cuenta sean correctos antes de crear depósitos</li>
          <li>• Los cambios se reflejan inmediatamente en todo el sistema</li>
        </ul>
      </div>
    </div>
  )
}