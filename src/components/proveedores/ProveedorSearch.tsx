'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { proveedorService, ProveedorFormData, ProveedorWithCuentas } from '@/lib/services/proveedorService'
import { ProveedorModalNew } from '@/components/forms/ProveedorModalNew'
import { Proveedor } from '@/types/database'

interface ProveedorSearchProps {
  onProveedorSelect: (proveedor: ProveedorWithCuentas) => void
  onClose?: () => void
  defaultValue?: {
    rif?: string
    nombre?: string
  }
  disabled?: boolean
  allowCreate?: boolean
  placeholder?: string
  required?: boolean
  showAsModal?: boolean
  className?: string
}

interface ProveedorSuggestion extends ProveedorWithCuentas {
  score: number // Para ordenar por relevancia
}

export function ProveedorSearch({
  onProveedorSelect,
  onClose,
  defaultValue,
  disabled = false,
  allowCreate = true,
  placeholder = "Buscar por RIF o nombre del proveedor...",
  required = false,
  showAsModal = false,
  className = ""
}: ProveedorSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<ProveedorSuggestion[]>([])
  const [selectedProveedor, setSelectedProveedor] = useState<ProveedorWithCuentas | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Inicializar con valor por defecto
  useEffect(() => {
    if (defaultValue?.rif || defaultValue?.nombre) {
      setSearchTerm(defaultValue.rif || defaultValue.nombre || '')
      if (defaultValue.rif) {
        buscarProveedorPorRif(defaultValue.rif)
      }
    }
  }, [defaultValue])

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const buscarProveedorPorRif = async (rif: string) => {
    if (!rif.trim()) return

    setLoading(true)
    setError(null)

    try {
      const result = await proveedorService.getProveedorByRif(rif.trim().toUpperCase())
      
      if (result.data) {
        setSelectedProveedor(result.data)
        setShowSuggestions(false)
        onProveedorSelect(result.data)
      } else {
        // Si no encuentra por RIF exacto, buscar sugerencias
        await buscarSugerencias(rif)
      }
    } catch (err) {
      setError('Error al buscar proveedor')
      console.error('Error buscando proveedor:', err)
    } finally {
      setLoading(false)
    }
  }

  const buscarSugerencias = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await proveedorService.searchProveedores(term.trim())
      
      if (result.data) {
        // Ordenar por relevancia
        const suggestionsWithScore = result.data.map(proveedor => ({
          ...proveedor,
          score: calculateRelevanceScore(proveedor, term)
        })).sort((a, b) => b.score - a.score)

        setSuggestions(suggestionsWithScore)
        setShowSuggestions(suggestionsWithScore.length > 0)
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (err) {
      setError('Error al buscar proveedores')
      console.error('Error buscando proveedores:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateRelevanceScore = (proveedor: ProveedorWithCuentas, term: string): number => {
    const searchTerm = term.toLowerCase()
    let score = 0

    // Coincidencia exacta en RIF (máxima prioridad)
    if (proveedor.rif.toLowerCase() === searchTerm) score += 100

    // Coincidencia parcial en RIF
    if (proveedor.rif.toLowerCase().includes(searchTerm)) score += 50

    // Coincidencia exacta en nombre
    if (proveedor.nombre.toLowerCase() === searchTerm) score += 80

    // Coincidencia al inicio del nombre
    if (proveedor.nombre.toLowerCase().startsWith(searchTerm)) score += 60

    // Coincidencia parcial en nombre
    if (proveedor.nombre.toLowerCase().includes(searchTerm)) score += 30

    // Coincidencia en contacto
    if (proveedor.contacto && proveedor.contacto.toLowerCase().includes(searchTerm)) score += 20

    return score
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setSelectedProveedor(null)
    setError(null)

    // Limpiar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Si está vacío, limpiar todo
    if (!value.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Debounce para búsqueda
    debounceRef.current = setTimeout(() => {
      // Si parece un RIF (formato J-12345678-9), buscar exacto primero
      const rifPattern = /^[VEJG]-?\d{8}-?\d?$/i
      if (rifPattern.test(value.replace(/\s/g, ''))) {
        buscarProveedorPorRif(value)
      } else {
        buscarSugerencias(value)
      }
    }, 300)
  }

  const handleSuggestionSelect = (proveedor: ProveedorSuggestion) => {
    setSelectedProveedor(proveedor)
    setSearchTerm(proveedor.nombre)
    setShowSuggestions(false)
    onProveedorSelect(proveedor)
  }

  const handleProveedorCreated = (proveedor: ProveedorWithCuentas) => {
    setShowProveedorModal(false)
    setSelectedProveedor(proveedor)
    setSearchTerm(proveedor.nombre)
    onProveedorSelect(proveedor)
  }

  const clearSelection = () => {
    setSelectedProveedor(null)
    setSearchTerm('')
    setSuggestions([])
    setShowSuggestions(false)
    setError(null)
    searchInputRef.current?.focus()
  }

  const getStatusIcon = () => {
    if (loading) {
      return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
    }
    if (selectedProveedor) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    }
    if (error) {
      return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
    }
    return <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
  }

  const searchComponent = (
    <div className={`relative ${className}`}>
      {/* Campo de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getStatusIcon()}
        </div>
        
        <Input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="pl-10 pr-20"
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedProveedor && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
              title="Limpiar selección"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          
          {allowCreate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProveedorModal(true)}
              className="mr-2"
              title="Crear nuevo proveedor"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Información del proveedor seleccionado */}
      {selectedProveedor && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-5 w-5 text-green-500 mr-2" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900 truncate">
                {selectedProveedor.nombre}
              </p>
              <p className="text-sm text-green-700">
                RIF: {selectedProveedor.rif} • Retención: {selectedProveedor.porcentaje_retencion}%
              </p>
              {selectedProveedor.cuentas_bancarias && selectedProveedor.cuentas_bancarias.length > 0 && (
                <p className="text-xs text-green-600">
                  {selectedProveedor.cuentas_bancarias.length === 1 
                    ? `Banco: ${selectedProveedor.cuentas_bancarias[0].banco_nombre || 'N/A'}`
                    : `${selectedProveedor.cuentas_bancarias.length} cuentas bancarias`
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="py-1">
            {suggestions.map((proveedor) => (
              <button
                key={proveedor.id}
                type="button"
                onClick={() => handleSuggestionSelect(proveedor)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              >
                <div className="flex items-center">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {proveedor.nombre}
                    </p>
                    <p className="text-sm text-gray-500">
                      {proveedor.rif}
                    </p>
                    {proveedor.contacto && (
                      <p className="text-xs text-gray-400">
                        Contacto: {proveedor.contacto}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {proveedor.porcentaje_retencion}% ret.
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Opción para crear nuevo */}
          {allowCreate && searchTerm.trim() && !selectedProveedor && (
            <div className="border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowProveedorModal(true)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
              >
                <div className="flex items-center">
                  <PlusIcon className="h-5 w-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Crear nuevo proveedor
                    </p>
                    <p className="text-xs text-blue-700">
                      No se encontraron coincidencias para "{searchTerm}"
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para crear proveedor */}
      {showProveedorModal && (
        <ProveedorModalNew
          isOpen={true}
          onClose={() => setShowProveedorModal(false)}
          onSave={async (data: ProveedorFormData) => {
            try {
              const { data: newProveedor, error } = await proveedorService.createProveedorWithCuentas(data)
              if (error) {
                console.error('Error creando proveedor:', error)
                return
              }
              if (newProveedor) {
                handleProveedorCreated(newProveedor)
              }
            } catch (error) {
              console.error('Error creando proveedor:', error)
            }
          }}
          initialRif={searchTerm.includes('-') ? searchTerm : ''}
        />
      )}
    </div>
  )

  // Si es modal, envolver en Modal
  if (showAsModal && onClose) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Buscar Proveedor
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              {searchComponent}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return searchComponent
}