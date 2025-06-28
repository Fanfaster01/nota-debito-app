// src/app/admin/companies/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MainLayout } from '@/components/layout/MainLayout'
import { companyService } from '@/lib/services/adminServices'
import { Company, TablesInsert } from '@/types/database'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAsyncList, useAsyncState } from '@/hooks/useAsyncState'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  BuildingOfficeIcon,
  EyeSlashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const companySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  rif: z.string().regex(/^[JGV]-\d+(-\d)?$/, 'Formato de RIF inválido (J-XXXXXXXX-X)'),
  address: z.string().min(1, 'La dirección es requerida'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
})

type CompanyFormData = z.infer<typeof companySchema>

export default function CompaniesPage() {
  const { user } = useAuth()
  
  // Estados unificados con useAsyncState
  const companiesState = useAsyncList<Company>()
  const saveState = useAsyncState<Company>()
  const deleteState = useAsyncState<boolean>()
  
  // Estados locales del UI
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: '',
      rif: '',
      address: '',
      phone: '',
      email: '',
    }
  })

  useEffect(() => {
    if (user?.role !== 'master') {
      companiesState.setData([])
      return
    }
    loadCompanies()
  }, [user])

  const loadCompanies = async () => {
    await companiesState.execute(
      async () => {
        const { data, error: loadError } = await companyService.getAllCompanies()
        
        if (loadError) {
          throw loadError
        }

        return data || []
      },
      'Error al cargar compañías'
    )
  }

  const handleCreateCompany = () => {
    setEditingCompany(null)
    reset({
      name: '',
      rif: '',
      address: '',
      phone: '',
      email: '',
    })
    setShowForm(true)
    companiesState.clearError()
    saveState.clearError()
    setSuccessMessage(null)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setValue('name', company.name)
    setValue('rif', company.rif)
    setValue('address', company.address)
    setValue('phone', company.phone || '')
    setValue('email', company.email || '')
    setShowForm(true)
    companiesState.clearError()
    saveState.clearError()
    setSuccessMessage(null)
  }

  const handleFormSubmit = async (data: CompanyFormData) => {
    setSuccessMessage(null)

    const result = await saveState.execute(
      async () => {
        const companyData: TablesInsert<'companies'> = {
          name: data.name.trim(),
          rif: data.rif.trim().toUpperCase(),
          address: data.address.trim(),
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
        }

        if (editingCompany) {
          // Actualizar compañía existente
          const { error: updateError } = await companyService.updateCompany(editingCompany.id, companyData)
          
          if (updateError) {
            throw updateError
          }
          
          return { ...editingCompany, ...companyData } as Company
        } else {
          // Crear nueva compañía
          const { data: newCompany, error: createError } = await companyService.createCompany(companyData)
          
          if (createError) {
            if (String(createError).includes('duplicate key')) {
              throw new Error('Ya existe una compañía con ese RIF')
            }
            throw createError
          }
          
          return newCompany!
        }
      },
      editingCompany ? 'Error al actualizar compañía' : 'Error al crear compañía'
    )

    if (result) {
      // Operación exitosa
      setSuccessMessage(editingCompany ? 'Compañía actualizada exitosamente' : 'Compañía creada exitosamente')
      setShowForm(false)
      setEditingCompany(null)
      reset()
      await loadCompanies()
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleToggleStatus = async (company: Company) => {
    const result = await saveState.execute(
      async () => {
        const { error } = await companyService.toggleCompanyStatus(company.id, !company.is_active)
        
        if (error) {
          throw error
        }

        return company
      },
      'Error al cambiar estado'
    )

    if (result) {
      await loadCompanies()
      setSuccessMessage(`Compañía ${!company.is_active ? 'activada' : 'desactivada'} exitosamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    const result = await deleteState.execute(
      async () => {
        const { error } = await companyService.deleteCompany(companyId)
        
        if (error) {
          throw error
        }

        return true
      },
      'Error al eliminar compañía'
    )

    if (result) {
      setDeleteConfirm(null)
      await loadCompanies()
      setSuccessMessage('Compañía eliminada exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCompany(null)
    reset()
    saveState.clearError()
  }

  if (user?.role !== 'master') {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">No tienes permisos para acceder a esta página</p>
        </div>
      </MainLayout>
    )
  }

  if (companiesState.loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Compañías</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra las compañías del sistema
            </p>
          </div>
          <Button onClick={handleCreateCompany} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nueva Compañía
          </Button>
        </div>

        {/* Messages */}
        {(companiesState.error || saveState.error || deleteState.error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">
              {companiesState.error || saveState.error || deleteState.error}
            </p>
            <button 
              onClick={() => {
                companiesState.clearError()
                saveState.clearError()
                deleteState.clearError()
              }}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <Card title={editingCompany ? 'Editar Compañía' : 'Nueva Compañía'}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la Compañía"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={saveState.loading}
                />
                <Input
                  label="RIF"
                  {...register('rif')}
                  error={errors.rif?.message}
                  placeholder="J-12345678-9"
                  disabled={saveState.loading}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <Input
                label="Dirección"
                {...register('address')}
                error={errors.address?.message}
                disabled={saveState.loading}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="0212-1234567"
                  disabled={saveState.loading}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="info@empresa.com"
                  disabled={saveState.loading}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelForm}
                  disabled={saveState.loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={saveState.loading || isSubmitting}
                >
                  {saveState.loading ? 'Guardando...' : (editingCompany ? 'Actualizar' : 'Crear')} Compañía
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Companies List */}
        <Card title="Compañías Registradas">
          {(companiesState.data || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compañía
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RIF
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(companiesState.data || []).map((company) => (
                    <tr key={company.id} className={!company.is_active ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {company.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {company.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.rif}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {company.phone && <div>{company.phone}</div>}
                          {company.email && <div className="text-gray-500">{company.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditCompany(company)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar compañía"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(company)}
                          className={`${company.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={company.is_active ? 'Desactivar compañía' : 'Activar compañía'}
                        >
                          {company.is_active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(company.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar compañía"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay compañías registradas</p>
              <Button onClick={handleCreateCompany} className="mt-4">
                Crear Primera Compañía
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ¿Eliminar Compañía?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. Todos los datos asociados a esta compañía serán eliminados permanentemente.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteCompany(deleteConfirm)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}