// src/components/forms/ClienteSearch.tsx
import React, { useState, useEffect, useRef } from 'react'
import { clienteService, ClienteUI } from '@/lib/services/clienteService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { 
  MagnifyingGlassIcon,
  UserPlusIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface ClienteSearchProps {
  onClienteSelect: (cliente: ClienteUI) => void
  defaultValue?: {
    tipoDocumento?: string
    numeroDocumento?: string
    nombre?: string
    telefono?: string
  }
  disabled?: boolean
}

const TIPOS_DOCUMENTO = [
  { value: 'V', label: 'V-' },
  { value: 'E', label: 'E-' },
  { value: 'J', label: 'J-' },
  { value: 'G', label: 'G-' },
  { value: 'P', label: 'P-' }
]

export const ClienteSearch: React.FC<ClienteSearchProps> = ({ 
  onClienteSelect, 
  defaultValue,
  disabled 
}) => {
  const [searchText, setSearchText] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<'V' | 'E' | 'J' | 'G' | 'P'>('V')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [suggestions, setSuggestions] = useState<ClienteUI[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null)
  
  // Formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState<Partial<ClienteUI>>({
    tipoDocumento: 'V',
    numeroDocumento: '',
    nombre: '',
    telefono: '',
    direccion: ''
  })

  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cerrar sugerencias al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (defaultValue?.numeroDocumento) {
      setNumeroDocumento(defaultValue.numeroDocumento)
      if (defaultValue.tipoDocumento) {
        setTipoDocumento(defaultValue.tipoDocumento as 'V' | 'E' | 'J' | 'G' | 'P')
      }
    }
  }, [defaultValue])

  const buscarClientes = async (texto: string) => {
    if (texto.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    const { data, error } = await clienteService.buscarClientes(texto)
    setLoading(false)

    if (!error && data) {
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setNumeroDocumento(value)
    setSelectedCliente(null)

    // Debounce la búsqueda
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      buscarClientes(value)
    }, 300)
  }

  const handleClienteSelect = (cliente: ClienteUI) => {
    setSelectedCliente(cliente)
    setTipoDocumento(cliente.tipoDocumento)
    setNumeroDocumento(cliente.numeroDocumento)
    setSearchText(`${cliente.tipoDocumento}-${cliente.numeroDocumento} - ${cliente.nombre}`)
    setShowSuggestions(false)
    onClienteSelect(cliente)
  }

  const handleCrearCliente = async () => {
    if (!nuevoCliente.numeroDocumento || !nuevoCliente.nombre) {
      return
    }

    setLoading(true)
    
    // Obtener el usuario actual desde Supabase
    const { createClient } = await import('@/utils/supabase/client')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await clienteService.crearCliente({
      ...nuevoCliente as ClienteUI,
      createdBy: user.id
    })

    setLoading(false)

    if (!error && data) {
      handleClienteSelect(data)
      setShowNewClienteForm(false)
      setNuevoCliente({
        tipoDocumento: 'V',
        numeroDocumento: '',
        nombre: '',
        telefono: '',
        direccion: ''
      })
    }
  }

  const handleBuscarPorDocumento = async () => {
    if (!numeroDocumento) return

    setLoading(true)
    const { data, error } = await clienteService.buscarPorDocumento(tipoDocumento, numeroDocumento)
    setLoading(false)

    if (!error && data) {
      handleClienteSelect(data)
    } else {
      // Si no existe, mostrar formulario para crear
      setShowNewClienteForm(true)
      setNuevoCliente({
        ...nuevoCliente,
        tipoDocumento,
        numeroDocumento
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Búsqueda de cliente */}
      <div ref={searchRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Cliente
        </label>
        
        <div className="flex gap-2">
          <select
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value as 'V' | 'E' | 'J' | 'G' | 'P')}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled || !!selectedCliente}
          >
            {TIPOS_DOCUMENTO.map(tipo => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
          
          <div className="flex-1 relative">
            <Input
              type="text"
              value={selectedCliente ? searchText : numeroDocumento}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Número de documento"
              disabled={disabled || !!selectedCliente}
              className="pr-10"
            />
            {selectedCliente && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCliente(null)
                  setSearchText('')
                  setNumeroDocumento('')
                  setSuggestions([])
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <Button
            type="button"
            onClick={handleBuscarPorDocumento}
            disabled={disabled || loading || !numeroDocumento || !!selectedCliente}
            className="flex items-center"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Sugerencias */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((cliente) => (
              <button
                key={cliente.id}
                type="button"
                onClick={() => handleClienteSelect(cliente)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              >
                <div className="font-medium">
                  {cliente.tipoDocumento}-{cliente.numeroDocumento} - {cliente.nombre}
                </div>
                {cliente.telefono && (
                  <div className="text-sm text-gray-600">Tel: {cliente.telefono}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Información del cliente seleccionado */}
      {selectedCliente && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center mb-2">
            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="font-medium text-green-800">Cliente Seleccionado</h4>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Documento:</span> {selectedCliente.tipoDocumento}-{selectedCliente.numeroDocumento}
            </div>
            <div>
              <span className="text-gray-600">Nombre:</span> {selectedCliente.nombre}
            </div>
            {selectedCliente.telefono && (
              <div>
                <span className="text-gray-600">Teléfono:</span> {selectedCliente.telefono}
              </div>
            )}
            {selectedCliente.direccion && (
              <div className="col-span-2">
                <span className="text-gray-600">Dirección:</span> {selectedCliente.direccion}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulario nuevo cliente */}
      {showNewClienteForm && (
        <div className="border border-blue-200 rounded-md p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-blue-800 flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Nuevo Cliente
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowNewClienteForm(false)
                setNuevoCliente({
                  tipoDocumento: 'V',
                  numeroDocumento: '',
                  nombre: '',
                  telefono: '',
                  direccion: ''
                })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento
              </label>
              <div className="flex gap-2">
                <select
                  value={nuevoCliente.tipoDocumento}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoDocumento: e.target.value as 'V' | 'E' | 'J' | 'G' | 'P' })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={disabled}
                >
                  {TIPOS_DOCUMENTO.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                  ))}
                </select>
                <Input
                  type="text"
                  value={nuevoCliente.numeroDocumento}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, numeroDocumento: e.target.value })}
                  placeholder="Número"
                  disabled={disabled}
                />
              </div>
            </div>

            <Input
              label="Nombre Completo"
              type="text"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              placeholder="Nombre del cliente"
              disabled={disabled}
            />

            <Input
              label="Teléfono"
              type="text"
              value={nuevoCliente.telefono || ''}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              placeholder="0412-1234567"
              disabled={disabled}
            />

            <Input
              label="Dirección"
              type="text"
              value={nuevoCliente.direccion || ''}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              placeholder="Dirección corta"
              disabled={disabled}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={handleCrearCliente}
              disabled={disabled || loading || !nuevoCliente.numeroDocumento || !nuevoCliente.nombre}
              className="flex items-center"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              {loading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}