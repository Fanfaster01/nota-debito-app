// src/components/depositos/FormularioDeposito.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAsyncForm } from '@/hooks/useAsyncState'
import { 
  bancosDepositosService, 
  depositosService 
} from '@/lib/services/depositosService'
import { companyService } from '@/lib/services/adminServices'
import { BancoDepositoUI, DepositoFormData, DepositoBancarioUI } from '@/types/depositos'
import { previewDepositoPDF } from '@/utils/pdfDepositosBancarios'
import { Company } from '@/types/database'
import { 
  BanknotesIcon,
  BuildingLibraryIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const depositoSchema = z.object({
  bancoId: z.string().min(1, 'Selecciona un banco'),
  companyId: z.string().optional(),
  montoBs: z.number().min(0, 'El monto no puede ser negativo'),
  observaciones: z.string().optional(),
})

type DepositoFormInputs = z.infer<typeof depositoSchema>

interface Props {
  onSuccess: () => void
  onError: (error: string) => void
}

export function FormularioDeposito({ onSuccess, onError }: Props) {
  const { user, company } = useAuth()
  const [bancos, setBancos] = useState<BancoDepositoUI[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  // Estado unificado con useAsyncForm
  const submitState = useAsyncForm<DepositoFormData>()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<DepositoFormInputs>({
    resolver: zodResolver(depositoSchema),
    defaultValues: {
      companyId: user?.role !== 'master' ? company?.id : undefined
    }
  })

  const selectedBancoId = watch('bancoId')
  const selectedCompanyId = watch('companyId')
  
  const bancoSeleccionado = bancos.find(b => b.id === selectedBancoId)
  const companySeleccionada = companies.find(c => c.id === selectedCompanyId) || company

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoadingData(true)
    onError('')

    try {
      // Cargar bancos
      const { data: bancosData, error: bancosError } = await bancosDepositosService.getBancos()
      if (bancosError) {
        const errorMessage = bancosError instanceof Error ? bancosError.message : 'Error desconocido'
        onError('Error al cargar bancos: ' + errorMessage)
        return
      }
      setBancos(bancosData || [])

      // Cargar compañías solo si es Master
      if (user?.role === 'master') {
        const { data: companiesData, error: companiesError } = await companyService.getAllCompanies()
        if (companiesError) {
          const errorMessage = companiesError instanceof Error ? companiesError.message : 'Error desconocido'
          onError('Error al cargar compañías: ' + errorMessage)
          return
        }
        setCompanies(companiesData?.filter(c => c.is_active) || [])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      onError('Error al cargar datos: ' + errorMessage)
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = async (data: DepositoFormInputs) => {
    if (!user) return
    
    onError('')
    
    // Guardar el resultado del depósito en una variable separada
    let depositoCreado: DepositoBancarioUI | null = null

    const result = await submitState.executeWithValidation(
      async () => {
        const formData: DepositoFormData = {
          bancoId: data.bancoId,
          companyId: user.role === 'master' ? data.companyId : undefined,
          montoBs: data.montoBs,
          observaciones: data.observaciones
        }

        const companyIdToUse = user.role === 'master' 
          ? (data.companyId || '') 
          : (company?.id || '')

        if (!companyIdToUse) {
          throw new Error('No se pudo determinar la compañía para el depósito')
        }

        const { data: deposito, error: createError } = await depositosService.createDeposito(
          formData, 
          user.id, 
          companyIdToUse
        )

        if (createError) {
          const errorMessage = createError instanceof Error ? createError.message : 'Error desconocido'
          throw new Error('Error al crear depósito: ' + errorMessage)
        }

        if (!deposito) {
          throw new Error('No se pudo crear el depósito')
        }

        // Guardar el depósito para usar después
        depositoCreado = deposito

        // Mostrar vista previa del recibo automáticamente
        try {
          await previewDepositoPDF(deposito.id, depositosService.getReciboData.bind(depositosService))
        } catch (pdfError: unknown) {
          console.error('Error al mostrar vista previa:', pdfError)
          // No mostrar error de vista previa, el depósito se creó exitosamente
        }

        // Retornar los datos del formulario para compatibilidad de tipos
        return formData
      },
      'Error al crear depósito'
    )
    
    if (result) {
      reset()
      onSuccess()
      
      // Mostrar mensaje de éxito con el número de recibo si está disponible
      if (depositoCreado && typeof depositoCreado === 'object' && 'numeroRecibo' in depositoCreado) {
        alert('Depósito creado exitosamente. Recibo #' + (depositoCreado as DepositoBancarioUI).numeroRecibo.toString().padStart(4, '0'))
      } else {
        alert('Depósito creado exitosamente.')
      }
    } else if (submitState.error) {
      onError(submitState.error)
    }
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <DocumentTextIcon className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-medium text-gray-900">Nuevo Recibo de Depósito</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selector de Banco */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BuildingLibraryIcon className="h-4 w-4 inline mr-1" />
              Banco de Destino *
            </label>
            <select
              {...register('bancoId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={submitState.loading}
            >
              <option value="">Seleccionar banco...</option>
              {bancos.map((banco) => (
                <option key={banco.id} value={banco.id}>
                  {banco.nombre} - {banco.numeroCuenta}
                </option>
              ))}
            </select>
            {errors.bancoId && (
              <p className="mt-1 text-sm text-red-600">{errors.bancoId.message}</p>
            )}
          </div>

          {/* Selector de Compañía (solo Master) */}
          {user?.role === 'master' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                Empresa *
              </label>
              <select
                {...register('companyId')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={submitState.loading}
              >
                <option value="">Seleccionar empresa...</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name} - {comp.rif}
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId.message}</p>
              )}
            </div>
          )}

          {/* Monto del Depósito */}
          <div>
            <Input
              label="Monto a Depositar (Bs.) *"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('montoBs', { valueAsNumber: true })}
              error={errors.montoBs?.message}
              disabled={submitState.loading}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              {...register('observaciones')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales (opcional)"
              disabled={submitState.loading}
            />
          </div>
        </div>

        {/* Vista previa del recibo */}
        {bancoSeleccionado && companySeleccionada && (
          <div className="bg-gray-50 p-4 rounded-md border">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Vista Previa del Recibo:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Empresa:</span> {companySeleccionada.name}
              </div>
              <div>
                <span className="font-medium">RIF:</span> {companySeleccionada.rif}
              </div>
              <div>
                <span className="font-medium">Banco:</span> {bancoSeleccionado.nombre}
              </div>
              <div>
                <span className="font-medium">Cuenta:</span> {bancoSeleccionado.numeroCuenta}
              </div>
              <div>
                <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-VE')}
              </div>
              <div>
                <span className="font-medium">Usuario:</span> {user?.full_name}
              </div>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => reset()}
            disabled={submitState.loading}
          >
            Limpiar
          </Button>
          <Button 
            type="submit"
            disabled={submitState.loading || !selectedBancoId || (user?.role === 'master' && !selectedCompanyId)}
          >
            {submitState.loading ? 'Generando...' : 'Generar Recibo'}
          </Button>
        </div>
      </form>

      {/* Información adicional */}
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Información:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• El recibo se generará automáticamente con numeración consecutiva</li>
          <li>• La fecha se registra automáticamente con la fecha actual</li>
          <li>• El recibo incluirá todos los datos fiscales necesarios</li>
          <li>• Podrás descargar el PDF desde la sección de consultas</li>
        </ul>
      </div>
    </div>
  )
}