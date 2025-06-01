// src/components/notas-debito/NotaDebitoDetailModal.tsx
import React from 'react'
import { NotaDebito } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { formatearFecha } from '@/utils/dateUtils'
import { calcularMontoFinalPagar } from '@/lib/calculations'
import { NotaDebitoPDFDownloadLink } from '@/components/pdf/NotaDebitoPDF'

interface NotaDebitoDetailModalProps {
  isOpen: boolean
  notaDebito: NotaDebito | null
  onClose: () => void
}

export const NotaDebitoDetailModal: React.FC<NotaDebitoDetailModalProps> = ({
  isOpen,
  notaDebito,
  onClose
}) => {
  if (!isOpen || !notaDebito) return null

  const montoFinal = calcularMontoFinalPagar(
    notaDebito.factura,
    notaDebito.notasCredito || [],
    notaDebito
  )

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-medium text-gray-900">
            Detalles de Nota de Débito ND-{notaDebito.numero}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Información general */}
          <Card title="Información General">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Número:</span> ND-{notaDebito.numero}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {formatearFecha(notaDebito.fecha)}
              </div>
            </div>
          </Card>

          {/* Datos del proveedor */}
          <Card title="Datos del Proveedor">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Nombre:</span> {notaDebito.factura.proveedor.nombre}
              </div>
              <div>
                <span className="font-medium">RIF:</span> {notaDebito.factura.proveedor.rif}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Dirección:</span> {notaDebito.factura.proveedor.direccion}
              </div>
            </div>
          </Card>

          {/* Datos de la factura */}
          <Card title="Datos de la Factura Original">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Número:</span> {notaDebito.factura.numero}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {formatearFecha(notaDebito.factura.fecha)}
              </div>
              <div>
                <span className="font-medium">Total Bs.:</span> {notaDebito.factura.total.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Total USD:</span> ${notaDebito.factura.montoUSD.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Tasa de cambio:</span> Bs. {notaDebito.factura.tasaCambio.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Retención IVA:</span> Bs. {notaDebito.factura.retencionIVA.toFixed(2)}
              </div>
            </div>
          </Card>

          {/* Notas de crédito si existen */}
          {notaDebito.notasCredito && notaDebito.notasCredito.length > 0 && (
            <Card title="Notas de Crédito Asociadas">
              <div className="space-y-2">
                {notaDebito.notasCredito.map((nc, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Número:</span> {nc.numero}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> Bs. {nc.total.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">USD:</span> ${nc.montoUSD.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Cálculo del diferencial */}
          <Card title="Cálculo del Diferencial Cambiario">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Tasa original:</span> Bs. {notaDebito.tasaCambioOriginal.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Tasa al pago:</span> Bs. {notaDebito.tasaCambioPago.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Monto USD neto:</span> ${notaDebito.montoUSDNeto.toFixed(2)}
                </div>
                <div>
                  <span className="font-medium">Diferencial cambiario:</span> Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Base imponible:</span> Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">IVA ({notaDebito.factura.alicuotaIVA}%):</span> Bs. {notaDebito.ivaDiferencial.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Retención IVA:</span> Bs. {notaDebito.retencionIVADiferencial.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Monto neto nota débito:</span> Bs. {notaDebito.montoNetoPagarNotaDebito.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Monto final */}
          <Card>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                Monto Final a Pagar: Bs. {montoFinal.toFixed(2)}
              </p>
            </div>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <NotaDebitoPDFDownloadLink 
              notaDebito={notaDebito} 
              montoFinalPagar={montoFinal}
            />
          </div>
        </div>
      </div>
    </div>
  )
}