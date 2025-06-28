// src/components/creditos/CreditosFilters.tsx
import React, { useState, useEffect } from 'react'
import { FiltrosCredito } from '@/types/creditos'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ClienteSearch } from '@/components/forms/ClienteSearch'
import { ClienteUI } from '@/lib/services/clienteService'
import { companyService } from '@/lib/services/adminServices'
import { Company } from '@/types/database'
import { 
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface CreditosFiltersProps {
  filters: FiltrosCredito
  onFilterChange: (filters: FiltrosCredito) => void
  isMaster: boolean
}

export default function CreditosFilters({ filters, onFilterChange, isMaster }: CreditosFiltersProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showClienteSearch, setShowClienteSearch] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null)

  useEffect(() => {
    if (isMaster) {
      loadCompanies()
    }
  }, [isMaster])

  const loadCompanies = async () => {
    const { data } = await companyService.getAllCompanies()
    if (data) {
      setCompanies(data)
    }
  }

  const handleDateChange = (field: 'fechaDesde' | 'fechaHasta', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value ? new Date(value) : undefined
    })
  }

  const handleSelectChange = (field: keyof FiltrosCredito, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    })
  }

  const handleClienteSelect = (cliente: ClienteUI) => {
    setSelectedCliente(cliente)
    onFilterChange({
      ...filters,
      clienteId: cliente.id
    })
    setShowClienteSearch(false)
  }

  const clearClienteFilter = () => {
    setSelectedCliente(null)
    onFilterChange({
      ...filters,
      clienteId: undefined
    })
  }

  const clearAllFilters = () => {
    setSelectedCliente(null)
    setShowClienteSearch(false)
    onFilterChange({
      estado: 'todos',
      estadoVencimiento: 'todos'
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
        <Button
          variant="secondary"
          onClick={clearAllFilters}
          className="flex items-center text-sm"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fechas */}
        <Input
          label="Fecha Desde"
          type="date"
          value={filters.fechaDesde ? filters.fechaDesde.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDateChange('fechaDesde', e.target.value)}
        />

        <Input
          label="Fecha Hasta"
          type="date"
          value={filters.fechaHasta ? filters.fechaHasta.toISOString().split('T')[0] : ''}
          onChange={(e) => handleDateChange('fechaHasta', e.target.value)}
        />

        {/* Número de Factura */}
        <Input
          label="Número de Factura"
          type="text"
          placeholder="Buscar por número..."
          value={filters.numeroFactura || ''}
          onChange={(e) => handleSelectChange('numeroFactura', e.target.value)}
        />

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={filters.estado || 'todos'}
            onChange={(e) => handleSelectChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagado">Pagado</option>
          </select>
        </div>

        {/* Estado de Vencimiento */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vencimiento
          </label>
          <select
            value={filters.estadoVencimiento || 'todos'}
            onChange={(e) => handleSelectChange('estadoVencimiento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="vigente">Vigente</option>
            <option value="por_vencer">Por Vencer</option>
            <option value="vencido">Vencido</option>
          </select>
        </div>

        {/* Compañía (solo para Master) */}
        {isMaster && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compañía
            </label>
            <select
              value={filters.companyId || ''}
              onChange={(e) => handleSelectChange('companyId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las compañías</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filtro de Cliente */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Filtrar por Cliente
          </label>
          {selectedCliente && (
            <Button
              variant="secondary"
              onClick={clearClienteFilter}
              className="text-xs px-2 py-1"
            >
              Quitar filtro
            </Button>
          )}
        </div>

        {selectedCliente ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800">
                  {selectedCliente.tipoDocumento}-{selectedCliente.numeroDocumento}
                </p>
                <p className="text-sm text-green-600">{selectedCliente.nombre}</p>
              </div>
              <Button
                variant="secondary"
                onClick={clearClienteFilter}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() => setShowClienteSearch(!showClienteSearch)}
            className="w-full flex items-center justify-center"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Buscar Cliente
          </Button>
        )}

        {showClienteSearch && !selectedCliente && (
          <div className="mt-3 border border-gray-200 rounded-md p-4">
            <ClienteSearch
              onClienteSelect={handleClienteSelect}
            />
          </div>
        )}
      </div>
    </div>
  )
}