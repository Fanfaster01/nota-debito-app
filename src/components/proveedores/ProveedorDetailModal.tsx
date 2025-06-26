// src/components/proveedores/ProveedorDetailModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  XMarkIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  MapPinIcon,
  UserIcon,
  BanknotesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { TipoCambio } from '@/types/index'
import { proveedorService, ProveedorWithCuentas } from '@/lib/services/proveedorService'
import { CuentasBancariasManager } from './CuentasBancariasManager'

interface ProveedorDetailModalProps {
  isOpen: boolean
  onClose: () => void
  proveedorId: string
  onProveedorUpdated?: () => void
}

export const ProveedorDetailModal: React.FC<ProveedorDetailModalProps> = ({
  isOpen,
  onClose,
  proveedorId,
  onProveedorUpdated
}) => {
  const [proveedor, setProveedor] = useState<ProveedorWithCuentas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && proveedorId) {
      loadProveedor()
    }
  }, [isOpen, proveedorId])

  const loadProveedor = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await proveedorService.getProveedorWithCuentas(proveedorId)
      
      if (error) {
        setError('Error al cargar proveedor')
        return
      }
      
      setProveedor(data)
    } catch (err) {
      setError('Error al cargar proveedor')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProveedorUpdated = () => {
    loadProveedor()
    onProveedorUpdated?.()
  }

  const getTipoCambioLabel = (tipo: TipoCambio): string => {
    const labels = {
      USD: 'Dólares (USD)',
      EUR: 'Euros (EUR)',
      PAR: 'Paralelo (PAR)'
    }
    return labels[tipo] || tipo
  }

  const getTipoCambioIcon = (tipo: TipoCambio) => {
    switch (tipo) {
      case 'USD':
        return <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
      case 'EUR':
        return <CurrencyDollarIcon className="h-4 w-4 text-blue-600" />
      case 'PAR':
        return <BanknotesIcon className="h-4 w-4 text-orange-600" />
      default:
        return <BanknotesIcon className="h-4 w-4 text-gray-600" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Detalle del Proveedor
              </h3>
              <p className="text-sm text-gray-500">
                {proveedor?.nombre || 'Cargando...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Cargando información del proveedor...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
              <Button onClick={loadProveedor} className="mt-2" size="sm">
                Reintentar
              </Button>
            </div>
          ) : proveedor ? (
            <div className="space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Información General
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BuildingStorefrontIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{proveedor.nombre}</p>
                        <p className="text-xs text-gray-500">Nombre comercial</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <IdentificationIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{proveedor.rif}</p>
                        <p className="text-xs text-gray-500">RIF</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-900">{proveedor.direccion}</p>
                        <p className="text-xs text-gray-500">Dirección</p>
                      </div>
                    </div>

                    {proveedor.telefono && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">{proveedor.telefono}</p>
                          <p className="text-xs text-gray-500">Teléfono</p>
                        </div>
                      </div>
                    )}

                    {proveedor.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">{proveedor.email}</p>
                          <p className="text-xs text-gray-500">Email</p>
                        </div>
                      </div>
                    )}

                    {proveedor.contacto && (
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-900">{proveedor.contacto}</p>
                          <p className="text-xs text-gray-500">Persona de contacto</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 border-b pb-2">
                    Información Fiscal y Financiera
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BanknotesIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {proveedor.porcentaje_retencion}%
                        </p>
                        <p className="text-xs text-gray-500">Porcentaje de retención IVA</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {getTipoCambioIcon(proveedor.tipo_cambio as TipoCambio)}
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getTipoCambioLabel(proveedor.tipo_cambio as TipoCambio)}
                        </p>
                        <p className="text-xs text-gray-500">Tipo de cambio preferido</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-md">
                      <p className="text-xs text-gray-600">
                        <strong>Estado:</strong> {proveedor.is_active ? 'Activo' : 'Inactivo'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Creado:</strong> {new Date(proveedor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuentas Bancarias */}
              <div>
                <CuentasBancariasManager
                  proveedorId={proveedor.id}
                  proveedorNombre={proveedor.nombre}
                  tipoCambio={proveedor.tipo_cambio as TipoCambio}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontró el proveedor</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}