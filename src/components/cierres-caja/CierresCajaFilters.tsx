// src/components/cierres-caja/CierresCajaFilters.tsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FiltrosCierres, cierresCajaService } from '@/lib/services/cierresCajaService'
import { companyService } from '@/lib/services/adminServices'
import { 
  FunnelIcon, 
  XMarkIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
// import { es } from 'date-fns/locale' // Not used

const filtrosSchema = z.object({
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  userId: z.string().optional(),
  conDiscrepancias: z.boolean().optional(),
  montoMin: z.number().optional(),
  montoMax: z.number().optional()
})

type FiltrosFormData = z.infer<typeof filtrosSchema>

interface CierresCajaFiltersProps {
  filters: FiltrosCierres
  onFilterChange: (filters: FiltrosCierres) => void
  isMaster: boolean
  companyId?: string
}

export default function CierresCajaFilters({ 
  filters, 
  onFilterChange, 
  isMaster,
  companyId 
}: CierresCajaFiltersProps) {
  const [cajeros, setCajeros] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    register,
    handleSubmit,
    // watch, // Not used
    setValue,
    reset,
    formState: { errors }
  } = useForm<FiltrosFormData>({
    resolver: zodResolver(filtrosSchema),
    defaultValues: {
      fechaDesde: filters.fechaDesde ? format(filters.fechaDesde, 'yyyy-MM-dd') : '',
      fechaHasta: filters.fechaHasta ? format(filters.fechaHasta, 'yyyy-MM-dd') : '',
      userId: filters.userId || '',
      conDiscrepancias: filters.conDiscrepancias || false,
      montoMin: filters.rangoMonto?.min || undefined,
      montoMax: filters.rangoMonto?.max || undefined
    }
  })

  useEffect(() => {
    loadCajeros()
    if (isMaster) {
      loadCompanies()
    }
  }, [companyId, isMaster])

  const loadCajeros = async () => {
    if (!companyId) return

    const { data } = await cierresCajaService.getCajeros(companyId)
    if (data) {
      setCajeros(data)
    }
  }

  const loadCompanies = async () => {
    const { data } = await companyService.getAllCompanies()
    if (data) {
      setCompanies(data)
    }
  }

  const onSubmit = (data: FiltrosFormData) => {
    const newFilters: FiltrosCierres = {}

    if (data.fechaDesde) {
      newFilters.fechaDesde = new Date(data.fechaDesde)
    }

    if (data.fechaHasta) {
      newFilters.fechaHasta = new Date(data.fechaHasta)
    }

    if (data.userId) {
      newFilters.userId = data.userId
    }

    if (data.conDiscrepancias) {
      newFilters.conDiscrepancias = data.conDiscrepancias
    }

    if (data.montoMin || data.montoMax) {
      newFilters.rangoMonto = {
        min: data.montoMin,
        max: data.montoMax
      }
    }

    // Para master users, incluir el filtro de compañía si está seleccionado
    if (isMaster && filters.companyId) {
      newFilters.companyId = filters.companyId
    } else if (!isMaster && companyId) {
      newFilters.companyId = companyId
    }

    onFilterChange(newFilters)
  }

  const handleClearFilters = () => {
    reset({
      fechaDesde: '',
      fechaHasta: '',
      userId: '',
      conDiscrepancias: false,
      montoMin: undefined,
      montoMax: undefined
    })

    const clearedFilters: FiltrosCierres = {}
    if (!isMaster && companyId) {
      clearedFilters.companyId = companyId
    }
    onFilterChange(clearedFilters)
  }

  const handleCompanyChange = (companyId: string) => {
    const updatedFilters = { ...filters, companyId: companyId || undefined }
    onFilterChange(updatedFilters)
    
    if (companyId) {
      // Recargar cajeros para la nueva compañía
      cierresCajaService.getCajeros(companyId).then(({ data }) => {
        if (data) setCajeros(data)
      })
    } else {
      setCajeros([])
    }
  }

  const handleQuickDateFilter = (days: number) => {
    const hoy = new Date()
    const fechaDesde = new Date()
    fechaDesde.setDate(hoy.getDate() - days)

    setValue('fechaDesde', format(fechaDesde, 'yyyy-MM-dd'))
    setValue('fechaHasta', format(hoy, 'yyyy-MM-dd'))
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Filtros Básicos' : 'Filtros Avanzados'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Compañía (solo para master users) */}
          {isMaster && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compañía
              </label>
              <select
                value={filters.companyId || ''}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las compañías</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.rif})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fecha desde */}
          <Input
            label="Fecha Desde"
            type="date"
            {...register('fechaDesde')}
            error={errors.fechaDesde?.message}
          />

          {/* Fecha hasta */}
          <Input
            label="Fecha Hasta"
            type="date"
            {...register('fechaHasta')}
            error={errors.fechaHasta?.message}
          />

          {/* Usuario cajero */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <UserIcon className="h-4 w-4 inline mr-1" />
              Cajero
            </label>
            <select
              {...register('userId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los cajeros</option>
              {cajeros.map(cajero => (
                <option key={cajero.id} value={cajero.id}>
                  {cajero.full_name || cajero.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros rápidos de fecha */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 font-medium mr-2">Filtros rápidos:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDateFilter(7)}
          >
            Últimos 7 días
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDateFilter(30)}
          >
            Último mes
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleQuickDateFilter(90)}
          >
            Últimos 3 meses
          </Button>
        </div>

        {/* Filtros avanzados */}
        {showAdvanced && (
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h4 className="text-md font-medium text-gray-900">Filtros Avanzados</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Solo discrepancias */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('conDiscrepancias')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  <ExclamationTriangleIcon className="h-4 w-4 inline mr-1 text-orange-500" />
                  Solo con discrepancias
                </label>
              </div>

              {/* Monto mínimo */}
              <Input
                label="Monto Mínimo (Bs)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('montoMin', { valueAsNumber: true })}
                error={errors.montoMin?.message}
              />

              {/* Monto máximo */}
              <Input
                label="Monto Máximo (Bs)"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('montoMax', { valueAsNumber: true })}
                error={errors.montoMax?.message}
              />
            </div>
          </div>
        )}

        {/* Botón de aplicar filtros */}
        <div className="flex justify-end">
          <Button type="submit">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Aplicar Filtros
          </Button>
        </div>
      </form>
    </Card>
  )
}