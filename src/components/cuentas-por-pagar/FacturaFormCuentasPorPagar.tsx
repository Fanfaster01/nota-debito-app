'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/contexts/AuthContext'
import { useAsyncForm } from '@/hooks/useAsyncState'
import { proveedorService, ProveedorWithCuentas, ProveedorFormData } from '@/lib/services/proveedorService'
import { tasasCambioService } from '@/lib/services/tasasCambioService'
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService'
import { ProveedorModalNew } from '@/components/forms/ProveedorModalNew'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CalculatorIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import debounce from 'lodash/debounce'
import type { FormDataFactura } from '@/types/cuentasPorPagar'

// Schema de validación
const facturaSchema = z.object({
  numero: z.string().min(1, 'El número de factura es requerido'),
  numeroControl: z.string().min(1, 'El número de control es requerido'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  fechaVencimiento: z.string().min(1, 'La fecha de vencimiento es requerida'),
  proveedorNombre: z.string().min(1, 'El nombre del proveedor es requerido'),
  proveedorRif: z.string().min(1, 'El RIF del proveedor es requerido'),
  proveedorDireccion: z.string().min(1, 'La dirección del proveedor es requerida'),
  baseImponible: z.number().min(0, 'La base imponible debe ser mayor o igual a 0'),
  montoExento: z.number().min(0, 'El monto exento debe ser mayor o igual a 0'),
  alicuotaIVA: z.number().min(0).max(100, 'La alícuota IVA debe estar entre 0 y 100'),
  porcentajeRetencion: z.number().min(0).max(100, 'El porcentaje de retención debe estar entre 0 y 100'),
  tasaCambio: z.number().min(0, 'La tasa de cambio debe ser mayor a 0'),
})

type FacturaFormData = z.infer<typeof facturaSchema>

interface FacturaFormCuentasPorPagarProps {
  companyId?: string
  userId?: string
  onFacturaCreada: () => void
  onClose?: () => void
}

export function FacturaFormCuentasPorPagar(props: FacturaFormCuentasPorPagarProps) {
  const { companyId, userId, onFacturaCreada, onClose } = props
  const { company } = useAuth()
  const [showProveedorModal, setShowProveedorModal] = useState(false)
  const [searchingProveedor, setSearchingProveedor] = useState(false)
  const [proveedorFound, setProveedorFound] = useState(false)
  const [proveedorSuggestions, setProveedorSuggestions] = useState<ProveedorWithCuentas[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingTasa, setLoadingTasa] = useState(false)
  
  // Estados unificados con useAsyncForm
  const submitState = useAsyncForm<any>()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      numero: '',
      numeroControl: '',
      proveedorNombre: '',
      proveedorRif: '',
      proveedorDireccion: '',
      baseImponible: 0,
      montoExento: 0,
      alicuotaIVA: 16,
      porcentajeRetencion: 75,
      tasaCambio: 0,
    },
  })

  // Watch para cambios que afectan cálculos
  const baseImponible = watch('baseImponible')
  const montoExento = watch('montoExento')
  const alicuotaIVA = watch('alicuotaIVA')
  const porcentajeRetencion = watch('porcentajeRetencion')
  const tasaCambio = watch('tasaCambio')
  const proveedorRif = watch('proveedorRif')
  const fecha = watch('fecha')

  // Buscar tasa de cambio cuando cambia la fecha
  useEffect(() => {
    if (fecha) {
      obtenerTasaPorFecha(fecha)
    }
  }, [fecha])

  // Buscar proveedor por RIF con debounce
  const searchProveedorByRif = useCallback(
    debounce(async (rif: string) => {
      if (!rif || rif.length < 3) {
        setProveedorFound(false)
        setProveedorSuggestions([])
        return
      }

      setSearchingProveedor(true)
      try {
        const { data: proveedorExacto, error: errorExacto } = await proveedorService.getProveedorByRif(rif)
        
        if (!errorExacto && proveedorExacto) {
          setValue('proveedorNombre', proveedorExacto.nombre)
          setValue('proveedorDireccion', proveedorExacto.direccion)
          setValue('porcentajeRetencion', proveedorExacto.porcentaje_retencion || 75)
          
          setProveedorFound(true)
          setProveedorSuggestions([])
          setShowSuggestions(false)
        } else {
          const { data: sugerencias } = await proveedorService.searchProveedores(rif)
          setProveedorSuggestions(sugerencias || [])
          setShowSuggestions((sugerencias?.length || 0) > 0)
          setProveedorFound(false)
        }
      } catch (error) {
        console.error('Error buscando proveedor:', error)
        setProveedorFound(false)
      } finally {
        setSearchingProveedor(false)
      }
    }, 500),
    [setValue]
  )

  // Efecto para buscar cuando cambia el RIF
  useEffect(() => {
    searchProveedorByRif(proveedorRif)
  }, [proveedorRif, searchProveedorByRif])

  // Obtener tasa de cambio por fecha
  const obtenerTasaPorFecha = async (fechaFactura: string) => {
    setLoadingTasa(true)
    try {
      const result = await tasasCambioService.getTasaUSDPorFecha(fechaFactura)
      if (result.data) {
        setValue('tasaCambio', result.data.tasa)
      }
    } catch (error) {
      console.warn('No se pudo obtener la tasa de cambio:', error)
    } finally {
      setLoadingTasa(false)
    }
  }

  // Cálculos automáticos
  const calcularMontos = () => {
    const subTotal = baseImponible + montoExento
    const iva = (baseImponible * alicuotaIVA) / 100
    const total = subTotal + iva
    const retencionIVA = (iva * porcentajeRetencion) / 100
    const montoUSD = tasaCambio > 0 ? total / tasaCambio : 0

    return {
      subTotal,
      iva,
      total,
      retencionIVA,
      montoUSD
    }
  }

  const montos = calcularMontos()

  // Seleccionar proveedor de las sugerencias
  const selectProveedor = (proveedor: ProveedorWithCuentas) => {
    setValue('proveedorNombre', proveedor.nombre)
    setValue('proveedorRif', proveedor.rif)
    setValue('proveedorDireccion', proveedor.direccion)
    setValue('porcentajeRetencion', proveedor.porcentaje_retencion || 75)
    
    setProveedorFound(true)
    setShowSuggestions(false)
  }

  // Manejar envío del formulario
  const onSubmit = async (data: FacturaFormData) => {
    if (!companyId || !userId) {
      throw new Error('Faltan datos de empresa o usuario')
    }

    const result = await submitState.executeWithValidation(
      async () => {
        const facturaData: FormDataFactura = {
          ...data,
          clienteNombre: company?.name || '',
          clienteRif: company?.rif || '',
          clienteDireccion: company?.address || '',
          subTotal: montos.subTotal,
          iva: montos.iva,
          total: montos.total,
          retencionIVA: montos.retencionIVA,
          montoUSD: montos.montoUSD
        }

        const result = await cuentasPorPagarService.createFactura(companyId, userId, facturaData)

        if (result.error) {
          throw new Error(result.error)
        }

        return result
      },
      'Error al crear la factura'
    )
    
    if (result) {
      setTimeout(() => {
        onFacturaCreada()
        reset()
      }, 1500)
    }
  }

  // Guardar nuevo proveedor
  const handleSaveProveedor = async (proveedorData: ProveedorFormData) => {
    try {
      const { error } = await proveedorService.createProveedorWithCuentas(proveedorData)
      
      if (error) {
        console.error('Error al crear proveedor:', error)
        alert('Error al crear el proveedor')
        return
      }

      setValue('proveedorNombre', proveedorData.nombre)
      setValue('proveedorRif', proveedorData.rif)
      setValue('proveedorDireccion', proveedorData.direccion)
      setValue('porcentajeRetencion', proveedorData.porcentaje_retencion || 75)
      
      setProveedorFound(true)
      setShowProveedorModal(false)
    } catch (error) {
      console.error('Error al guardar proveedor:', error)
      alert('Error al guardar el proveedor')
    }
  }

  if (submitState.success) {
    return (
      <div className="bg-white p-6 rounded-lg">
        <div className="text-center py-8">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Factura creada exitosamente!
          </h3>
          <p className="text-gray-600">
            La factura ha sido registrada en el sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Nueva Factura</h2>
          {onClose && (
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="inline-flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          )}
        </div>

        {/* Información combinada en una sola card */}
        <Card>
          <div className="p-6 space-y-6">
            {/* Información de la factura */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Información de la Factura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Número de Factura"
                  {...register('numero')}
                  error={errors.numero?.message}
                  placeholder="Ej: FAC-001"
                />
                
                <Input
                  label="Número de Control"
                  {...register('numeroControl')}
                  error={errors.numeroControl?.message}
                  placeholder="Ej: CTRL-001"
                />
                
                <Input
                  label="Fecha de Factura"
                  type="date"
                  {...register('fecha')}
                  error={errors.fecha?.message}
                />
                
                <Input
                  label="Fecha de Vencimiento"
                  type="date"
                  {...register('fechaVencimiento')}
                  error={errors.fechaVencimiento?.message}
                />
              </div>
            </div>

            {/* Información del proveedor */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-900">Información del Proveedor</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="inline-flex items-center"
                  onClick={() => setShowProveedorModal(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nuevo
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Campo RIF con autocompletado */}
                <div className="relative">
                  <Input
                    label="RIF"
                    {...register('proveedorRif')}
                    error={errors.proveedorRif?.message}
                    placeholder="J-12345678-9"
                    className={proveedorFound ? 'pr-8' : ''}
                  />
                  
                  {searchingProveedor && (
                    <div className="absolute right-3 top-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {proveedorFound && (
                    <div className="absolute right-3 top-8">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    </div>
                  )}

                  {/* Sugerencias de proveedores */}
                  {showSuggestions && proveedorSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                      {proveedorSuggestions.map((prov) => (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => selectProveedor(prov)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                        >
                          <div className="font-medium">{prov.nombre}</div>
                          <div className="text-sm text-gray-500">{prov.rif}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Nombre del proveedor */}
                <Input
                  label="Nombre del Proveedor"
                  {...register('proveedorNombre')}
                  error={errors.proveedorNombre?.message}
                  readOnly={proveedorFound}
                  className={proveedorFound ? 'bg-gray-50' : ''}
                />

                {/* Dirección del proveedor */}
                <Input
                  label="Dirección del Proveedor"
                  {...register('proveedorDireccion')}
                  error={errors.proveedorDireccion?.message}
                  readOnly={proveedorFound}
                  className={proveedorFound ? 'bg-gray-50' : ''}
                />
              </div>
            </div>

            {/* Montos y cálculos */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Montos y Cálculos</h3>
              
              {/* Tasa de cambio integrada en la grilla */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Tasa de cambio automática según fecha</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => obtenerTasaPorFecha(fecha)}
                  disabled={loadingTasa}
                  className="text-blue-600 border-blue-300"
                >
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  {loadingTasa ? 'Actualizando...' : 'Actualizar'}
                </Button>
              </div>

              {/* Todos los campos de montos en una grilla compacta */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Imponible (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('baseImponible', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.baseImponible && (
                    <p className="mt-1 text-sm text-red-600">{errors.baseImponible.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Exento (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('montoExento', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.montoExento && (
                    <p className="mt-1 text-sm text-red-600">{errors.montoExento.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alícuota IVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('alicuotaIVA', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.alicuotaIVA && (
                    <p className="mt-1 text-sm text-red-600">{errors.alicuotaIVA.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    % Retención IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('porcentajeRetencion', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.porcentajeRetencion && (
                    <p className="mt-1 text-sm text-red-600">{errors.porcentajeRetencion.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Cambio (Bs/USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('tasaCambio', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.tasaCambio && (
                    <p className="mt-1 text-sm text-red-600">{errors.tasaCambio.message}</p>
                  )}
                </div>
              </div>

              {/* Campos calculados - mostrados en una fila compacta */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Subtotal:</span>
                    <span className="font-medium">Bs. {montos.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">IVA:</span>
                    <span className="font-medium">Bs. {montos.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Total:</span>
                    <span className="font-bold text-lg">Bs. {montos.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">Retención IVA:</span>
                    <span className="font-medium">Bs. {montos.retencionIVA.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 mr-2">USD:</span>
                    <span className="font-medium">${montos.montoUSD.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {submitState.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-700">{submitState.error}</p>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => reset()}>
            Limpiar
          </Button>
          <Button type="submit" disabled={submitState.loading}>
            {submitState.loading ? 'Creando...' : 'Crear Factura'}
          </Button>
        </div>
      </form>

      {/* Modal de nuevo proveedor - fuera del form */}
      {showProveedorModal && (
        <ProveedorModalNew
          isOpen={true}
          onClose={() => setShowProveedorModal(false)}
          onSave={handleSaveProveedor}
          editingProveedor={undefined}
        />
      )}
    </>
  )
}