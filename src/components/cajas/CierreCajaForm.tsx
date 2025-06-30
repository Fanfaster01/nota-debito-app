// src/components/cajas/CierreCajaForm.tsx
import React, { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CajaUI, CierreCajaFormData, CierrePuntoVentaUI } from '@/types/caja'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { bancoService } from '@/lib/services/bancoService'
import { BancoSelector } from '@/components/ui/BancoSelector'
import { useAsyncForm } from '@/hooks/useAsyncState'
import { 
  CurrencyDollarIcon,
  CurrencyEuroIcon,
  BanknotesIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const cierreCajaSchema = z.object({
  efectivoDolares: z.number().min(0, 'El monto no puede ser negativo'),
  efectivoEuros: z.number().min(0, 'El monto no puede ser negativo'),
  efectivoBs: z.number().min(0, 'El monto no puede ser negativo'),
  reporteZ: z.number().min(0, 'El monto no puede ser negativo'),
  fondoCajaDolares: z.number().min(0, 'El monto no puede ser negativo'),
  fondoCajaBs: z.number().min(0, 'El monto no puede ser negativo'),
  observaciones: z.string().optional()
})

type CierreCajaFormValues = z.infer<typeof cierreCajaSchema>

interface CierreCajaFormProps {
  caja: CajaUI
  onSubmit: (data: CierreCajaFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const CierreCajaForm: React.FC<CierreCajaFormProps> = ({
  caja,
  onSubmit,
  onCancel,
  loading
}) => {
  const [cierresPuntoVenta, setCierresPuntoVenta] = useState<CierrePuntoVentaUI[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  
  // Estado unificado con useAsyncForm para operaciones internas
  const submitState = useAsyncForm<void>()
  const [cierrePvForm, setCierrePvForm] = useState<Omit<CierrePuntoVentaUI, 'id'>>({
    bancoId: '',
    montoBs: 0,
    montoUsd: 0,
    numeroLote: ''
  })

  const form = useForm<CierreCajaFormValues>({
    resolver: zodResolver(cierreCajaSchema),
    defaultValues: {
      efectivoDolares: 0,
      efectivoEuros: 0,
      efectivoBs: 0,
      reporteZ: 0,
      fondoCajaDolares: 0,
      fondoCajaBs: 0,
      observaciones: ''
    }
  })

  // Watchear todos los campos para que el resumen se actualice en tiempo real
  const watchedValues = form.watch([
    'efectivoDolares',
    'efectivoEuros', 
    'efectivoBs',
    'reporteZ',
    'fondoCajaDolares',
    'fondoCajaBs'
  ])


  const handleAgregarCierrePv = async () => {
    if (cierrePvForm.bancoId && cierrePvForm.montoBs > 0 && cierrePvForm.numeroLote) {
      // Obtener información del banco
      const { data: bancosData } = await bancoService.getBancos()
      const banco = bancosData?.find(b => b.id === cierrePvForm.bancoId)
      
      const nuevoCierre: CierrePuntoVentaUI = {
        ...cierrePvForm,
        id: `temp-${Date.now()}`,
        banco,
        montoUsd: cierrePvForm.montoBs / caja.tasaDia
      }

      if (editingIndex !== null) {
        const nuevaLista = [...cierresPuntoVenta]
        nuevaLista[editingIndex] = nuevoCierre
        setCierresPuntoVenta(nuevaLista)
        setEditingIndex(null)
      } else {
        setCierresPuntoVenta([...cierresPuntoVenta, nuevoCierre])
      }

      setCierrePvForm({
        bancoId: '',
        montoBs: 0,
        montoUsd: 0,
        numeroLote: ''
      })
    }
  }

  const handleEditarCierrePv = (index: number) => {
    const cierre = cierresPuntoVenta[index]
    setCierrePvForm({
      bancoId: cierre.bancoId,
      montoBs: cierre.montoBs,
      montoUsd: cierre.montoUsd,
      numeroLote: cierre.numeroLote
    })
    setEditingIndex(index)
  }

  const handleEliminarCierrePv = (index: number) => {
    setCierresPuntoVenta(cierresPuntoVenta.filter((_, i) => i !== index))
  }

  const handleCancelarEdicion = () => {
    setCierrePvForm({
      bancoId: '',
      montoBs: 0,
      montoUsd: 0,
      numeroLote: ''
    })
    setEditingIndex(null)
  }

  const calcularTotales = () => {
    const [efectivoDolares, efectivoEuros, efectivoBs, reporteZ, fondoCajaDolares, fondoCajaBs] = watchedValues
    const totalEfectivoBs = efectivoBs || 0
    const totalEfectivoDolares = efectivoDolares || 0
    const totalEfectivoEuros = efectivoEuros || 0
    const reporteZValue = reporteZ || 0
    const fondoCajaDolaresValue = fondoCajaDolares || 0
    const fondoCajaBsValue = fondoCajaBs || 0
    const totalPuntoVentaBs = cierresPuntoVenta.reduce((sum, cv) => sum + cv.montoBs, 0)
    const totalPuntoVentaUsd = cierresPuntoVenta.reduce((sum, cv) => sum + cv.montoUsd, 0)
    
    const totalEfectivoEnBs = totalEfectivoBs + 
      (totalEfectivoDolares * caja.tasaDia) + 
      (totalEfectivoEuros * caja.tasaDia * 1.1) // Asumiendo una tasa EUR/USD de 1.1
    
    // Total calculado (incluye todo lo registrado en el sistema)
    const totalCalculadoBs = caja.totalPagosMovil + caja.totalZelleBs + 
      (caja.totalCreditosBs || 0) + (caja.totalNotasCredito || 0) + 
      totalEfectivoEnBs + totalPuntoVentaBs
    
    // Diferencia entre total calculado y reporte Z
    const diferencia = totalCalculadoBs - reporteZValue
    
    return {
      totalEfectivoBs,
      totalEfectivoDolares,
      totalEfectivoEuros,
      totalPuntoVentaBs,
      totalPuntoVentaUsd,
      totalEfectivoEnBs,
      reporteZ: reporteZValue,
      fondoCajaDolares: fondoCajaDolaresValue,
      fondoCajaBs: fondoCajaBsValue,
      totalCalculadoBs,
      diferencia
    }
  }

  const handleSubmit = async (data: CierreCajaFormValues) => {
    await submitState.executeWithValidation(
      async () => {
        const formData: CierreCajaFormData = {
          ...data,
          cierresPuntoVenta
        }
        await onSubmit(formData)
        return void 0
      },
      'Error al procesar el cierre de caja'
    )
  }

  // Usar useMemo para recalcular totales cuando cambien los valores watched o cierres PV
  const totales = useMemo(() => {
    return calcularTotales()
  }, [watchedValues, cierresPuntoVenta, caja.tasaDia, caja.totalPagosMovil, caja.totalZelleBs, caja.totalCreditosBs, caja.totalNotasCredito])
  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Mensajes de error */}
      {submitState.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {submitState.error}
        </div>
      )}
      
      {/* Efectivo */}
      <Card title="Efectivo en Caja">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Efectivo en Dólares
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('efectivoDolares', { valueAsNumber: true })}
              error={form.formState.errors.efectivoDolares?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <CurrencyEuroIcon className="h-4 w-4 mr-1" />
              Efectivo en Euros
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('efectivoEuros', { valueAsNumber: true })}
              error={form.formState.errors.efectivoEuros?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <BanknotesIcon className="h-4 w-4 mr-1" />
              Efectivo en Bolívares
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('efectivoBs', { valueAsNumber: true })}
              error={form.formState.errors.efectivoBs?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
          </div>
        </div>
      </Card>

      {/* Cierres de Punto de Venta */}
      <Card title="Cierres de Punto de Venta">
        <div className="space-y-4">
          {/* Formulario para agregar */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <BancoSelector
                  label="Banco"
                  value={cierrePvForm.bancoId}
                  onChange={(bancoId) => setCierrePvForm({ ...cierrePvForm, bancoId })}
                  placeholder="Seleccione banco"
                  disabled={loading || submitState.loading}
                  required
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Monto (Bs)"
                  type="number"
                  step="0.01"
                  value={cierrePvForm.montoBs}
                  onChange={(e) => setCierrePvForm({ 
                    ...cierrePvForm, 
                    montoBs: parseFloat(e.target.value) || 0,
                    montoUsd: (parseFloat(e.target.value) || 0) / caja.tasaDia
                  })}
                  disabled={loading || submitState.loading}
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-3">
                <Input
                  label="Número de Lote"
                  type="text"
                  value={cierrePvForm.numeroLote}
                  onChange={(e) => setCierrePvForm({ ...cierrePvForm, numeroLote: e.target.value })}
                  disabled={loading || submitState.loading}
                  placeholder="0000"
                />
              </div>

              <div className="md:col-span-2 flex items-end space-x-2">
                {editingIndex !== null ? (
                  <>
                    <Button
                      type="button"
                      onClick={handleAgregarCierrePv}
                      disabled={loading || !cierrePvForm.bancoId || cierrePvForm.montoBs <= 0 || !cierrePvForm.numeroLote}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelarEdicion}
                      disabled={loading || submitState.loading}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={handleAgregarCierrePv}
                    disabled={loading || !cierrePvForm.bancoId || cierrePvForm.montoBs <= 0 || !cierrePvForm.numeroLote}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                )}
              </div>
            </div>

            {cierrePvForm.montoBs > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Equivalente: $ {formatMonto(cierrePvForm.montoBs / caja.tasaDia)}
              </p>
            )}
          </div>

          {/* Lista de cierres */}
          {cierresPuntoVenta.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Cierres registrados:</h4>
              {cierresPuntoVenta.map((cierre, index) => (
                <div key={cierre.id} className="flex items-center justify-between bg-white p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{cierre.banco?.nombre}</p>
                    <p className="text-sm text-gray-600">
                      Lote: {cierre.numeroLote} | Bs. {formatMonto(cierre.montoBs)} | $ {formatMonto(cierre.montoUsd)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditarCierrePv(index)}
                      className="text-blue-600 hover:text-blue-800"
                      disabled={loading || editingIndex !== null}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminarCierrePv(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={loading || editingIndex !== null}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Reporte Z y Fondo de Caja */}
      <Card title="Reporte Fiscal y Fondo de Caja">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              Reporte Z (Bs)
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('reporteZ', { valueAsNumber: true })}
              error={form.formState.errors.reporteZ?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto total registrado por la impresora fiscal
            </p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              Fondo de Caja ($)
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('fondoCajaDolares', { valueAsNumber: true })}
              error={form.formState.errors.fondoCajaDolares?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto en dólares que se deja para el siguiente día
            </p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <BanknotesIcon className="h-4 w-4 mr-1" />
              Fondo de Caja (Bs)
            </label>
            <Input
              type="number"
              step="0.01"
              {...form.register('fondoCajaBs', { valueAsNumber: true })}
              error={form.formState.errors.fondoCajaBs?.message}
              disabled={loading || submitState.loading}
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto en bolívares que se deja para el siguiente día
            </p>
          </div>
        </div>
      </Card>

      {/* Resumen de totales */}
      <Card title="Resumen de Cierre">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Efectivo en Dólares:</p>
              <p className="font-semibold">$ {formatMonto(totales.totalEfectivoDolares)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Efectivo en Euros:</p>
              <p className="font-semibold">€ {formatMonto(totales.totalEfectivoEuros)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Efectivo en Bolívares:</p>
              <p className="font-semibold">Bs. {formatMonto(totales.totalEfectivoBs)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Puntos de Venta:</p>
              <p className="font-semibold">Bs. {formatMonto(totales.totalPuntoVentaBs)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fondo de Caja ($):</p>
              <p className="font-semibold">$ {formatMonto(totales.fondoCajaDolares)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fondo de Caja (Bs):</p>
              <p className="font-semibold">Bs. {formatMonto(totales.fondoCajaBs)}</p>
            </div>
          </div>
          
          <div className="border-t pt-3 space-y-2">
            <div className="bg-blue-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-blue-700">Total Calculado del Sistema:</p>
                <p className="text-lg font-bold text-blue-800">Bs. {formatMonto(totales.totalCalculadoBs)}</p>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Incluye: Pagos móviles + Zelle + Créditos + Notas crédito + Efectivo + POS
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Reporte Z (Impresora Fiscal):</p>
                <p className="text-lg font-bold text-gray-800">Bs. {formatMonto(totales.reporteZ)}</p>
              </div>
            </div>
            
            <div className={`p-3 rounded-md ${totales.diferencia === 0 ? 'bg-green-50' : totales.diferencia > 0 ? 'bg-yellow-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Diferencia (Sistema - Reporte Z):</p>
                <p className={`text-lg font-bold ${totales.diferencia === 0 ? 'text-green-600' : totales.diferencia > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                  Bs. {totales.diferencia >= 0 ? '+' : ''}{formatMonto(totales.diferencia)}
                </p>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {totales.diferencia === 0 && 'Perfecto! Los montos coinciden exactamente'}
                {totales.diferencia > 0 && 'El sistema registra más que el reporte Z'}
                {totales.diferencia < 0 && 'El reporte Z es mayor que lo registrado en el sistema'}
              </p>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Tasa del día: Bs. {formatMonto(caja.tasaDia)} / USD
            </p>
          </div>
        </div>
      </Card>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones (Opcional)
        </label>
        <textarea
          {...form.register('observaciones')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Alguna observación sobre el cierre..."
          disabled={loading}
        />
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="danger"
          disabled={loading || submitState.loading}
        >
          {(loading || submitState.loading) ? 'Cerrando...' : 'Confirmar Cierre'}
        </Button>
      </div>
    </form>
  )
}