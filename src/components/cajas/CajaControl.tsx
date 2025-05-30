// src/components/cajas/CajaControl.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CajaUI } from '@/types/caja'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  LockOpenIcon, 
  LockClosedIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatearFecha } from '@/utils/dateUtils'

const abrirCajaSchema = z.object({
  montoApertura: z.number().min(0, 'El monto no puede ser negativo'),
  tasaDia: z.number().positive('La tasa debe ser mayor a 0')
})

const cerrarCajaSchema = z.object({
  montoCierre: z.number().min(0, 'El monto no puede ser negativo'),
  observaciones: z.string().optional()
})

type AbrirCajaFormData = z.infer<typeof abrirCajaSchema>
type CerrarCajaFormData = z.infer<typeof cerrarCajaSchema>

interface CajaControlProps {
  caja: CajaUI | null
  onAbrirCaja: (montoApertura: number, tasaDia: number) => Promise<void>
  onCerrarCaja: (montoCierre: number, observaciones?: string) => Promise<void>
  onActualizarTasa?: (nuevaTasa: number) => Promise<void>
  loading?: boolean
}

export const CajaControl: React.FC<CajaControlProps> = ({
  caja,
  onAbrirCaja,
  onCerrarCaja,
  onActualizarTasa,
  loading
}) => {
  const [showCerrarForm, setShowCerrarForm] = useState(false)
  const [editandoTasa, setEditandoTasa] = useState(false)
  const [nuevaTasa, setNuevaTasa] = useState<number>(caja?.tasaDia || 0)

  const abrirForm = useForm<AbrirCajaFormData>({
    resolver: zodResolver(abrirCajaSchema),
    defaultValues: {
      montoApertura: 0,
      tasaDia: 0
    }
  })

  const cerrarForm = useForm<CerrarCajaFormData>({
    resolver: zodResolver(cerrarCajaSchema),
    defaultValues: {
      montoCierre: 0,
      observaciones: ''
    }
  })

  const handleAbrirCaja = async (data: AbrirCajaFormData) => {
    await onAbrirCaja(data.montoApertura, data.tasaDia)
    abrirForm.reset()
  }

  const handleCerrarCaja = async (data: CerrarCajaFormData) => {
    await onCerrarCaja(data.montoCierre, data.observaciones)
    cerrarForm.reset()
    setShowCerrarForm(false)
  }

  const handleActualizarTasa = async () => {
    if (onActualizarTasa && nuevaTasa > 0) {
      await onActualizarTasa(nuevaTasa)
      setEditandoTasa(false)
    }
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  // Si no hay caja abierta, mostrar formulario para abrir
  if (!caja || caja.estado === 'cerrada') {
    return (
      <Card title="Abrir Caja">
        <form onSubmit={abrirForm.handleSubmit(handleAbrirCaja)} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                Fecha: <span className="font-medium">{format(new Date(), 'dd/MM/yyyy', { locale: es })}</span>
              </p>
            </div>
          </div>

          <Input
            label="Monto de Apertura (Bs)"
            type="number"
            step="0.01"
            {...abrirForm.register('montoApertura', { valueAsNumber: true })}
            error={abrirForm.formState.errors.montoApertura?.message}
            disabled={loading}
            placeholder="0.00"
          />

          <Input
            label="Tasa del Día (Bs/USD)"
            type="number"
            step="0.01"
            {...abrirForm.register('tasaDia', { valueAsNumber: true })}
            error={abrirForm.formState.errors.tasaDia?.message}
            disabled={loading}
            placeholder="0.00"
          />

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> La tasa del día se utilizará para calcular el monto en bolívares de los pagos en Zelle.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center"
            >
              <LockOpenIcon className="h-4 w-4 mr-2" />
              {loading ? 'Abriendo...' : 'Abrir Caja'}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  // Si hay caja abierta, mostrar información y opción de cerrar
  return (
    <Card title="Caja Abierta">
      <div className="space-y-4">
        {/* Información de la caja */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <CalendarIcon className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-sm font-medium text-gray-700">Fecha</p>
            </div>
            <p className="text-lg font-semibold">
              {formatearFecha(caja.fecha)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-sm font-medium text-gray-700">Hora de Apertura</p>
            </div>
            <p className="text-lg font-semibold">
              {format(caja.horaApertura, 'HH:mm', { locale: es })}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-2">
              <UserIcon className="h-5 w-5 text-gray-500 mr-2" />
              <p className="text-sm font-medium text-gray-700">Cajero</p>
            </div>
            <p className="text-lg font-semibold">
              {caja.usuario?.full_name || caja.usuario?.email || 'Usuario'}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm font-medium text-gray-700 mb-2">Monto de Apertura</p>
            <p className="text-lg font-semibold">
              Bs. {formatMonto(caja.montoApertura)}
            </p>
          </div>
        </div>

        {/* Tasa del día */}
        <div className="bg-blue-50 p-4 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-700">Tasa del Día</p>
                {editandoTasa ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="number"
                      step="0.01"
                      value={nuevaTasa}
                      onChange={(e) => setNuevaTasa(parseFloat(e.target.value) || 0)}
                      className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={loading}
                    />
                    <Button
                      size="sm"
                      onClick={handleActualizarTasa}
                      disabled={loading || nuevaTasa <= 0}
                    >
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditandoTasa(false)
                        setNuevaTasa(caja.tasaDia)
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <p className="text-xl font-bold text-blue-800">
                    Bs. {formatMonto(caja.tasaDia)} / USD
                  </p>
                )}
              </div>
            </div>
            {!editandoTasa && onActualizarTasa && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditandoTasa(true)}
                disabled={loading}
              >
                Editar Tasa
              </Button>
            )}
          </div>
        </div>

        {/* Resumen de pagos */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Resumen de Pagos</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <BanknotesIcon className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm font-medium text-green-700">Pagos Móviles</p>
              </div>
              <p className="text-2xl font-bold text-green-800">
                {caja.cantidadPagosMovil}
              </p>
              <p className="text-sm text-green-600 mt-1">
                Bs. {formatMonto(caja.totalPagosMovil)}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-sm font-medium text-blue-700">Pagos Zelle</p>
              </div>
              <p className="text-2xl font-bold text-blue-800">
                {caja.cantidadZelle}
              </p>
              <div className="text-sm text-blue-600 mt-1">
                <p>$ {formatMonto(caja.totalZelleUsd)}</p>
                <p>Bs. {formatMonto(caja.totalZelleBs)}</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <BanknotesIcon className="h-5 w-5 text-purple-600 mr-2" />
                <p className="text-sm font-medium text-purple-700">Total General</p>
              </div>
              <p className="text-2xl font-bold text-purple-800">
                Bs. {formatMonto(caja.totalPagosMovil + caja.totalZelleBs)}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                {caja.cantidadPagosMovil + caja.cantidadZelle} transacciones
              </p>
            </div>
          </div>
        </div>

        {/* Formulario para cerrar caja */}
        {showCerrarForm ? (
          <form onSubmit={cerrarForm.handleSubmit(handleCerrarCaja)} className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Cerrar Caja</h4>
            
            <Input
              label="Monto de Cierre (Bs)"
              type="number"
              step="0.01"
              {...cerrarForm.register('montoCierre', { valueAsNumber: true })}
              error={cerrarForm.formState.errors.montoCierre?.message}
              disabled={loading}
              placeholder="0.00"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones (Opcional)
              </label>
              <textarea
                {...cerrarForm.register('observaciones')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Alguna observación sobre el cierre..."
                disabled={loading}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCerrarForm(false)
                  cerrarForm.reset()
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={loading}
                className="flex items-center"
              >
                <LockClosedIcon className="h-4 w-4 mr-2" />
                {loading ? 'Cerrando...' : 'Cerrar Caja'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end border-t pt-4">
            <Button
              onClick={() => setShowCerrarForm(true)}
              variant="danger"
              className="flex items-center"
            >
              <LockClosedIcon className="h-4 w-4 mr-2" />
              Cerrar Caja
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}