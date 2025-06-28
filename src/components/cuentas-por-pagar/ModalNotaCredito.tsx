'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NotaCreditoForm } from '@/components/forms/NotaCreditoForm'
import type { FacturaCuentaPorPagar } from '@/types/cuentasPorPagar'
import type { NotaCredito, Factura } from '@/types'
import { createClient } from '@/utils/supabase/client'

interface ModalNotaCreditoProps {
  factura: FacturaCuentaPorPagar
  onClose: () => void
  onNotaCreditoCreada: () => void
}

export function ModalNotaCredito({ 
  factura, 
  onClose, 
  onNotaCreditoCreada 
}: ModalNotaCreditoProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Convertir FacturaCuentaPorPagar a Factura para el formulario
  const facturaParaForm: Factura = {
    fecha: new Date(factura.fecha),
    numero: factura.numero,
    numeroControl: factura.numeroControl || '',
    proveedor: {
      nombre: factura.proveedorNombre,
      rif: factura.proveedorRif,
      direccion: factura.proveedorDireccion
    },
    cliente: {
      nombre: factura.clienteNombre,
      rif: factura.clienteRif,
      direccion: factura.clienteDireccion
    },
    baseImponible: factura.baseImponible,
    montoExento: factura.montoExento,
    subTotal: factura.subTotal,
    alicuotaIVA: factura.alicuotaIVA,
    iva: factura.iva,
    total: factura.total,
    porcentajeRetencion: factura.porcentajeRetencion,
    retencionIVA: factura.retencionIVA,
    tasaCambio: factura.tasaCambio,
    montoUSD: factura.montoUSD
  }

  const handleSubmit = async (notaCredito: NotaCredito) => {
    setLoading(true)
    setError(null)

    try {
      // Guardar la nota de crédito asociada a la factura
      const { error: saveError } = await supabase
        .from('notas_credito')
        .insert({
          factura_id: factura.id,
          fecha: notaCredito.fecha.toISOString().split('T')[0],
          numero: notaCredito.numero,
          factura_afectada: notaCredito.facturaAfectada,
          monto_exento: notaCredito.montoExento,
          base_imponible: notaCredito.baseImponible,
          sub_total: notaCredito.subTotal,
          alicuota_iva: notaCredito.alicuotaIVA,
          iva: notaCredito.iva,
          total: notaCredito.total,
          porcentaje_retencion: notaCredito.porcentajeRetencion,
          retencion_iva: notaCredito.retencionIVA,
          tasa_cambio: notaCredito.tasaCambio,
          monto_usd: notaCredito.montoUSD,
          company_id: factura.companyId,
          created_by: factura.createdBy
        })

      if (saveError) {
        throw saveError
      }

      onNotaCreditoCreada()
    } catch (err) {
      console.error('Error al guardar nota de crédito:', err)
      setError('Error al guardar la nota de crédito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            Agregar Nota de Crédito
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Factura:</strong> {factura.numero} - {factura.proveedorNombre}
          </p>
          <p className="text-sm text-blue-700">
            Esta nota de crédito se asociará a la factura seleccionada y será considerada 
            al generar automáticamente la nota de débito por diferencial cambiario.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <NotaCreditoForm
          factura={facturaParaForm}
          onSubmit={handleSubmit}
        />

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}