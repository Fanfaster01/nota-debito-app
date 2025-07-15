// src/components/depositos/ConsultaDepositos.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Pagination } from '@/components/ui/Pagination'
import { 
  depositosService, 
  bancosDepositosService 
} from '@/lib/services/depositosService'
import { companyService } from '@/lib/services/adminServices'
import { DepositoBancarioUI, BancoDepositoUI, FiltrosDepositos } from '@/types/depositos'
import { Company } from '@/types/database'
import { formatearFecha } from '@/utils/dateUtils'
import { downloadDepositoPDF, previewDepositoPDF } from '@/utils/pdfDepositosBancarios'
import { handleServiceError } from '@/utils/errorHandler'
import { 
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  FunnelIcon,
  UserIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Props {
  onError: (error: string) => void
}

export function ConsultaDepositos({ onError }: Props) {
  const { user, company } = useAuth()
  const [depositos, setDepositos] = useState<DepositoBancarioUI[]>([])
  const [bancos, setBancos] = useState<BancoDepositoUI[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosDepositos>({})
  const [tempFiltros, setTempFiltros] = useState<FiltrosDepositos>({})

  const itemsPerPage = 10

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadDepositos()
  }, [currentPage, filtros])

  const loadInitialData = async () => {
    try {
      // Cargar bancos
      const { data: bancosData, error: bancosError } = await bancosDepositosService.getBancos()
      if (bancosError) {
        onError('Error al cargar bancos: ' + handleServiceError(bancosError, 'Error desconocido'))
        return
      }
      setBancos(bancosData || [])

      // Cargar compañías solo si es Master
      if (user?.role === 'master') {
        const { data: companiesData, error: companiesError } = await companyService.getAllCompanies()
        if (companiesError) {
          onError('Error al cargar compañías: ' + handleServiceError(companiesError, 'Error desconocido'))
          return
        }
        setCompanies(companiesData?.filter(c => c.is_active) || [])
      }
    } catch (err) {
      onError('Error al cargar datos: ' + handleServiceError(err, 'Error desconocido'))
    }
  }

  const loadDepositos = async () => {
    setLoading(true)
    onError('')

    try {
      // Aplicar filtro de compañía automáticamente para usuarios no-master
      const filtrosFinales = { ...filtros }
      if (user?.role !== 'master' && company?.id) {
        filtrosFinales.companyId = company.id
      }

      const { data, error, count } = await depositosService.getDepositos(
        filtrosFinales, 
        currentPage, 
        itemsPerPage
      )

      if (error) {
        onError('Error al cargar depósitos: ' + handleServiceError(error, 'Error desconocido'))
        return
      }

      setDepositos(data || [])
      setTotalItems(count || 0)
    } catch (err) {
      onError('Error al cargar depósitos: ' + handleServiceError(err, 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof FiltrosDepositos, value: FiltrosDepositos[keyof FiltrosDepositos]) => {
    setTempFiltros(prev => ({
      ...prev,
      [key]: value || undefined
    }))
  }

  const applyFilters = () => {
    setFiltros(tempFiltros)
    setCurrentPage(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setTempFiltros({})
    setFiltros({})
    setCurrentPage(1)
    setShowFilters(false)
  }

  const hasActiveFilters = Object.values(filtros).some(value => value !== undefined && value !== '')

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const previewPDF = async (depositoId: string) => {
    try {
      await previewDepositoPDF(depositoId, depositosService.getReciboData.bind(depositosService))
    } catch (err) {
      onError('Error al mostrar vista previa: ' + handleServiceError(err, 'Error desconocido'))
    }
  }

  const handleDelete = async (deposito: DepositoBancarioUI) => {
    const numeroRecibo = deposito.numeroRecibo.toString().padStart(4, '0')
    const confirm = window.confirm(
      `¿Está seguro que desea eliminar el depósito #${numeroRecibo}?\n\n` +
      `Banco: ${deposito.banco?.nombre}\n` +
      `Monto: Bs. ${deposito.montoBs.toLocaleString()}\n` +
      `Fecha: ${formatearFecha(deposito.fechaDeposito)}\n\n` +
      `Esta acción no se puede deshacer.`
    )

    if (!confirm) return

    setDeletingId(deposito.id)
    onError('')

    try {
      const { error } = await depositosService.deleteDeposito(deposito.id)

      if (error) {
        onError('Error al eliminar depósito: ' + handleServiceError(error, 'Error desconocido'))
        return
      }

      // Recargar la lista después de eliminar
      await loadDepositos()
      
      // Mostrar mensaje de éxito
      alert(`Depósito #${numeroRecibo} eliminado correctamente`)
    } catch (err) {
      onError('Error al eliminar depósito: ' + handleServiceError(err, 'Error desconocido'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Consulta de Depósitos</h2>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Filtros aplicados
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            onClick={loadDepositos}
            disabled={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Fecha Desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={tempFiltros.fechaDesde ? formatDate(tempFiltros.fechaDesde) : ''}
                  onChange={(e) => handleFilterChange('fechaDesde', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fecha Hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={tempFiltros.fechaHasta ? formatDate(tempFiltros.fechaHasta) : ''}
                  onChange={(e) => handleFilterChange('fechaHasta', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Banco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <BuildingLibraryIcon className="h-4 w-4 inline mr-1" />
                  Banco
                </label>
                <select
                  value={tempFiltros.bancoId || ''}
                  onChange={(e) => handleFilterChange('bancoId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos los bancos</option>
                  {bancos.map((banco) => (
                    <option key={banco.id} value={banco.id}>
                      {banco.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compañía (solo Master) */}
              {user?.role === 'master' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                    Empresa
                  </label>
                  <select
                    value={tempFiltros.companyId || ''}
                    onChange={(e) => handleFilterChange('companyId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las empresas</option>
                    {companies.map((comp) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={clearFilters}>
                Limpiar
              </Button>
              <Button onClick={applyFilters}>
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de Depósitos */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando depósitos...</span>
          </div>
        ) : depositos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recibo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  {user?.role === 'master' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depositos.map((deposito) => (
                  <tr key={deposito.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          #{deposito.numeroRecibo.toString().padStart(4, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(deposito.fechaDeposito)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{deposito.banco?.nombre}</div>
                      <div className="text-sm text-gray-500">{deposito.banco?.numeroCuenta}</div>
                    </td>
                    {user?.role === 'master' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{deposito.company?.name}</div>
                        <div className="text-sm text-gray-500">{deposito.company?.rif}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Bs. {deposito.montoBs.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{deposito.usuario?.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewPDF(deposito.id)}
                          className="flex items-center"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(deposito)}
                          disabled={deletingId === deposito.id}
                          className="flex items-center text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          {deletingId === deposito.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay depósitos</h3>
            <p className="text-gray-500 mb-4">
              {hasActiveFilters 
                ? 'No se encontraron depósitos con los filtros aplicados.'
                : 'Aún no se han registrado depósitos bancarios.'
              }
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpiar Filtros
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Paginación */}
      {totalItems > itemsPerPage && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            totalPages={Math.ceil(totalItems / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Información de resultados */}
      {totalItems > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} depósitos
        </div>
      )}
    </div>
  )
}