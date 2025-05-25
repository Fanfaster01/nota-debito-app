// src/app/admin/users/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MainLayout } from '@/components/layout/MainLayout'
import { adminUserService, companyService } from '@/lib/services/adminServices'
import { User, Company } from '@/types/database'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  UsersIcon, 
  PencilIcon, 
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

const userUpdateSchema = z.object({
  full_name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['master', 'admin', 'user']),
  company_id: z.string().nullable().optional(),
})

type UserUpdateFormData = z.infer<typeof userUpdateSchema>

interface UserWithCompany extends User {
  companies?: Company
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserWithCompany[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserWithCompany | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
  })

  const selectedRole = watch('role')

  useEffect(() => {
    if (currentUser?.role !== 'master') {
      setError('No tienes permisos para acceder a esta página')
      return
    }
    loadData()
  }, [currentUser])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar usuarios
      const { data: usersData, error: usersError } = await adminUserService.getAllUsers()
      if (usersError) {
        setError('Error al cargar usuarios: ' + usersError.message)
        return
      }

      // Cargar compañías
      const { data: companiesData, error: companiesError } = await companyService.getAllCompanies()
      if (companiesError) {
        setError('Error al cargar compañías: ' + companiesError.message)
        return
      }

      setUsers(usersData || [])
      setCompanies(companiesData || [])
    } catch (err: any) {
      setError('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserWithCompany) => {
    setEditingUser(user)
    setValue('full_name', user.full_name || '')
    setValue('email', user.email)
    setValue('role', user.role)
    setValue('company_id', user.company_id || null)
    setError(null)
    setSuccessMessage(null)
  }

  const handleFormSubmit = async (data: UserUpdateFormData) => {
    if (!editingUser) return

    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const updates = {
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        company_id: data.company_id || null, // Permitir compañía para todos los roles
      }

      const { error: updateError } = await adminUserService.updateUser(editingUser.id, updates)
      
      if (updateError) {
        setError('Error al actualizar usuario: ' + updateError.message)
        return
      }

      setSuccessMessage('Usuario actualizado exitosamente')
      setEditingUser(null)
      reset()
      await loadData()
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Error al actualizar usuario: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: UserWithCompany) => {
    try {
      const { error } = await adminUserService.toggleUserStatus(user.id, !user.is_active)
      
      if (error) {
        setError('Error al cambiar estado: ' + error.message)
        return
      }

      await loadData()
      setSuccessMessage(`Usuario ${!user.is_active ? 'activado' : 'desactivado'} exitosamente`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Error al cambiar estado: ' + err.message)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await adminUserService.deleteUser(userId)
      
      if (error) {
        setError('Error al eliminar usuario: ' + error.message)
        return
      }

      setDeleteConfirm(null)
      await loadData()
      setSuccessMessage('Usuario eliminado exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Error al eliminar usuario: ' + err.message)
    }
  }

  const handleCancelEdit = () => {
    setEditingUser(null)
    reset()
    setError(null)
    setSuccessMessage(null)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'master':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master':
        return 'Master'
      case 'admin':
        return 'Administrador'
      case 'user':
        return 'Usuario'
      default:
        return role
    }
  }

  if (currentUser?.role !== 'master') {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">No tienes permisos para acceder a esta página</p>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra los usuarios del sistema y sus permisos
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
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

        {/* Edit User Modal */}
        {editingUser && (
          <Card title="Editar Usuario">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  {...register('full_name')}
                  error={errors.full_name?.message}
                  disabled={saving}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={saving}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                    <option value="master">Master</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compañía {selectedRole === 'master' && <span className="text-gray-400">(Opcional para Master)</span>}
                  </label>
                  <select
                    {...register('company_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={saving}
                  >
                    <option value="">Sin compañía asignada</option>
                    {companies.filter(c => c.is_active).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} ({company.rif})
                      </option>
                    ))}
                  </select>
                  {errors.company_id && <p className="mt-1 text-sm text-red-600">{errors.company_id.message}</p>}
                  {selectedRole !== 'master' && !watch('company_id') && (
                    <p className="mt-1 text-sm text-yellow-600">
                      ⚠️ Este usuario no podrá acceder al sistema sin una compañía asignada
                    </p>
                  )}
                  {selectedRole === 'master' && watch('company_id') && (
                    <p className="mt-1 text-sm text-blue-600">
                      ℹ️ Los usuarios master pueden tener una compañía asignada para pruebas
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Información sobre roles:</strong>
                  <br />• <strong>Usuario:</strong> Acceso básico, puede crear facturas y notas de débito
                  <br />• <strong>Administrador:</strong> Puede gestionar datos de su compañía
                  <br />• <strong>Master:</strong> Acceso total al sistema, gestiona compañías y usuarios
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Actualizar Usuario'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Users List */}
        <Card title="Usuarios Registrados">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Compañía
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
                  {users.map((user) => (
                    <tr key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UsersIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Sin nombre'}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.companies ? (
                          <div>
                            <div className="font-medium">{user.companies.name}</div>
                            <div className="text-gray-500">{user.companies.rif}</div>
                          </div>
                        ) : (
                          <span className={`text-gray-400 ${user.role !== 'master' ? 'font-medium' : ''}`}>
                            {user.role === 'master' ? 'Opcional' : '⚠️ Sin compañía'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar usuario"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                              title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {user.is_active ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar usuario"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay usuarios registrados</p>
            </div>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Usuarios Activos</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.company_id).length}
              </div>
              <div className="text-sm text-gray-500">Con Compañía Asignada</div>
            </div>
          </Card>
          
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.company_id && u.role !== 'master').length}
              </div>
              <div className="text-sm text-gray-500">Pendientes de Asignación</div>
            </div>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ¿Eliminar Usuario?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema.
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
                  onClick={() => handleDeleteUser(deleteConfirm)}
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