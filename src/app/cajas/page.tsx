// src/app/cajas/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAsyncState, useAsyncList } from '@/hooks/useAsyncState'
import { CajaControl } from '@/components/cajas/CajaControl'
import { PagoMovilForm } from '@/components/cajas/PagoMovilForm'
import { PagoMovilList } from '@/components/cajas/PagoMovilList'
import { PagoZelleForm } from '@/components/cajas/PagoZelleForm'
import { PagoZelleList } from '@/components/cajas/PagoZelleList'
import NotaCreditoCajaForm from '@/components/cajas/NotaCreditoCajaForm'
import NotaCreditoCajaList from '@/components/cajas/NotaCreditoCajaList'
import CreditoCajaForm from '@/components/cajas/CreditoCajaForm'
import CreditoCajaList from '@/components/cajas/CreditoCajaList'
import { TicketModal } from '@/components/cajas/TicketModal'
import { cajaService } from '@/lib/services/cajaService'
import { CajaUI, PagoMovilUI, PagoZelleUI, NotaCreditoCajaUI, CreditoCajaUI, ReporteCaja, CierreCajaFormData } from '@/types/caja'
import { handleServiceError } from '@/utils/errorHandler'
import { 
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'

export default function CajasPage() {
  const { user, company } = useAuth()
  
  // Estados con useAsyncState
  const { data: caja, loading: cajaLoading, error: cajaError, execute: loadCaja, reset: resetCaja } = useAsyncState<CajaUI | null>()
  const { data: pagosMovil, loading: movileLoading, error: movilesError, execute: loadPagosMovil, reset: resetPagosMovil } = useAsyncList<PagoMovilUI>()
  const { data: pagosZelle, loading: zelleLoading, error: zelleError, execute: loadPagosZelle, reset: resetPagosZelle } = useAsyncList<PagoZelleUI>()
  const { data: notasCredito, loading: notasLoading, error: notasError, execute: loadNotasCredito, reset: resetNotasCredito } = useAsyncList<NotaCreditoCajaUI>()
  const { data: creditos, loading: creditosLoading, error: creditosError, execute: loadCreditos, reset: resetCreditos } = useAsyncList<CreditoCajaUI>()
  const { data: reporteActual, loading: reporteLoading, error: reporteError, execute: loadReporte } = useAsyncState<ReporteCaja | null>()
  
  // Estados locales para UI
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingPagoMovil, setEditingPagoMovil] = useState<PagoMovilUI | null>(null)
  const [editingPagoZelle, setEditingPagoZelle] = useState<PagoZelleUI | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'movil' | 'zelle' | 'creditos' | 'notasCredito'>('movil')
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Loading y error consolidados
  const loading = cajaLoading || movileLoading || zelleLoading || notasLoading || creditosLoading || reporteLoading
  const error = cajaError || movilesError || zelleError || notasError || creditosError || reporteError || localError

  // Cargar caja actual al montar el componente
  useEffect(() => {
    if (user && company) {
      cargarCajaActual()
    }
  }, [user, company])

  const cargarCajaActual = async () => {
    if (!user || !company) return

    // Cargar caja principal y todos sus datos
    await loadCaja(async () => {
      const { data: cajaData, error: cajaError } = await cajaService.verificarCajaAbierta(user.id)
      if (cajaError) throw new Error('Error al verificar caja: ' + handleServiceError(cajaError))
      
      // Si hay caja abierta, cargar también sus pagos
      if (cajaData?.id) {
        const { data: cajaConPagos, error: pagosError } = await cajaService.getCajaConPagos(cajaData.id)
        if (pagosError) {
          console.warn('Error al cargar pagos:', handleServiceError(pagosError))
        } else if (cajaConPagos) {
          // Actualizar listas usando execute para evitar conflictos de estado
          loadPagosMovil(async () => cajaConPagos.pagosMovil || [])
          loadPagosZelle(async () => cajaConPagos.pagosZelle || [])
          loadNotasCredito(async () => cajaConPagos.notasCredito || [])
          loadCreditos(async () => cajaConPagos.creditos || [])
        }
      }
      
      return cajaData
    })
  }

  const handleAbrirCaja = async (montoApertura: number, montoAperturaUsd: number, tasaDia: number, tipoMoneda: 'USD' | 'EUR') => {
    if (!user || !company) return

    setSuccessMessage(null)

    await loadCaja(async () => {
      const { data: nuevaCaja, error: abrirError } = await cajaService.abrirCaja(
        user.id,
        company.id,
        montoApertura,
        montoAperturaUsd,
        tasaDia,
        tipoMoneda
      )

      if (abrirError) throw new Error('Error al abrir caja: ' + handleServiceError(abrirError))

      // Limpiar listas al abrir nueva caja
      resetPagosMovil()
      resetPagosZelle()
      resetNotasCredito()
      resetCreditos()
      
      setSuccessMessage('Caja abierta exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
      
      return nuevaCaja
    })
  }

  const handleCerrarCaja = async (data: CierreCajaFormData) => {
    if (!caja?.id) return

    setSuccessMessage(null)

    await loadCaja(async () => {
      // Calcular el monto total de cierre
      const totalEfectivoBs = data.efectivoBs + 
        (data.efectivoDolares * caja.tasaDia) + 
        (data.efectivoEuros * caja.tasaDia * 1.1) // Asumiendo tasa EUR/USD de 1.1
      
      const totalPuntoVentaBs = data.cierresPuntoVenta.reduce((sum, cv) => sum + cv.montoBs, 0)
      const montoCierre = totalEfectivoBs + totalPuntoVentaBs

      const { data: cajaCerrada, error: cerrarError } = await cajaService.cerrarCaja(
        caja.id!,
        montoCierre,
        data.observaciones,
        data // Pasar todos los datos del cierre para almacenarlos si es necesario
      )

      if (cerrarError) throw new Error('Error al cerrar caja: ' + handleServiceError(cerrarError))

      setSuccessMessage('Caja cerrada exitosamente')
      
      // Generar reporte automáticamente
      await handleGenerarReporte()
      
      setTimeout(() => {
        setSuccessMessage(null)
        // Recargar la página para mostrar el formulario de apertura
        cargarCajaActual()
      }, 3000)
      
      return cajaCerrada
    })
  }

  const handleActualizarTasa = async (nuevaTasa: number) => {
    if (!caja?.id) return

    setSuccessMessage(null)

    await loadCaja(async () => {
      const { error: updateError } = await cajaService.actualizarTasaDia(caja.id!, nuevaTasa)

      if (updateError) throw new Error('Error al actualizar tasa: ' + handleServiceError(updateError))

      setSuccessMessage('Tasa actualizada exitosamente')
      setTimeout(() => setSuccessMessage(null), 3000)
      
      // Retornar la caja actualizada
      return { ...caja, tasaDia: nuevaTasa }
    })
  }

  // Handlers para Pagos Móviles
  const handleAgregarPagoMovil = async (data: { monto: number; nombreCliente: string; telefono: string; numeroReferencia: string }) => {
    if (!caja?.id || !user || !company) return

    setSuccessMessage(null)

    if (editingPagoMovil) {
      // Actualizar pago existente
      await loadPagosMovil(async () => {
        const { data: pagoActualizado, error: updateError } = await cajaService.actualizarPagoMovil(
          editingPagoMovil.id!,
          data
        )

        if (updateError) throw new Error('Error al actualizar pago: ' + handleServiceError(updateError))

        setEditingPagoMovil(null)
        setSuccessMessage('Pago actualizado exitosamente')
        
        // Actualizar totales de la caja
        await cargarCajaActual()
        
        // Retornar lista actualizada
        return pagosMovil?.map(p => 
          p.id === editingPagoMovil.id ? pagoActualizado! : p
        ) || []
      })
    } else {
      // Crear nuevo pago
      await loadPagosMovil(async () => {
        const nuevoPago: Omit<PagoMovilUI, 'id' | 'fechaHora'> = {
          cajaId: caja.id!,
          monto: data.monto,
          nombreCliente: data.nombreCliente,
          telefono: data.telefono,
          numeroReferencia: data.numeroReferencia,
          userId: user.id,
          companyId: company.id
        }

        const { data: pagoCreado, error: createError } = await cajaService.agregarPagoMovil(nuevoPago)

        if (createError) throw new Error('Error al agregar pago: ' + handleServiceError(createError))

        setSuccessMessage('Pago agregado exitosamente')
        
        // Actualizar totales de la caja
        await cargarCajaActual()
        
        return [...(pagosMovil || []), pagoCreado!]
      })
    }

    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleEditarPagoMovil = (pago: PagoMovilUI) => {
    setEditingPagoMovil(pago)
    setActiveTab('movil')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminarPagoMovil = async (pagoId: string) => {
    setSuccessMessage(null)

    await loadPagosMovil(async () => {
      const { error: deleteError } = await cajaService.eliminarPagoMovil(pagoId)

      if (deleteError) throw new Error('Error al eliminar pago: ' + handleServiceError(deleteError))

      setSuccessMessage('Pago eliminado exitosamente')
      
      // Actualizar totales de la caja
      await cargarCajaActual()
      
      setTimeout(() => setSuccessMessage(null), 3000)
      
      return pagosMovil?.filter(p => p.id !== pagoId) || []
    })
  }

  // Handlers para Pagos Zelle
  const handleAgregarPagoZelle = async (data: { montoUsd: number; tasa: number; nombreCliente: string; telefono: string }) => {
    if (!caja?.id || !user || !company) return

    setSuccessMessage(null)

    if (editingPagoZelle) {
      // Actualizar pago existente
      await loadPagosZelle(async () => {
        const { data: pagoActualizado, error: updateError } = await cajaService.actualizarPagoZelle(
          editingPagoZelle.id!,
          {
            montoUsd: data.montoUsd,
            tasa: data.tasa,
            nombreCliente: data.nombreCliente,
            telefono: data.telefono
          }
        )

        if (updateError) throw new Error('Error al actualizar pago: ' + handleServiceError(updateError))

        setEditingPagoZelle(null)
        setSuccessMessage('Pago actualizado exitosamente')
        
        // Actualizar totales de la caja
        await cargarCajaActual()
        
        return pagosZelle?.map(p => 
          p.id === editingPagoZelle.id ? pagoActualizado! : p
        ) || []
      })
    } else {
      // Crear nuevo pago
      await loadPagosZelle(async () => {
        const nuevoPago: Omit<PagoZelleUI, 'id' | 'fechaHora' | 'montoBs'> = {
          cajaId: caja.id!,
          montoUsd: data.montoUsd,
          tasa: data.tasa,
          nombreCliente: data.nombreCliente,
          telefono: data.telefono,
          userId: user.id,
          companyId: company.id
        }

        const { data: pagoCreado, error: createError } = await cajaService.agregarPagoZelle(nuevoPago)

        if (createError) throw new Error('Error al agregar pago: ' + handleServiceError(createError))

        setSuccessMessage('Pago agregado exitosamente')
        
        // Actualizar totales de la caja
        await cargarCajaActual()
        
        return [...(pagosZelle || []), pagoCreado!]
      })
    }

    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleEditarPagoZelle = (pago: PagoZelleUI) => {
    setEditingPagoZelle(pago)
    setActiveTab('zelle')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminarPagoZelle = async (pagoId: string) => {
    setSuccessMessage(null)

    await loadPagosZelle(async () => {
      const { error: deleteError } = await cajaService.eliminarPagoZelle(pagoId)

      if (deleteError) throw new Error('Error al eliminar pago: ' + handleServiceError(deleteError))

      setSuccessMessage('Pago eliminado exitosamente')
      
      // Actualizar totales de la caja
      await cargarCajaActual()
      
      setTimeout(() => setSuccessMessage(null), 3000)
      
      return pagosZelle?.filter(p => p.id !== pagoId) || []
    })
  }

  const handleGenerarReporte = async () => {
    if (!caja?.id) return

    await loadReporte(async () => {
      const { data: reporte, error: reporteError } = await cajaService.generarReporteCaja(caja.id!)

      if (reporteError) throw new Error('Error al generar reporte: ' + handleServiceError(reporteError))

      setShowTicketModal(true)
      return reporte
    })
  }

  const handleCancelarEdicionMovil = () => {
    setEditingPagoMovil(null)
  }

  const handleCancelarEdicionZelle = () => {
    setEditingPagoZelle(null)
  }

  // Handler para agregar nota de crédito
  const handleAgregarNotaCredito = (nota: NotaCreditoCajaUI) => {
    loadNotasCredito(async () => [...(notasCredito || []), nota])
    setSuccessMessage('Nota de crédito agregada exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Handler para actualizar nota de crédito
  const handleNotaCreditoActualizada = (notaActualizada: NotaCreditoCajaUI) => {
    loadNotasCredito(async () => 
      notasCredito?.map(n => 
        n.id === notaActualizada.id ? notaActualizada : n
      ) || []
    )
    setSuccessMessage('Nota de crédito actualizada exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Handler para eliminar nota de crédito
  const handleNotaCreditoEliminada = (notaId: string) => {
    loadNotasCredito(async () => notasCredito?.filter(n => n.id !== notaId) || [])
    setSuccessMessage('Nota de crédito eliminada exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Handler para agregar crédito
  const handleAgregarCredito = (credito: CreditoCajaUI) => {
    loadCreditos(async () => [...(creditos || []), credito])
    setSuccessMessage('Crédito agregado exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Handler para actualizar crédito
  const handleCreditoActualizado = (creditoActualizado: CreditoCajaUI) => {
    loadCreditos(async () => 
      creditos?.map(c => 
        c.id === creditoActualizado.id ? creditoActualizado : c
      ) || []
    )
    setSuccessMessage('Crédito actualizado exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Handler para eliminar crédito
  const handleCreditoEliminado = (creditoId: string) => {
    loadCreditos(async () => creditos?.filter(c => c.id !== creditoId) || [])
    setSuccessMessage('Crédito eliminado exitosamente')
    setTimeout(() => setSuccessMessage(null), 3000)
    // Actualizar totales de la caja
    cargarCajaActual()
  }

  // Verificar permisos
  if (!user || !company) {
    return (
      <MainLayout>
        <div className="text-center py-8">
          <p className="text-red-600">No tienes acceso a esta sección</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Caja</h1>
            <p className="mt-1 text-sm text-gray-500">
              Control de pagos móviles, transferencias en moneda extranjera, créditos y notas de crédito
            </p>
          </div>
          
          {caja?.estado === 'abierta' && (
            <Button
              onClick={handleGenerarReporte}
              variant="outline"
              className="flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Vista Previa del Reporte
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-600">{error}</p>
            </div>
            <button 
              onClick={() => setLocalError(null)}
              className="ml-3 text-sm text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
            <p className="text-green-600 flex-1">{successMessage}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Control de caja - siempre visible */}
            <CajaControl
              caja={caja}
              onAbrirCaja={handleAbrirCaja}
              onCerrarCaja={handleCerrarCaja}
              onActualizarTasa={handleActualizarTasa}
              loading={loading}
              userName={user?.full_name || user?.email}
            />

            {/* Contenido principal - solo si la caja está abierta */}
            {caja?.estado === 'abierta' && (
              <>
                {/* Tabs para cambiar entre Pagos Móviles y Zelle */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('movil')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === 'movil'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                      Pagos Móviles
                    </button>
                    <button
                      onClick={() => setActiveTab('zelle')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === 'zelle'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Pagos Zelle
                    </button>
                    <button
                      onClick={() => setActiveTab('creditos')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === 'creditos'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Créditos
                    </button>
                    <button
                      onClick={() => setActiveTab('notasCredito')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                        activeTab === 'notasCredito'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Notas de Crédito
                    </button>
                  </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Columna izquierda - Formulario */}
                  <div>
                    {activeTab === 'movil' && (
                      <PagoMovilForm
                        onSubmit={handleAgregarPagoMovil}
                        loading={loading}
                        editingPago={editingPagoMovil}
                        onCancelEdit={handleCancelarEdicionMovil}
                      />
                    )}
                    {activeTab === 'zelle' && (
                      <PagoZelleForm
                        tasaDia={caja.tasaDia}
                        onSubmit={handleAgregarPagoZelle}
                        loading={loading}
                        editingPago={editingPagoZelle}
                        onCancelEdit={handleCancelarEdicionZelle}
                      />
                    )}
                    {activeTab === 'creditos' && (
                      <CreditoCajaForm
                        cajaId={caja.id!}
                        tasaDia={caja.tasaDia}
                        onSuccess={handleAgregarCredito}
                        onCancel={() => {}}
                      />
                    )}
                    {activeTab === 'notasCredito' && (
                      <NotaCreditoCajaForm
                        cajaId={caja.id!}
                        onSuccess={handleAgregarNotaCredito}
                        onCancel={() => {}}
                      />
                    )}
                  </div>

                  {/* Columna derecha - Lista */}
                  <div>
                    {activeTab === 'movil' && (
                      <PagoMovilList
                        pagosMovil={pagosMovil || []}
                        onEdit={handleEditarPagoMovil}
                        onDelete={handleEliminarPagoMovil}
                        loading={loading}
                      />
                    )}
                    {activeTab === 'zelle' && (
                      <PagoZelleList
                        pagosZelle={pagosZelle || []}
                        onEdit={handleEditarPagoZelle}
                        onDelete={handleEliminarPagoZelle}
                        loading={loading}
                      />
                    )}
                    {activeTab === 'creditos' && (
                      <CreditoCajaList
                        creditos={creditos || []}
                        onCreditoActualizado={handleCreditoActualizado}
                        onCreditoEliminado={handleCreditoEliminado}
                      />
                    )}
                    {activeTab === 'notasCredito' && (
                      <NotaCreditoCajaList
                        notasCredito={notasCredito || []}
                        onNotaActualizada={handleNotaCreditoActualizada}
                        onNotaEliminada={handleNotaCreditoEliminada}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Mensaje cuando la caja está cerrada */}
            {caja?.estado === 'cerrada' && (
              <Card>
                <div className="text-center py-12">
                  <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    La caja está cerrada. Abre una nueva caja para registrar pagos.
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal del ticket */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false)
        }}
        reporte={reporteActual}
        allowEdit={caja?.estado === 'abierta'}
        onEditCierre={() => {
          setShowTicketModal(false)
          // El formulario de cierre ya debería estar visible
        }}
      />
    </MainLayout>
  )
}