'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cajaService } from '@/lib/services/cajaService'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ClienteSearch } from '@/components/forms/ClienteSearch'
import { ClienteUI } from '@/lib/services/clienteService'
import type { CreditoCajaUI } from '@/types/caja'
import { useAsyncForm } from '@/hooks/useAsyncState'

const creditoCajaSchema = z.object({
  numeroFactura: z.string()
    .min(1, 'El número de factura es requerido')
    .regex(/^\d+$/, 'Solo se permiten números'),
  nombreCliente: z.string()
    .min(1, 'El nombre del cliente es requerido')
    .min(3, 'El nombre debe tener al menos 3 caracteres'),
  telefonoCliente: z.string()
    .min(1, 'El teléfono es requerido')
    .regex(/^[\d-+() ]+$/, 'Formato de teléfono inválido'),
  montoBs: z.number()
    .positive('El monto debe ser mayor a 0')
})

type CreditoCajaFormData = z.infer<typeof creditoCajaSchema>

interface CreditoCajaFormProps {
  cajaId: string
  tasaDia: number
  onSuccess: (credito: CreditoCajaUI) => void
  onCancel: () => void
}

export default function CreditoCajaForm({ cajaId, tasaDia, onSuccess, onCancel }: CreditoCajaFormProps) {
  const { user } = useAuth()
  
  // Estado unificado con useAsyncForm
  const saveState = useAsyncForm<CreditoCajaUI>()
  
  // Estados locales
  const [selectedCliente, setSelectedCliente] = useState<ClienteUI | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CreditoCajaFormData>({
    resolver: zodResolver(creditoCajaSchema),
    defaultValues: {
      numeroFactura: '',
      nombreCliente: '',
      telefonoCliente: '',
      montoBs: 0
    }
  })

  // Cuando se selecciona un cliente, actualizar los campos del formulario
  useEffect(() => {
    if (selectedCliente) {
      setValue('nombreCliente', selectedCliente.nombre)
      setValue('telefonoCliente', selectedCliente.telefono || '')
    }
  }, [selectedCliente, setValue])

  const montoBs = watch('montoBs')
  const montoUsd = montoBs && tasaDia > 0 ? (montoBs / tasaDia).toFixed(2) : '0.00'

  const onSubmit = async (data: CreditoCajaFormData) => {
    if (!user || !user.id || !user.company_id) {
      saveState.setData(null)
      console.error('Usuario incompleto:', user)
      return
    }

    const result = await saveState.executeWithValidation(
      async () => {
        const nuevoCredito: Omit<CreditoCajaUI, 'id' | 'fechaHora' | 'montoUsd' | 'tasa' | 'estado'> = {
          cajaId,
          clienteId: selectedCliente?.id || null,
          numeroFactura: data.numeroFactura,
          nombreCliente: data.nombreCliente,
          telefonoCliente: data.telefonoCliente,
          montoBs: data.montoBs,
          userId: user.id,
          companyId: user.company_id!
        }

        const { data: creditoCreado, error: createError } = await cajaService.agregarCreditoCaja(nuevoCredito)

        if (createError) {
          throw createError
        }

        if (!creditoCreado) {
          throw new Error('No se pudo crear el crédito')
        }

        return creditoCreado
      },
      'Error al crear el crédito'
    )

    if (result) {
      reset()
      onSuccess(result)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {saveState.error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {saveState.error}
        </div>
      )}

      {/* Búsqueda de cliente */}
      <ClienteSearch
        onClienteSelect={(cliente) => setSelectedCliente(cliente)}
        disabled={saveState.loading}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nro de Factura"
          type="text"
          placeholder="00000"
          {...register('numeroFactura')}
          error={errors.numeroFactura?.message}
        />

        <Input
          label="Monto en Bs"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register('montoBs', { valueAsNumber: true })}
          error={errors.montoBs?.message}
        />
      </div>

      {montoBs > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-700">Monto en USD (calculado):</span>
            <span className="text-lg font-semibold text-blue-900">$ {montoUsd}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Tasa del día: Bs {tasaDia.toFixed(2)} / USD
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Esta factura se registrará como crédito pendiente de pago y se sumará al total de ventas del día.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saveState.loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saveState.loading}
        >
          {saveState.loading ? 'Agregando...' : 'Agregar Crédito'}
        </Button>
      </div>
    </form>
  )
}