// src/app/proveedores/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { ProveedorModalNew } from '@/components/forms/ProveedorModalNew'
import { ProveedorDetailModal } from '@/components/proveedores/ProveedorDetailModal'
import { proveedorService, ProveedorWithCuentas, ProveedorFormData } from '@/lib/services/proveedorService'
import { useAsyncState } from '@/hooks/useAsyncState'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  BanknotesIcon,
  CreditCardIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

export default function ProveedoresPage() {
  const { user } = useAuth()
  
  // Estados unificados con useAsyncState
  const proveedoresState = useAsyncState<{
    proveedores: ProveedorWithCuentas[]
    totalCount: number
  }>()
  const saveState = useAsyncState<ProveedorWithCuentas>()
  const deleteState = useAsyncState<boolean>()
  
  // Estados locales
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedProveedorId, setSelectedProveedorId] = useState<string | null>(null)
  const [editingProveedor, setEditingProveedor] = useState<ProveedorWithCuentas | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const proveedores = proveedoresState.data?.proveedores || []
  const totalItems = proveedoresState.data?.totalCount || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  useEffect(() => {
    if (user && ['master', 'admin'].includes(user.role)) {
      loadProveedores()
    }
  }, [user, currentPage, itemsPerPage])

  const loadProveedores = async () => {
    await proveedoresState.execute(
      async () => {
        const { data, totalCount, error: loadError } = await proveedorService.getAllProveedoresPaginated(
          currentPage,
          itemsPerPage,
          searchTerm
        )

        if (loadError) {
          throw loadError
        }

        return {
          proveedores: data || [],
          totalCount
        }
      },
      'Error al cargar proveedores'
    )
  }

  const handleSearch = () => {
    setCurrentPage(1)
    loadProveedores()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleCreateProveedor = () => {
    setEditingProveedor(null)
    setShowModal(true)
  }

  const handleEditProveedor = (proveedor: ProveedorWithCuentas) => {
    setEditingProveedor(proveedor)
    setShowModal(true)
  }

  const handleViewProveedor = (proveedorId: string) => {
    setSelectedProveedorId(proveedorId)
    setShowDetailModal(true)
  }

  const handleSaveProveedor = async (data: ProveedorFormData) => {
    const result = await saveState.execute(
      async () => {
        if (editingProveedor) {
          // Verificar si el RIF cambió y ya existe
          if (data.rif !== editingProveedor.rif) {
            const exists = await proveedorService.checkRifExists(data.rif, editingProveedor.id)
            if (exists) {
              throw new Error('Ya existe un proveedor con ese RIF')
            }
          }

          const { error: updateError } = await proveedorService.updateProveedorWithCuentas(
            editingProveedor.id,
            data
          )

          if (updateError) {
            throw updateError
          }

          return { ...editingProveedor, ...data } as ProveedorWithCuentas
        } else {
          // Verificar si el RIF ya existe
          const exists = await proveedorService.checkRifExists(data.rif)
          if (exists) {
            throw new Error('Ya existe un proveedor con ese RIF')
          }

          const { data: newProveedor, error: createError } = await proveedorService.createProveedorWithCuentas(data)

          if (createError) {
            throw createError
          }

          return newProveedor!
        }
      },
      editingProveedor ? 'Error al actualizar proveedor' : 'Error al crear proveedor'
    )

    if (result) {
      setSuccessMessage(editingProveedor ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente')
      setShowModal(false)
      loadProveedores()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleDeleteProveedor = async (id: string) => {
    const result = await deleteState.execute(
      async () => {
        const { error: deleteError } = await proveedorService.deactivateProveedor(id)

        if (deleteError) {
          throw deleteError
        }

        return true
      },
      'Error al eliminar proveedor'
    )

    if (result) {
      setDeleteConfirm(null)
      setSuccessMessage('Proveedor eliminado exitosamente')
      loadProveedores()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  // Control de acceso
  if (!user || !['master', 'admin'].includes(user.role)) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">No tienes permisos para acceder a esta página</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Proveedores</h1>
            <p className="mt-1 text-sm text-gray-500">
              Administra la información de tus proveedores
            </p>
          </div>
          <Button onClick={handleCreateProveedor} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Messages */}
        {(proveedoresState.error || saveState.error || deleteState.error) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">
              {proveedoresState.error || saveState.error || deleteState.error}
            </p>
            <button 
              onClick={() => {
                proveedoresState.clearError()
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

        {/* Search */}
        <Card>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Buscar por nombre, RIF o contacto..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={proveedoresState.loading}>
              Buscar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setCurrentPage(1)
                loadProveedores()
              }}
              disabled={proveedoresState.loading}
            >
              Limpiar
            </Button>
          </div>
        </Card>

        {/* Proveedores List */}
        <Card title="Proveedores Registrados">
          {proveedoresState.loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : proveedores.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Proveedor
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        RIF
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                        Contacto
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                        Info. Bancaria
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Retención
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {proveedores.map((proveedor) => (
                      <tr key={proveedor.id}>
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            <BuildingStorefrontIcon className="h-6 w-6 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {proveedor.nombre}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-48" title={proveedor.direccion}>
                                {proveedor.direccion}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 truncate">
                            {proveedor.rif}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 space-y-1">
                            {proveedor.contacto && (
                              <div className="flex items-center truncate">
                                <UserIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="truncate">{proveedor.contacto}</span>
                              </div>
                            )}
                            {proveedor.telefono && (
                              <div className="flex items-center truncate">
                                <PhoneIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="truncate">{proveedor.telefono}</span>
                              </div>
                            )}
                            {proveedor.email && (
                              <div className="flex items-center truncate">
                                <EnvelopeIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="truncate">{proveedor.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 space-y-1">
                            {proveedor.cuentas_bancarias && proveedor.cuentas_bancarias.length > 0 && (
                              <div className="flex items-center truncate">
                                <BanknotesIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="truncate">{proveedor.cuentas_bancarias[0].banco_nombre || 'Banco no especificado'}</span>
                              </div>
                            )}
                            {proveedor.cuentas_bancarias && proveedor.cuentas_bancarias.length > 0 && (
                              <div className="flex items-center truncate">
                                <CreditCardIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                                <span className="truncate">{proveedor.cuentas_bancarias[0].numero_cuenta}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {proveedor.porcentaje_retencion}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewProveedor(proveedor.id)}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Ver detalle y cuentas bancarias"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditProveedor(proveedor)}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Editar proveedor"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(proveedor.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Eliminar proveedor"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(items) => {
                  setItemsPerPage(items)
                  setCurrentPage(1)
                }}
              />
            </>
          ) : (
            <div className="text-center py-8">
              <BuildingStorefrontIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron proveedores</p>
              <Button onClick={handleCreateProveedor} className="mt-4">
                Agregar Primer Proveedor
              </Button>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                ¿Eliminar Proveedor?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. El proveedor será eliminado permanentemente.
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
                  onClick={() => handleDeleteProveedor(deleteConfirm)}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Proveedor Modal */}
        <ProveedorModalNew
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingProveedor(null)
          }}
          onSave={handleSaveProveedor}
          editingProveedor={editingProveedor || undefined}
        />

        {/* Proveedor Detail Modal */}
        {selectedProveedorId && (
          <ProveedorDetailModal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false)
              setSelectedProveedorId(null)
            }}
            proveedorId={selectedProveedorId}
            onProveedorUpdated={loadProveedores}
          />
        )}
      </div>
    </MainLayout>
  )
}