// src/components/proveedores/CuentasBancariasManager.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  PlusIcon, 
  TrashIcon, 
  StarIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon,
  BanknotesIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { ProveedorCuentaBancaria, TipoCambio } from '@/types/index'
import { proveedorCuentasBancariasService } from '@/lib/services/proveedorCuentasBancariasService'

interface CuentasBancariasManagerProps {
  proveedorId: string
  proveedorNombre: string
  tipoCambio: TipoCambio
  readonly?: boolean
}

interface CuentaForm {
  banco_nombre: string
  numero_cuenta: string
  titular_cuenta: string
}

export const CuentasBancariasManager: React.FC<CuentasBancariasManagerProps> = ({
  proveedorId,
  proveedorNombre,
  tipoCambio,
  readonly = false
}) => {
  const [cuentas, setCuentas] = useState<ProveedorCuentaBancaria[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCuenta, setEditingCuenta] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<CuentaForm>({
    banco_nombre: '',
    numero_cuenta: '',
    titular_cuenta: ''
  })

  useEffect(() => {
    loadCuentas()
  }, [proveedorId])

  const loadCuentas = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedorId)
      
      if (error) {
        setError('Error al cargar cuentas bancarias')
        return
      }
      
      setCuentas(data || [])
    } catch (err) {
      setError('Error al cargar cuentas bancarias')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarcarFavorita = async (cuentaId: string) => {
    if (readonly) return
    
    try {
      setError(null)
      const { error } = await proveedorCuentasBancariasService.marcarComoFavorita(proveedorId, cuentaId)
      
      if (error) {
        setError('Error al marcar cuenta como favorita')
        return
      }
      
      setSuccess('Cuenta marcada como favorita')
      await loadCuentas()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al marcar cuenta como favorita')
      console.error('Error:', err)
    }
  }

  const handleEliminarCuenta = async (cuentaId: string) => {
    if (readonly) return
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta bancaria?')) {
      return
    }
    
    try {
      setError(null)
      const { error } = await proveedorCuentasBancariasService.deleteCuentaBancaria(cuentaId)
      
      if (error) {
        setError('Error al eliminar cuenta bancaria')
        return
      }
      
      setSuccess('Cuenta bancaria eliminada')
      await loadCuentas()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al eliminar cuenta bancaria')
      console.error('Error:', err)
    }
  }

  const handleCrearCuenta = async () => {
    if (!formData.banco_nombre.trim() || !formData.numero_cuenta.trim()) {
      setError('El nombre del banco y número de cuenta son requeridos')
      return
    }

    try {
      setError(null)
      
      // Verificar si ya existe
      const exists = await proveedorCuentasBancariasService.checkCuentaExists(
        proveedorId, 
        formData.numero_cuenta
      )
      
      if (exists) {
        setError('Ya existe una cuenta con ese número')
        return
      }

      const nuevaCuenta: Omit<ProveedorCuentaBancaria, 'id' | 'created_at' | 'updated_at'> = {
        proveedor_id: proveedorId,
        banco_nombre: formData.banco_nombre.trim(),
        numero_cuenta: formData.numero_cuenta.trim(),
        titular_cuenta: formData.titular_cuenta.trim() || proveedorNombre,
        es_favorita: cuentas.length === 0, // Primera cuenta es favorita por defecto
        activo: true
      }

      const { error } = await proveedorCuentasBancariasService.createCuentaBancaria(nuevaCuenta)
      
      if (error) {
        setError('Error al crear cuenta bancaria')
        return
      }
      
      setSuccess('Cuenta bancaria creada exitosamente')
      setShowNewForm(false)
      setFormData({ banco_nombre: '', numero_cuenta: '', titular_cuenta: '' })
      await loadCuentas()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al crear cuenta bancaria')
      console.error('Error:', err)
    }
  }

  const handleEditarCuenta = async (cuenta: ProveedorCuentaBancaria) => {
    if (!cuenta.id || !formData.banco_nombre.trim() || !formData.numero_cuenta.trim()) {
      setError('Datos incompletos para actualizar')
      return
    }

    try {
      setError(null)
      
      const updates: Partial<ProveedorCuentaBancaria> = {
        banco_nombre: formData.banco_nombre.trim(),
        numero_cuenta: formData.numero_cuenta.trim(),
        titular_cuenta: formData.titular_cuenta.trim() || proveedorNombre
      }

      const { error } = await proveedorCuentasBancariasService.updateCuentaBancaria(cuenta.id, updates)
      
      if (error) {
        setError('Error al actualizar cuenta bancaria')
        return
      }
      
      setSuccess('Cuenta bancaria actualizada')
      setEditingCuenta(null)
      setFormData({ banco_nombre: '', numero_cuenta: '', titular_cuenta: '' })
      await loadCuentas()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al actualizar cuenta bancaria')
      console.error('Error:', err)
    }
  }

  const startEditing = (cuenta: ProveedorCuentaBancaria) => {
    if (readonly) return
    
    setEditingCuenta(cuenta.id || '')
    setFormData({
      banco_nombre: cuenta.banco_nombre,
      numero_cuenta: cuenta.numero_cuenta,
      titular_cuenta: cuenta.titular_cuenta || ''
    })
    setShowNewForm(false)
  }

  const cancelEditing = () => {
    setEditingCuenta(null)
    setShowNewForm(false)
    setFormData({ banco_nombre: '', numero_cuenta: '', titular_cuenta: '' })
    setError(null)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Cargando cuentas bancarias...</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <CreditCardIcon className="h-5 w-5 mr-2" />
            Cuentas Bancarias para Pagos
          </h3>
          <p className="text-sm text-gray-600">
            Proveedor: {proveedorNombre} • Tipo de cambio: {tipoCambio}
          </p>
        </div>
        {!readonly && (
          <Button
            onClick={() => {
              setShowNewForm(true)
              setEditingCuenta(null)
              setFormData({ banco_nombre: '', numero_cuenta: '', titular_cuenta: '' })
            }}
            size="sm"
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nueva Cuenta
          </Button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* New Account Form */}
      {showNewForm && !readonly && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-medium mb-3">Agregar Nueva Cuenta Bancaria</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <Input
              label="Nombre del Banco"
              value={formData.banco_nombre}
              onChange={(e) => setFormData({ ...formData, banco_nombre: e.target.value })}
              placeholder="Banco de Venezuela"
            />
            <Input
              label="Número de Cuenta"
              value={formData.numero_cuenta}
              onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
              placeholder="01340123456789012345"
            />
            <Input
              label="Titular de la Cuenta"
              value={formData.titular_cuenta}
              onChange={(e) => setFormData({ ...formData, titular_cuenta: e.target.value })}
              placeholder={proveedorNombre}
            />
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCrearCuenta} size="sm">
              <CheckIcon className="h-4 w-4 mr-1" />
              Guardar
            </Button>
            <Button onClick={cancelEditing} size="sm" variant="outline">
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Accounts List */}
      {cuentas.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay cuentas bancarias registradas</p>
            <p className="text-sm text-gray-400">
              Agrega al menos una cuenta bancaria para generar archivos de pago
            </p>
            {!readonly && (
              <Button
                onClick={() => setShowNewForm(true)}
                className="mt-4"
                size="sm"
              >
                Agregar Primera Cuenta
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {cuentas.map((cuenta) => (
            <Card key={cuenta.id} className={`p-4 ${cuenta.es_favorita ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              {editingCuenta === cuenta.id ? (
                // Edit Form
                <div>
                  <h4 className="font-medium mb-3">Editar Cuenta Bancaria</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <Input
                      label="Nombre del Banco"
                      value={formData.banco_nombre}
                      onChange={(e) => setFormData({ ...formData, banco_nombre: e.target.value })}
                    />
                    <Input
                      label="Número de Cuenta"
                      value={formData.numero_cuenta}
                      onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                    />
                    <Input
                      label="Titular de la Cuenta"
                      value={formData.titular_cuenta}
                      onChange={(e) => setFormData({ ...formData, titular_cuenta: e.target.value })}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleEditarCuenta(cuenta)} size="sm">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Actualizar
                    </Button>
                    <Button onClick={cancelEditing} size="sm" variant="outline">
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          {cuenta.banco_nombre}
                          {cuenta.es_favorita && (
                            <div className="flex items-center ml-2">
                              <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-1">
                                Favorita
                              </span>
                            </div>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Cuenta: {cuenta.numero_cuenta}
                        </p>
                        {cuenta.titular_cuenta && (
                          <p className="text-xs text-gray-500">
                            Titular: {cuenta.titular_cuenta}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!readonly && (
                    <div className="flex items-center space-x-2">
                      {!cuenta.es_favorita && (
                        <button
                          onClick={() => handleMarcarFavorita(cuenta.id!)}
                          className="text-yellow-600 hover:text-yellow-800 p-1"
                          title="Marcar como favorita"
                        >
                          <StarIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => startEditing(cuenta)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Editar cuenta"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarCuenta(cuenta.id!)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Eliminar cuenta"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Info */}
      {cuentas.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            💡 <strong>Cuenta favorita:</strong> Se usa por defecto en la generación de archivos TXT para pagos bancarios.
            {cuentas.filter(c => c.es_favorita).length === 0 && (
              <span className="text-orange-600 ml-1">Selecciona una cuenta como favorita.</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}