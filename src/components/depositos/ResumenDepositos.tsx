// src/components/depositos/ResumenDepositos.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { depositosService } from '@/lib/services/depositosService'
import { ResumenDepositos as ResumenDepositosType } from '@/types/depositos'
import { 
  BanknotesIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

export function ResumenDepositos() {
  const { user, company } = useAuth()
  const [resumen, setResumen] = useState<ResumenDepositosType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResumen()
  }, [user, company])

  const loadResumen = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const companyId = user.role === 'master' ? undefined : company?.id
      const { data, error: resumenError } = await depositosService.getResumenDepositos(companyId)

      if (resumenError) {
        setError('Error al cargar resumen: ' + resumenError.message)
        return
      }

      setResumen(data)
    } catch (err: any) {
      setError('Error al cargar resumen: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded"></div>
                <div className="ml-4 flex-1">
                  <div className="w-20 h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="w-16 h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadResumen}
          className="mt-2 text-sm text-red-500 hover:text-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!resumen) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Depósitos */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BanknotesIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Total Depósitos</p>
            <p className="text-2xl font-bold text-gray-900">{resumen.totalDepositos}</p>
          </div>
        </div>
      </Card>

      {/* Monto Total */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Monto Total</p>
            <p className="text-2xl font-bold text-gray-900">
              Bs. {resumen.montoTotalBs.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Depósitos Hoy */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CalendarDaysIcon className="h-8 w-8 text-orange-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Hoy</p>
            <p className="text-2xl font-bold text-gray-900">{resumen.depositosHoy}</p>
            <p className="text-xs text-gray-500">
              Bs. {resumen.montoHoyBs.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Banco Más Usado */}
      <Card>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BuildingLibraryIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Banco Más Usado</p>
            {resumen.bancoMasUsado ? (
              <>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {resumen.bancoMasUsado.banco.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  {resumen.bancoMasUsado.cantidad} depósitos
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-gray-400">Sin datos</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}