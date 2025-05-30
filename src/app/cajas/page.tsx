// src/app/cajas/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CajaControl } from '@/components/cajas/CajaControl'
import { PagoMovilForm } from '@/components/cajas/PagoMovilForm'
import { PagoMovilList } from '@/components/cajas/PagoMovilList'
import { TicketModal } from '@/components/cajas/TicketModal'
import { cajaService } from '@/lib/services/cajaService'
import { CajaUI, PagoMovilUI, ReporteCaja } from '@/types/caja'
import { 
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CajasPage() {
  const { user, company } = useAuth()
  const [caja, setCaja] = useState<CajaUI | null>(null)
  const [pagosMovil, setPagosMovil] = useState<PagoMovilUI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingPago, setEditingPago] = useState<PagoMovilUI | null>(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [reporteActual, setReporteActual] = useState<ReporteCaja | null>(null)

  // Cargar caja actual al montar el componente
  useEffect(() => {
    if (user && company) {
      cargarCajaActual()
    }
  }, [user, company])

  const cargarCajaActual = async () => {
    if (!user || !company) return

    setLoading(true)
    setError(null)

    try {
      // Verificar si hay una caja abierta para hoy
      const { data: cajaData, error: cajaError } = await cajaService.verificarCajaAbierta(user.id)

      if (cajaError) {
        setError('Error al verificar caja: ' + cajaError.message)
        return
      }

      if (cajaData) {
        setCaja(cajaData)
        
        // Si hay caja abierta, cargar sus pagos móviles
        const { data: cajaConPagos, error: pagosError } = await cajaService.getCajaConPagos(cajaData.id!)
        
        if (pagosError) {
          setError('Error al cargar pagos: ' + pagosError.message)
        } else if (cajaConPagos?.pagosMovil) {
          setPagosMovil(cajaConPagos.pagosMovil)
        }
      }
    } catch (err: any) {
      setError('Error al cargar caja: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirCaja = async (montoApertura: number) => {
    if (!user || !company) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data: nuevaCaja, error: abrirError } = await cajaService.abrirCaja(
        user.id,
        company.id,
        montoApertura
      )

      if (abrirError) {
        setError('Error al abrir caja: ' + abrirError.message)
        return
      }

      if (nuevaCaja) {
        setCaja(nuevaCaja)
        setPagosMovil([])
        setSuccessMessage('Caja abierta exitosamente')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      setError('Error al abrir caja: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCerrarCaja = async (montoCierre: number, observaciones?: string) => {
    if (!caja?.id) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { data: cajaCerrada, error: cerrarError } = await cajaService.cerrarCaja(
        caja.id,
        montoCierre,
        observaciones
      )

      if (cerrarError) {
        setError('Error al cerrar caja: ' + cerrarError.message)
        return
      }

      if (cajaCerrada) {
        setCaja(cajaCerrada)
        setSuccessMessage('Caja cerrada exitosamente')
        
        // Generar reporte automáticamente
        await handleGenerarReporte()
        
        setTimeout(() => {
          setSuccessMessage(null)
          // Recargar la página para mostrar el formulario de apertura
          cargarCajaActual()
        }, 3000)
      }
    } catch (err: any) {
      setError('Error al cerrar caja: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarPago = async (data: { monto: number; nombreCliente: string; telefono: string; numeroReferencia: string }) => {
    if (!caja?.id || !user || !company) return

    setError(null)
    setSuccessMessage(null)

    try {
      if (editingPago) {
        // Actualizar pago existente
        const { data: pagoActualizado, error: updateError } = await cajaService.actualizarPagoMovil(
          editingPago.id!,
          data
        )

        if (updateError) {
          setError('Error al actualizar pago: ' + updateError.message)
          return
        }

        if (pagoActualizado) {
          setPagosMovil(pagosMovil.map(p => 
            p.id === editingPago.id ? pagoActualizado : p
          ))
          setEditingPago(null)
          setSuccessMessage('Pago actualizado exitosamente')
          
          // Actualizar totales de la caja
          await cargarCajaActual()
        }
      } else {
        // Crear nuevo pago
        const nuevoPago: Omit<PagoMovilUI, 'id' | 'fechaHora'> = {
          cajaId: caja.id,
          monto: data.monto,
          nombreCliente: data.nombreCliente,
          telefono: data.telefono,
          numeroReferencia: data.numeroReferencia,
          userId: user.id,
          companyId: company.id
        }

        const { data: pagoCreado, error: createError } = await cajaService.agregarPagoMovil(nuevoPago)

        if (createError) {
          setError('Error al agregar pago: ' + createError.message)
          return
        }

        if (pagoCreado) {
          setPagosMovil([...pagosMovil, pagoCreado])
          setSuccessMessage('Pago agregado exitosamente')
          
          // Actualizar totales de la caja
          await cargarCajaActual()
        }
      }

      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Error al procesar pago: ' + err.message)
    }
  }

  const handleEditarPago = (pago: PagoMovilUI) => {
    setEditingPago(pago)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEliminarPago = async (pagoId: string) => {
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: deleteError } = await cajaService.eliminarPagoMovil(pagoId)

      if (deleteError) {
        setError('Error al eliminar pago: ' + deleteError.message)
        return
      }

      setPagosMovil(pagosMovil.filter(p => p.id !== pagoId))
      setSuccessMessage('Pago eliminado exitosamente')
      
      // Actualizar totales de la caja
      await cargarCajaActual()
      
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setError('Error al eliminar pago: ' + err.message)
    }
  }

  const handleGenerarReporte = async () => {
    if (!caja?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data: reporte, error: reporteError } = await cajaService.generarReporteCaja(caja.id)

      if (reporteError) {
        setError('Error al generar reporte: ' + reporteError.message)
        return
      }

      if (reporte) {
        setReporteActual(reporte)
        setShowTicketModal(true)
      }
    } catch (err: any) {
      setError('Error al generar reporte: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelarEdicion = () => {
    setEditingPago(null)
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
              Control de pagos móviles del día
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
              onClick={() => setError(null)}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-6">
              {/* Control de caja */}
              <CajaControl
                caja={caja}
                onAbrirCaja={handleAbrirCaja}
                onCerrarCaja={handleCerrarCaja}
                loading={loading}
              />

              {/* Formulario de pago móvil (solo si la caja está abierta) */}
              {caja?.estado === 'abierta' && (
                <PagoMovilForm
                  onSubmit={handleAgregarPago}
                  loading={loading}
                  editingPago={editingPago}
                  onCancelEdit={handleCancelarEdicion}
                />
              )}
            </div>

            {/* Columna derecha - Lista de pagos */}
            <div className="space-y-6">
              {caja?.estado === 'abierta' ? (
                <PagoMovilList
                  pagosMovil={pagosMovil}
                  onEdit={handleEditarPago}
                  onDelete={handleEliminarPago}
                  loading={loading}
                />
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <BanknotesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {caja?.estado === 'cerrada' 
                        ? 'La caja está cerrada'
                        : 'Abre la caja para registrar pagos móviles'
                      }
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal del ticket */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false)
          setReporteActual(null)
        }}
        reporte={reporteActual}
      />
    </MainLayout>
  )
}