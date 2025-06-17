'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import {
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ClockIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import { tasasCambioService } from '@/lib/services/tasasCambioService'
import type { 
  FacturaCuentaPorPagar, 
  ValidacionPagoFacturas,
  GenerarReciboRequest,
  GenerarReciboResponse,
  TipoPago,
  FormatoTxtBancario
} from '@/types/cuentasPorPagar'

interface ModalGenerarReciboProps {
  facturasIds: string[]
  companyId?: string
  onClose: () => void
  onReciboGenerado: () => void
}

export function ModalGenerarRecibo({
  facturasIds,
  companyId,
  onClose,
  onReciboGenerado
}: ModalGenerarReciboProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<'validacion' | 'configuracion' | 'procesando' | 'completado'>('validacion')
  const [validacion, setValidacion] = useState<ValidacionPagoFacturas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Configuración del recibo
  const [tipoPago, setTipoPago] = useState<TipoPago>('deposito')
  const [bancoDestino, setBancoDestino] = useState('')
  const [formatoTxtId, setFormatoTxtId] = useState('')
  const [notas, setNotas] = useState('')
  const [tasaManualPAR, setTasaManualPAR] = useState<number | undefined>()
  
  // Datos adicionales
  const [formatosTxt, setFormatosTxt] = useState<FormatoTxtBancario[]>([])
  const [proveedoresConTipoPAR, setProveedoresConTipoPAR] = useState<string[]>([])
  const [proveedoresSinCuenta, setProveedoresSinCuenta] = useState<{ rif: string; nombre: string }[]>([])
  const [reciboGenerado, setReciboGenerado] = useState<GenerarReciboResponse | null>(null)
  const [generandoPDF, setGenerandoPDF] = useState(false)

  useEffect(() => {
    if (companyId) {
      validarFacturas()
      cargarFormatosTxt()
    }
  }, [companyId, facturasIds])

  const validarFacturas = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    try {
      // Validar facturas para pago
      const result = await cuentasPorPagarService.validarFacturasParaPago(facturasIds)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        // Validar cuentas bancarias
        const cuentasResult = await cuentasPorPagarService.validarCuentasBancarias(facturasIds)
        if (cuentasResult.error) {
          setError(cuentasResult.error)
        } else {
          setProveedoresSinCuenta(cuentasResult.proveedoresSinCuenta)
          setValidacion(result.data)
          
          // Verificar si hay proveedores con tipo PAR
          const proveedoresPAR = result.data.validas
            .filter(f => f.proveedorRif) // Aquí necesitaríamos el tipo de cambio del proveedor
            .map(f => f.proveedorRif)
          setProveedoresConTipoPAR(proveedoresPAR)
          
          // Si hay errores críticos, mostrarlos
          if (result.data.invalidas.length > 0) {
            setError(`Facturas inválidas: ${result.data.invalidas.map(i => i.motivo).join(', ')}`)
          } else if (result.data.tiposPagoMezclados) {
            setError('No se pueden mezclar facturas con diferentes tipos de pago')
          } else {
            setStep('configuracion')
          }
        }
      }
    } catch (err) {
      setError('Error al validar las facturas')
      console.error('Error validando facturas:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarFormatosTxt = async () => {
    try {
      // TODO: Implementar servicio para obtener formatos TXT
      // const result = await formatosTxtService.getFormatos()
      // setFormatosTxt(result.data || [])
    } catch (error) {
      console.warn('No se pudieron cargar los formatos TXT:', error)
    }
  }

  const handleGenerarRecibo = async () => {
    if (!companyId || !validacion) return

    setStep('procesando')
    setError(null)

    try {
      const request: GenerarReciboRequest = {
        facturasIds,
        tipoPago,
        notas,
        bancoDestino: tipoPago === 'deposito' ? bancoDestino : undefined,
        formatoTxtId: tipoPago === 'deposito' && formatoTxtId ? formatoTxtId : undefined,
        tasaManualPAR: proveedoresConTipoPAR.length > 0 ? tasaManualPAR : undefined
      }

      const result = await cuentasPorPagarService.generarRecibo(companyId, user?.id || '', request)
      
      if (result.error) {
        setError(result.error)
        setStep('configuracion')
      } else {
        setReciboGenerado(result.data)
        setStep('completado')
        // No cerrar automáticamente - dejar que el usuario controle
        // onReciboGenerado() se llamará cuando el usuario haga clic en "Cerrar"
      }
    } catch (err) {
      setError('Error al generar el recibo')
      setStep('configuracion')
      console.error('Error generando recibo:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const handleDescargarReciboPDF = async () => {
    if (!reciboGenerado || !validacion || !user?.company || generandoPDF) return
    
    setGenerandoPDF(true)
    try {
      const { descargarReciboPDF, getEmpresaInfoFromCompany } = await import('@/utils/pdfRecibos')
      
      // Obtener información de la empresa
      const empresaInfo = getEmpresaInfoFromCompany(user.company)
      
      // Generar y descargar PDF
      descargarReciboPDF(
        reciboGenerado.recibo,
        validacion.validas,
        empresaInfo
      )
      
      console.log('✅ PDF del recibo generado y descargado')
    } catch (error) {
      console.error('❌ Error generando PDF del recibo:', error)
      alert('Error al generar el PDF del recibo')
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handlePrevisualizarReciboPDF = async () => {
    if (!reciboGenerado || !validacion || !user?.company || generandoPDF) return
    
    setGenerandoPDF(true)
    try {
      const { generarReciboPDF, getEmpresaInfoFromCompany, previsualizarPDF } = await import('@/utils/pdfRecibos')
      
      // Obtener información de la empresa
      const empresaInfo = getEmpresaInfoFromCompany(user.company)
      
      // Generar PDF y previsualizarlo
      const pdfDataUri = generarReciboPDF(
        reciboGenerado.recibo,
        validacion.validas,
        empresaInfo
      )
      
      previsualizarPDF(pdfDataUri, `Recibo ${reciboGenerado.recibo.numeroRecibo}`)
      
      console.log('✅ PDF del recibo previsualizando')
    } catch (error) {
      console.error('❌ Error previsualizando PDF del recibo:', error)
      alert('Error al previsualizar el PDF del recibo')
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleDescargarNotasDebitoPDF = async () => {
    if (!reciboGenerado?.notasDebito.length || !user?.company) return
    
    try {
      const { descargarNotasDebitoPDF, getEmpresaInfoFromCompany } = await import('@/utils/pdfRecibos')
      
      // Obtener información de la empresa
      const empresaInfo = getEmpresaInfoFromCompany(user.company)
      
      // Generar y descargar PDF de notas de débito
      descargarNotasDebitoPDF(
        reciboGenerado.notasDebito,
        empresaInfo,
        reciboGenerado.recibo.numeroRecibo
      )
      
      console.log('✅ PDF de notas de débito generado y descargado')
    } catch (error) {
      console.error('❌ Error generando PDF de notas de débito:', error)
      alert('Error al generar el PDF de las notas de débito')
    }
  }

  const handleDescargarArchivoTXT = async () => {
    if (!reciboGenerado?.archivoTxt) return
    
    try {
      // Crear y descargar archivo TXT
      const blob = new Blob([reciboGenerado.archivoTxt], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recibo_${reciboGenerado.recibo.numeroRecibo}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error descargando archivo TXT:', error)
      alert('Error al descargar el archivo TXT')
    }
  }

  // Step 1: Validación
  if (step === 'validacion') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Generando Recibo de Pago
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        <div className="text-center py-8">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Validando facturas seleccionadas...</p>
            </>
          ) : error ? (
            <>
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error de Validación</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Facturas validadas correctamente</p>
            </>
          )}
        </div>
        </div>
      </div>
    )
  }

  // Step 2: Configuración
  if (step === 'configuracion') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Configurar Recibo de Pago
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        <div className="space-y-6">
          {/* Resumen de facturas */}
          <Card title="Resumen de Facturas">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{validacion?.validas.length || 0}</p>
                  <p className="text-sm text-gray-500">Facturas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(validacion?.montoTotal || 0)}</p>
                  <p className="text-sm text-gray-500">Total a Pagar</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {validacion?.proveedoresDiferentes ? 'Múltiples' : 'Único'}
                  </p>
                  <p className="text-sm text-gray-500">Proveedor(es)</p>
                </div>
              </div>

              {/* Lista de facturas */}
              <div className="max-h-40 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Factura
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Proveedor
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validacion?.validas.map((factura) => (
                      <tr key={factura.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {factura.numero}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {factura.proveedorNombre}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(factura.montoFinalPagar || factura.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Configuración del pago */}
          <Card title="Configuración del Pago">
            <div className="p-6 space-y-4">
              {/* Tipo de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Pago
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative">
                    <input
                      type="radio"
                      name="tipoPago"
                      value="deposito"
                      checked={tipoPago === 'deposito'}
                      onChange={(e) => setTipoPago(e.target.value as TipoPago)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      tipoPago === 'deposito' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="flex items-center">
                        <BanknotesIcon className="h-6 w-6 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Depósito Bancario</p>
                          <p className="text-sm text-gray-500">Pago mediante transferencia</p>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="tipoPago"
                      value="efectivo"
                      checked={tipoPago === 'efectivo'}
                      onChange={(e) => setTipoPago(e.target.value as TipoPago)}
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      tipoPago === 'efectivo' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-6 w-6 text-green-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Efectivo USD</p>
                          <p className="text-sm text-gray-500">Pago en dólares efectivo</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configuración específica para depósito */}
              {tipoPago === 'deposito' && (
                <div className="space-y-4">
                  <Input
                    label="Banco Destino"
                    value={bancoDestino}
                    onChange={(e) => setBancoDestino(e.target.value)}
                    placeholder="Nombre del banco donde se realizará el depósito"
                  />

                  {formatosTxt.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formato TXT (Opcional)
                      </label>
                      <select
                        value={formatoTxtId}
                        onChange={(e) => setFormatoTxtId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seleccionar formato...</option>
                        {formatosTxt.map((formato) => (
                          <option key={formato.id} value={formato.id}>
                            {formato.nombreBanco} - {formato.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Tasa manual para proveedores PAR */}
              {proveedoresConTipoPAR.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <ClockIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <h4 className="text-sm font-medium text-yellow-800">
                      Tasa Manual Requerida
                    </h4>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Hay proveedores que requieren tasa paralelo (PAR). Ingrese la tasa manual:
                  </p>
                  <Input
                    label="Tasa Paralelo (Bs/USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={tasaManualPAR || ''}
                    onChange={(e) => setTasaManualPAR(parseFloat(e.target.value) || undefined)}
                    placeholder="Ej: 45.50"
                  />
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Notas adicionales sobre el pago..."
                />
              </div>
            </div>
          </Card>

          {/* Advertencias */}
          {validacion?.requiereNotasDebito && tipoPago === 'deposito' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">
                    Notas de Débito Automáticas
                  </h4>
                  <p className="text-sm text-blue-700">
                    Se generarán automáticamente las notas de débito por diferencial cambiario.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Validación de cuentas bancarias */}
          {proveedoresSinCuenta.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Proveedores sin cuenta bancaria favorita
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Los siguientes proveedores no tienen una cuenta bancaria favorita configurada. 
                    No se podrán generar archivos TXT para estos proveedores:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {proveedoresSinCuenta.map((proveedor, index) => (
                      <li key={index}>
                        {proveedor.nombre} ({proveedor.rif})
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-yellow-700 mt-2">
                    <strong>Solución:</strong> Ve a la sección de Proveedores y configura las cuentas bancarias 
                    para estos proveedores antes de generar el archivo TXT.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerarRecibo}
              className="inline-flex items-center"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Generar Recibo
            </Button>
          </div>
        </div>
        </div>
      </div>
    )
  }

  // Step 3: Procesando
  if (step === 'procesando') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Generando Recibo</h3>
          </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Procesando Pago
          </h3>
          <p className="text-gray-600">
            Generando recibo de pago y notas de débito...
          </p>
        </div>
        </div>
      </div>
    )
  }

  // Step 4: Completado
  if (step === 'completado') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Recibo Generado</h3>
            <button onClick={onReciboGenerado} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        <div className="text-center py-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Recibo generado exitosamente!
          </h3>
          <p className="text-gray-600 mb-4">
            {reciboGenerado && (
              <>
                Recibo <strong>{reciboGenerado.recibo.numeroRecibo}</strong> por {formatCurrency(reciboGenerado.recibo.montoTotalBs)}
                {reciboGenerado.notasDebito.length > 0 && (
                  <><br />Se generaron <strong>{reciboGenerado.notasDebito.length}</strong> notas de débito automáticas</>
                )}
              </>
            )}
          </p>
          
          <div className="space-y-4">
            {/* Recibo PDF */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">📄 Recibo de Pago</h4>
              <div className="flex space-x-2">
                <Button onClick={handlePrevisualizarReciboPDF} variant="outline" className="flex-1">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button onClick={handleDescargarReciboPDF} className="flex-1">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
            
            {/* Notas de Débito */}
            {reciboGenerado?.notasDebito && reciboGenerado.notasDebito.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">
                  📋 Notas de Débito ({reciboGenerado.notasDebito.length})
                </h4>
                <Button variant="outline" onClick={handleDescargarNotasDebitoPDF} className="w-full">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            )}
            
            {/* Archivo TXT */}
            {tipoPago === 'deposito' && (
              <div className={`p-4 rounded-lg ${
                reciboGenerado?.archivoTxt ? 'bg-green-50' : 'bg-gray-50'
              }`}>
                <h4 className="font-medium text-gray-900 mb-3">🏦 Archivo Bancario</h4>
                {reciboGenerado?.archivoTxt ? (
                  <Button variant="outline" onClick={handleDescargarArchivoTXT} className="w-full">
                    <BanknotesIcon className="h-4 w-4 mr-2" />
                    Descargar TXT
                  </Button>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-600 mb-2">
                      No se pudo generar el archivo TXT
                    </p>
                    {proveedoresSinCuenta.length > 0 && (
                      <p className="text-xs text-yellow-700">
                        Algunos proveedores no tienen cuenta bancaria favorita configurada
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <Button variant="outline" onClick={onReciboGenerado} className="w-full mt-6">
              Cerrar
            </Button>
          </div>
        </div>
        </div>
      </div>
    )
  }

  return null
}