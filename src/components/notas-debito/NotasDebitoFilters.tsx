// src/components/notas-debito/NotasDebitoFilters.tsx
import React from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

interface NotasDebitoFilters {
  fechaDesde?: string
  fechaHasta?: string
  proveedor?: string
  numeroNota?: string
  numeroFactura?: string
}

interface NotasDebitoFiltersProps {
  filters: NotasDebitoFilters
  onFilterChange: (filters: NotasDebitoFilters) => void
  onSearch: () => void
  onClear: () => void
  loading?: boolean
}

export const NotasDebitoFilters: React.FC<NotasDebitoFiltersProps> = ({
  filters,
  onFilterChange,
  onSearch,
  onClear,
  loading
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
        Filtros de búsqueda
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Fecha desde"
          type="date"
          value={filters.fechaDesde || ''}
          onChange={(e) => onFilterChange({ ...filters, fechaDesde: e.target.value })}
          disabled={loading}
        />
        
        <Input
          label="Fecha hasta"
          type="date"
          value={filters.fechaHasta || ''}
          onChange={(e) => onFilterChange({ ...filters, fechaHasta: e.target.value })}
          disabled={loading}
        />
        
        <Input
          label="Proveedor (nombre o RIF)"
          placeholder="Buscar por nombre o RIF..."
          value={filters.proveedor || ''}
          onChange={(e) => onFilterChange({ ...filters, proveedor: e.target.value })}
          disabled={loading}
        />
        
        <Input
          label="Número de nota"
          placeholder="Ej: 202501-000001"
          value={filters.numeroNota || ''}
          onChange={(e) => onFilterChange({ ...filters, numeroNota: e.target.value })}
          disabled={loading}
        />
        
        <Input
          label="Número de factura"
          placeholder="Buscar por factura..."
          value={filters.numeroFactura || ''}
          onChange={(e) => onFilterChange({ ...filters, numeroFactura: e.target.value })}
          disabled={loading}
        />
        
        <div className="flex items-end space-x-2">
          <Button 
            onClick={onSearch} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Buscando...
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Buscar
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClear}
            disabled={loading}
            title="Limpiar filtros"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}