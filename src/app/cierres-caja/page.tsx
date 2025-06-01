'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { 
  CierreDetalladoUI, 
  FiltrosCierres, 
  ResumenCierres,
  cierresCajaService 
} from '@/lib/services/cierresCajaService'
import CierresCajaFilters from '@/components/cierres-caja/CierresCajaFilters'
import CierresCajaList from '@/components/cierres-caja/CierresCajaList'
import CierreDetailModal from '@/components/cierres-caja/CierreDetailModal'
import DashboardCierres from '@/components/cierres-caja/DashboardCierres'
import ComparacionCierresModal from '@/components/cierres-caja/ComparacionCierresModal'
import AlertasCierresPanel from '@/components/cierres-caja/AlertasCierresPanel'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  BellIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline'
import { exportCierresListToExcel, exportResumenCierresToExcel } from '@/utils/exportCierresExcel'
import { generateCierresListPDF, generateResumenCierresPDF } from '@/utils/pdfCierres'

export default function CierresCajaPage() {
  const { user } = useAuth()
  const [cierres, setCierres] = useState<CierreDetalladoUI[]>([])
  const [resumen, setResumen] = useState<ResumenCierres | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FiltrosCierres>({})
  const [activeTab, setActiveTab] = useState<'lista' | 'dashboard' | 'alertas'>('lista')
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Modales
  const [selectedCierre, setSelectedCierre] = useState<CierreDetalladoUI | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // Comparación de cierres
  const [selectedForComparison, setSelectedForComparison] = useState<CierreDetalladoUI[]>([])
  const [showComparisonModal, setShowComparisonModal] = useState(false)

  // Verificar permisos
  const canAccess = user?.role === 'master' || user?.role === 'admin'
  const isMaster = user?.role === 'master'

  useEffect(() => {
    if (canAccess) {
      const initialFilters: FiltrosCierres = {}
      if (!isMaster && user?.company_id) {
        initialFilters.companyId = user.company_id
      }
      setFilters(initialFilters)
      loadCierres(initialFilters)
      loadResumen()
    }
  }, [user, canAccess, isMaster])

  const loadCierres = async (filtrosAplicados?: FiltrosCierres) => {
    if (!user) return

    setLoading(true)
    const filtrosFinales = filtrosAplicados || filters

    const { data, error } = await cierresCajaService.getCierresDetallados(filtrosFinales)
    
    if (!error && data) {
      setCierres(data)
    } else {
      console.error('Error cargando cierres:', error)
      setCierres([])
    }
    setLoading(false)
  }

  const loadResumen = async () => {
    if (!user) return

    const companyId = isMaster ? undefined : user.company_id!
    const { data, error } = await cierresCajaService.getResumenCierres(companyId)
    
    if (!error && data) {
      setResumen(data)
    }
  }

  const handleFilterChange = (newFilters: FiltrosCierres) => {
    setFilters(newFilters)
    setCurrentPage(1)
    loadCierres(newFilters)
  }

  const handleViewDetail = (cierre: CierreDetalladoUI) => {
    setSelectedCierre(cierre)
    setShowDetailModal(true)
  }

  const handleCompareToggle = (cierre: CierreDetalladoUI) => {
    setSelectedForComparison(prev => {
      const isSelected = prev.some(c => c.caja.id === cierre.caja.id)
      if (isSelected) {
        return prev.filter(c => c.caja.id !== cierre.caja.id)
      } else {
        if (prev.length >= 2) {
          // Reemplazar el primero si ya hay 2 seleccionados
          return [prev[1], cierre]
        }
        return [...prev, cierre]
      }
    })
  }

  const handleShowComparison = () => {
    if (selectedForComparison.length === 2) {
      setShowComparisonModal(true)
    }
  }

  const handleExportExcel = async () => {
    if (cierres.length === 0) {
      alert('No hay cierres para exportar')
      return
    }
    
    try {
      exportCierresListToExcel(cierres, filters)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al generar el archivo Excel')
    }
  }

  const handleExportResumen = async () => {
    if (!resumen) {
      alert('No hay datos de resumen para exportar')
      return
    }
    
    try {
      exportResumenCierresToExcel(resumen)
    } catch (error) {
      console.error('Error al exportar resumen:', error)
      alert('Error al generar el archivo de resumen')
    }
  }

  const handleExportPDF = async () => {
    if (cierres.length === 0) {
      alert('No hay cierres para exportar')
      return
    }
    
    try {
      const companyName = user?.role === 'master' ? 'Todas las compañías' : (user?.company_id || undefined)
      generateCierresListPDF(cierres, companyName)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el archivo PDF')
    }
  }

  const handleExportResumenPDF = async () => {
    if (!resumen) {
      alert('No hay datos de resumen para exportar')
      return
    }
    
    try {
      generateResumenCierresPDF(resumen)
    } catch (error) {
      console.error('Error al generar PDF de resumen:', error)
      alert('Error al generar el archivo PDF')
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Calcular items para paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = cierres.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(cierres.length / itemsPerPage)

  if (!canAccess) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cierres de Caja</h1>
            <p className="text-gray-600 mt-1">
              Consulta y análisis de cierres de caja realizados
            </p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value === 'excel') handleExportExcel()
                  else if (e.target.value === 'pdf') handleExportPDF()
                  e.target.value = ''
                }}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={cierres.length === 0}
              >
                <option value="">Exportar Lista</option>
                <option value="excel">📊 Excel</option>
                <option value="pdf">📄 PDF</option>
              </select>
              <DocumentArrowDownIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value === 'excel-resumen') handleExportResumen()
                  else if (e.target.value === 'pdf-resumen') handleExportResumenPDF()
                  e.target.value = ''
                }}
                className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!resumen}
              >
                <option value="">Exportar Resumen</option>
                <option value="excel-resumen">📊 Excel</option>
                <option value="pdf-resumen">📄 PDF</option>
              </select>
              <ChartBarIcon className="h-4 w-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {selectedForComparison.length === 2 && (
              <Button
                variant="secondary"
                onClick={handleShowComparison}
                className="flex items-center"
              >
                <Square3Stack3DIcon className="h-4 w-4 mr-2" />
                Comparar ({selectedForComparison.length})
              </Button>
            )}
            <Button
              onClick={() => loadCierres()}
              className="flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen estadístico */}
        {resumen && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cierres</p>
                  <p className="text-2xl font-bold text-gray-900">{resumen.totalCierres}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Con Discrepancias</p>
                  <p className="text-2xl font-bold text-red-600">{resumen.cierresConDiscrepancias}</p>
                  <p className="text-xs text-gray-500">
                    {resumen.totalCierres > 0 ? 
                      `${((resumen.cierresConDiscrepancias / resumen.totalCierres) * 100).toFixed(1)}%` : 
                      '0%'
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Promedio Discrepancia</p>
                  <p className="text-2xl font-bold text-green-600">Bs {formatMoney(resumen.promedioDiscrepancia)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Cierres</p>
                  <p className="text-2xl font-bold text-purple-600">Bs {formatMoney(resumen.montoTotalCierres)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Pestañas de navegación */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lista')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lista'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Lista de Cierres
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline mr-1" />
              Dashboard Analítico
            </button>
            <button
              onClick={() => setActiveTab('alertas')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alertas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="h-4 w-4 inline mr-1" />
              Alertas y Patrones
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'lista' && (
          <>
            {/* Filtros */}
            <CierresCajaFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              isMaster={isMaster}
              companyId={!isMaster ? user?.company_id || undefined : filters.companyId}
            />

            {/* Lista de cierres */}
            <CierresCajaList
              cierres={currentItems}
              loading={loading}
              onViewDetail={handleViewDetail}
              onCompare={handleCompareToggle}
              selectedForComparison={selectedForComparison}
            />

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={cierres.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'dashboard' && (
          <DashboardCierres />
        )}

        {activeTab === 'alertas' && (
          <AlertasCierresPanel onVerDetalle={handleViewDetail} />
        )}

        {/* Modal de detalle */}
        <CierreDetailModal
          cierre={selectedCierre}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedCierre(null)
          }}
        />

        {/* Modal de comparación */}
        <ComparacionCierresModal
          cierres={selectedForComparison}
          isOpen={showComparisonModal}
          onClose={() => {
            setShowComparisonModal(false)
            setSelectedForComparison([])
          }}
        />

        {/* Información de ayuda */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Información sobre los Cierres</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Los cierres muestran la diferencia entre el total del sistema y el efectivo contado</li>
                  <li>Una discrepancia menor a Bs 1.00 se considera &quot;cuadrado&quot;</li>
                  <li>Discrepancias entre Bs 1.00 y Bs 50.00 se consideran aceptables</li>
                  <li>Discrepancias mayores a Bs 50.00 requieren revisión</li>
                  <li>Use los filtros para encontrar cierres específicos o con problemas</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedLayout>
  )
}