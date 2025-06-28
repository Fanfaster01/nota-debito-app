'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { creditoService } from '@/lib/services/creditoService'
import { CreditoDetalladoUI, FiltrosCredito, ResumenCreditos } from '@/types/creditos'
import { useAsyncState, useAsyncList } from '@/hooks/useAsyncState'
import CreditosFilters from '@/components/creditos/CreditosFilters'
import CreditosList from '@/components/creditos/CreditosList'
import CreditoDetailModal from '@/components/creditos/CreditoDetailModal'
import CreditoEditModal from '@/components/creditos/CreditoEditModal'
import AbonoModal from '@/components/creditos/AbonoModal'
import ResumenCreditosCard from '@/components/creditos/ResumenCreditosCard'
import DashboardAnalitico from '@/components/creditos/DashboardAnalitico'
import { Button } from '@/components/ui/Button'
import { 
  DocumentArrowDownIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { exportCreditosToExcel } from '@/utils/exportCreditosExcel'
import { generateCreditosPDF } from '@/utils/pdfGenerator'

export default function VentasCreditoPage() {
  const { user } = useAuth()
  
  // Estados con useAsyncState
  const { data: creditos, loading: creditosLoading, error: creditosError, execute: loadCreditosData } = useAsyncList<CreditoDetalladoUI>()
  const { data: resumen, loading: resumenLoading, error: resumenError, execute: loadResumenData } = useAsyncState<ResumenCreditos | null>()
  
  // Estados locales para UI
  const [activeTab, setActiveTab] = useState<'lista' | 'dashboard'>('lista')
  const [filters, setFilters] = useState<FiltrosCredito>({
    estado: 'todos',
    estadoVencimiento: 'todos'
  })
  
  // Loading y error consolidados
  const loading = creditosLoading || resumenLoading
  const error = creditosError || resumenError
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Modales
  const [selectedCredito, setSelectedCredito] = useState<CreditoDetalladoUI | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAbonoModal, setShowAbonoModal] = useState(false)

  // Verificar permisos
  const canAccess = user?.role === 'master' || user?.role === 'admin'
  const isMaster = user?.role === 'master'

  useEffect(() => {
    if (canAccess) {
      loadCreditos()
      loadResumen()
    }
  }, [filters, user])

  const loadCreditos = async () => {
    if (!user) return

    const filtrosAplicados = {
      ...filters,
      companyId: isMaster ? filters.companyId : user.company_id!
    }

    await loadCreditosData(async () => {
      const { data, error } = await creditoService.getCreditos(filtrosAplicados)
      
      if (error) {
        console.error('Error cargando créditos:', error)
        return []
      }
      
      return data || []
    })
  }

  const loadResumen = async () => {
    if (!user) return

    const companyId = isMaster ? undefined : user.company_id!
    
    await loadResumenData(async () => {
      const { data, error } = await creditoService.getResumenCreditos(companyId)
      
      if (error) {
        console.error('Error cargando resumen:', error)
        return null
      }
      
      return data
    })
  }

  const handleFilterChange = (newFilters: FiltrosCredito) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleViewDetail = (credito: CreditoDetalladoUI) => {
    setSelectedCredito(credito)
    setShowDetailModal(true)
  }

  const handleEdit = (credito: CreditoDetalladoUI) => {
    setSelectedCredito(credito)
    setShowEditModal(true)
  }

  const handleAbono = (credito: CreditoDetalladoUI) => {
    setSelectedCredito(credito)
    setShowAbonoModal(true)
  }

  const handleExportExcel = async () => {
    if (!creditos || creditos.length === 0) {
      alert('No hay créditos para exportar')
      return
    }
    
    try {
      exportCreditosToExcel(creditos, filters)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al generar el archivo Excel')
    }
  }

  const handlePrintReport = () => {
    if (!creditos || creditos.length === 0) {
      alert('No hay créditos para imprimir')
      return
    }
    
    try {
      generateCreditosPDF(creditos, filters)
    } catch (error) {
      console.error('Error al generar PDF:', error)
      alert('Error al generar el reporte PDF')
    }
  }

  // Calcular items para paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = creditos?.slice(indexOfFirstItem, indexOfLastItem) || []
  const totalPages = Math.ceil((creditos?.length || 0) / itemsPerPage)

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas a Crédito</h1>
            <p className="text-gray-600 mt-1">
              Gestión completa de créditos y cobros
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              className="flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintReport}
              className="flex items-center"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Imprimir Reporte
            </Button>
            <Button
              onClick={loadCreditos}
              className="flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Resumen */}
        {resumen && <ResumenCreditosCard resumen={resumen} />}

        {/* Pestañas */}
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
              Lista de Créditos
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard Analítico
            </button>
          </nav>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === 'lista' ? (
          <>
            {/* Filtros */}
            <CreditosFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              isMaster={isMaster}
            />

            {/* Lista de créditos */}
            <CreditosList
              creditos={currentItems}
              loading={loading}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onAbono={handleAbono}
              onRefresh={loadCreditos}
            />

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <DashboardAnalitico />
        )}

        {/* Modales */}
        {selectedCredito && (
          <>
            <CreditoDetailModal
              credito={selectedCredito}
              isOpen={showDetailModal}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedCredito(null)
              }}
              onEdit={() => {
                setShowDetailModal(false)
                setShowEditModal(true)
              }}
              onAbono={() => {
                setShowDetailModal(false)
                setShowAbonoModal(true)
              }}
            />

            <CreditoEditModal
              credito={selectedCredito}
              isOpen={showEditModal}
              onClose={() => {
                setShowEditModal(false)
                setSelectedCredito(null)
              }}
              onSuccess={() => {
                setShowEditModal(false)
                setSelectedCredito(null)
                loadCreditos()
              }}
            />

            <AbonoModal
              credito={selectedCredito}
              isOpen={showAbonoModal}
              onClose={() => {
                setShowAbonoModal(false)
                setSelectedCredito(null)
              }}
              onSuccess={() => {
                setShowAbonoModal(false)
                setSelectedCredito(null)
                loadCreditos()
                loadResumen()
              }}
            />
          </>
        )}
      </div>
    </MainLayout>
  )
}