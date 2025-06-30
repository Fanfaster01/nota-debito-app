'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentPlusIcon
} from '@heroicons/react/24/outline'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import type { 
  FacturaCuentaPorPagar, 
  FiltrosCuentasPorPagar,
  PaginacionFacturas,
  EstadoPago,
  TipoPago
} from '@/types/cuentasPorPagar'

// Importar modales que crearemos
import { ModalDetalleFactura } from './ModalDetalleFactura'
import { ModalGenerarRecibo } from './ModalGenerarRecibo'
import { ModalNotaCredito } from './ModalNotaCredito'

interface ListaFacturasCuentasPorPagarProps {
  companyId?: string
  onFacturaUpdated: () => void
}

export function ListaFacturasCuentasPorPagar({ 
  companyId, 
  onFacturaUpdated 
}: ListaFacturasCuentasPorPagarProps) {
  const [paginacion, setPaginacion] = useState<PaginacionFacturas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Filtros siempre visibles - ya no necesitamos el estado
  
  // Estados de filtros
  const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>({})
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  
  // Estados de selección múltiple
  const [facturasSeleccionadas, setFacturasSeleccionadas] = useState<Set<string>>(new Set())
  const [seleccionarTodas, setSeleccionarTodas] = useState(false)
  
  // Estados de modales
  const [facturaDetalle, setFacturaDetalle] = useState<FacturaCuentaPorPagar | null>(null)
  const [mostrarModalRecibo, setMostrarModalRecibo] = useState(false)
  const [facturaNotaCredito, setFacturaNotaCredito] = useState<FacturaCuentaPorPagar | null>(null)

  useEffect(() => {
    if (companyId) {
      cargarFacturas()
    }
  }, [companyId, filtros, page])

  const cargarFacturas = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    try {
      const result = await cuentasPorPagarService.getFacturas(companyId, filtros, page, limit)
      if (result.error) {
        setError(result.error)
      } else {
        setPaginacion(result.data)
      }
    } catch (err) {
      setError('Error al cargar las facturas')
      console.error('Error cargando facturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltroChange = (campo: keyof FiltrosCuentasPorPagar, valor: FiltrosCuentasPorPagar[keyof FiltrosCuentasPorPagar]) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor || undefined
    }))
    setPage(1) // Resetear a la primera página al filtrar
  }

  const limpiarFiltros = () => {
    setFiltros({})
    setPage(1)
  }

  const handleSeleccionarFactura = (facturaId: string, seleccionada: boolean) => {
    const nuevasSeleccionadas = new Set(facturasSeleccionadas)
    if (seleccionada) {
      nuevasSeleccionadas.add(facturaId)
    } else {
      nuevasSeleccionadas.delete(facturaId)
    }
    setFacturasSeleccionadas(nuevasSeleccionadas)
    
    // Actualizar estado de "seleccionar todas"
    const totalFacturas = paginacion?.facturas.length || 0
    setSeleccionarTodas(nuevasSeleccionadas.size === totalFacturas && totalFacturas > 0)
  }

  const handleSeleccionarTodas = (seleccionar: boolean) => {
    if (seleccionar && paginacion?.facturas) {
      const todasIds = new Set(paginacion.facturas.map(f => f.id))
      setFacturasSeleccionadas(todasIds)
    } else {
      setFacturasSeleccionadas(new Set())
    }
    setSeleccionarTodas(seleccionar)
  }

  const getEstadoColor = (estado: EstadoPago) => {
    switch (estado) {
      case 'vencida':
        return 'bg-red-100 text-red-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'pagada':
        return 'bg-green-100 text-green-800'
      case 'pendiente_aprobacion':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: EstadoPago) => {
    switch (estado) {
      case 'vencida':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      case 'pendiente':
        return <ClockIcon className="h-4 w-4" />
      case 'pagada':
        return <CheckIcon className="h-4 w-4" />
      case 'pendiente_aprobacion':
        return <CurrencyDollarIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-VE')
  }

  const getDiasVencimiento = (diasVencimiento?: number) => {
    if (diasVencimiento === undefined) return '-'
    if (diasVencimiento < 0) return `Vencida (${Math.abs(diasVencimiento)} días)`
    if (diasVencimiento === 0) return 'Vence hoy'
    if (diasVencimiento <= 7) return `${diasVencimiento} días`
    return `${diasVencimiento} días`
  }

  const puedenPagarse = () => {
    if (facturasSeleccionadas.size === 0) return false
    const facturas = paginacion?.facturas.filter(f => facturasSeleccionadas.has(f.id)) || []
    return facturas.every(f => f.estadoPago === 'pendiente' || f.estadoPago === 'vencida')
  }

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda siempre visibles */}
      <Card>
        <div className="p-6 space-y-6">
          {/* Búsqueda y botones en la parte superior */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Búsqueda */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número de factura o proveedor..."
                  value={filtros.busqueda || ''}
                  onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center space-x-3">
              {facturasSeleccionadas.size > 0 && (
                <Button
                  onClick={() => setMostrarModalRecibo(true)}
                  disabled={!puedenPagarse()}
                  className="inline-flex items-center"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Generar Recibo ({facturasSeleccionadas.size})
                </Button>
              )}
            </div>
          </div>

          {/* Filtros siempre visibles */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Estado de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado de Pago
                  </label>
                  <select
                    value={filtros.estadoPago || ''}
                    onChange={(e) => handleFiltroChange('estadoPago', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="vencida">Vencida</option>
                    <option value="pendiente_aprobacion">Pendiente Aprobación</option>
                    <option value="pagada">Pagada</option>
                  </select>
                </div>

                {/* Tipo de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Pago
                  </label>
                  <select
                    value={filtros.tipoPago || ''}
                    onChange={(e) => handleFiltroChange('tipoPago', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="deposito">Depósito</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>

                {/* Fecha desde */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha desde
                  </label>
                  <Input
                    type="date"
                    value={filtros.fechaDesde || ''}
                    onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
                  />
                </div>

                {/* Fecha hasta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha hasta
                  </label>
                  <Input
                    type="date"
                    value={filtros.fechaHasta || ''}
                    onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
                  />
                </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="inline-flex items-center"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de facturas */}
      <Card title={`Facturas (${paginacion?.total || 0})`}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando facturas...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              <ExclamationTriangleIcon className="h-8 w-8 mr-2" />
              <span>{error}</span>
            </div>
          ) : paginacion?.facturas.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <DocumentArrowDownIcon className="h-8 w-8 mr-2" />
              <span>No se encontraron facturas</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={seleccionarTodas}
                      onChange={(e) => handleSeleccionarTodas(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha / Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginacion?.facturas.map((factura) => (
                  <tr key={factura.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={facturasSeleccionadas.has(factura.id)}
                        onChange={(e) => handleSeleccionarFactura(factura.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {factura.numero}
                      </div>
                      <div className="text-sm text-gray-500">
                        Control: {factura.numeroControl}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {factura.proveedorNombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {factura.proveedorRif}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(factura.fecha)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vence: {formatDate(factura.fechaVencimiento)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(factura.montoFinalPagar || factura.total)}
                      </div>
                      <div className="text-sm text-gray-500">
                        USD {factura.montoUSD.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(factura.estadoPago)}`}>
                        {getEstadoIcon(factura.estadoPago)}
                        <span className="ml-1 capitalize">{factura.estadoPago.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${
                        factura.diasVencimiento !== undefined && factura.diasVencimiento < 0 
                          ? 'text-red-600 font-medium' 
                          : factura.diasVencimiento !== undefined && factura.diasVencimiento <= 7
                          ? 'text-yellow-600 font-medium'
                          : 'text-gray-900'
                      }`}>
                        {getDiasVencimiento(factura.diasVencimiento)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setFacturaDetalle(factura)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setFacturaNotaCredito(factura)}
                          className="text-green-600 hover:text-green-900"
                          title="Agregar nota de crédito"
                        >
                          <DocumentPlusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {paginacion && paginacion.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 overflow-x-auto">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(paginacion.totalPages, page + 1))}
                disabled={page === paginacion.totalPages}
              >
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">{((page - 1) * limit) + 1}</span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(page * limit, paginacion.total)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{paginacion.total}</span>{' '}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  {/* Números de página con lógica mejorada para evitar scroll */}
                  {(() => {
                    const totalPages = paginacion.totalPages
                    const current = page
                    const pages: (number | string)[] = []
                    
                    if (totalPages <= 7) {
                      // Si hay 7 páginas o menos, mostrar todas
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      // Si hay más de 7 páginas, usar puntos suspensivos
                      if (current <= 3) {
                        // Estamos cerca del inicio
                        pages.push(1, 2, 3, 4, '...', totalPages)
                      } else if (current >= totalPages - 2) {
                        // Estamos cerca del final
                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                      } else {
                        // Estamos en el medio
                        pages.push(1, '...', current - 1, current, current + 1, '...', totalPages)
                      }
                    }
                    
                    return pages.map((pageNum, index) => {
                      if (pageNum === '...') {
                        return (
                          <span
                            key={`ellipsis-${index}`}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        )
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum as number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            current === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })
                  })()}

                  <button
                    onClick={() => setPage(Math.min(paginacion.totalPages, page + 1))}
                    disabled={page === paginacion.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modales */}
      {facturaDetalle && (
        <ModalDetalleFactura
          factura={facturaDetalle}
          onClose={() => setFacturaDetalle(null)}
          onFacturaUpdated={onFacturaUpdated}
        />
      )}

      {mostrarModalRecibo && (
        <ModalGenerarRecibo
          facturasIds={Array.from(facturasSeleccionadas)}
          companyId={companyId}
          onClose={() => setMostrarModalRecibo(false)}
          onReciboGenerado={() => {
            setMostrarModalRecibo(false)
            setFacturasSeleccionadas(new Set())
            setSeleccionarTodas(false)
            onFacturaUpdated()
            cargarFacturas()
          }}
        />
      )}

      {facturaNotaCredito && (
        <ModalNotaCredito
          factura={facturaNotaCredito}
          onClose={() => setFacturaNotaCredito(null)}
          onNotaCreditoCreada={() => {
            setFacturaNotaCredito(null)
            cargarFacturas()
          }}
        />
      )}
    </div>
  )
}