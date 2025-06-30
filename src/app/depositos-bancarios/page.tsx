// src/app/depositos-bancarios/page.tsx
'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { 
  BanknotesIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline'
import { FormularioDeposito } from '@/components/depositos/FormularioDeposito'
import { ConsultaDepositos } from '@/components/depositos/ConsultaDepositos'
import { GestionBancos } from '@/components/depositos/GestionBancos'
import { ResumenDepositos } from '@/components/depositos/ResumenDepositos'

type TabType = 'nuevo' | 'consulta' | 'bancos'

export default function DepositosBancariosPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('nuevo')
  const [error, setError] = useState<string | null>(null)

  // Verificar permisos de acceso - Solo Master y Admin
  const canAccess = user?.role === 'master' || user?.role === 'admin'
  const canManageBancos = user?.role === 'master'

  if (!canAccess) {
    return (
      <ProtectedLayout>
        <MainLayout>
          <div className="text-center py-8">
            <BanknotesIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h2>
            <p className="text-gray-500">
              No tienes permisos para acceder a la sección de Depósitos Bancarios.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Esta sección está disponible <strong>solo para usuarios Master y Admin</strong>.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Rol actual: {user?.role || 'No definido'}
            </p>
          </div>
        </MainLayout>
      </ProtectedLayout>
    )
  }

  const tabs = [
    {
      id: 'nuevo' as TabType,
      label: 'Nuevo Depósito',
      icon: PlusIcon,
      description: 'Generar recibo de depósito'
    },
    {
      id: 'consulta' as TabType,
      label: 'Consultar Depósitos',
      icon: MagnifyingGlassIcon,
      description: 'Ver historial de depósitos'
    },
    ...(canManageBancos ? [{
      id: 'bancos' as TabType,
      label: 'Gestionar Bancos',
      icon: BuildingLibraryIcon,
      description: 'Administrar bancos disponibles'
    }] : [])
  ]

  return (
    <ProtectedLayout>
      <MainLayout>
        <div className="space-y-6">

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Resumen de Depósitos */}
          <ResumenDepositos />

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'nuevo' && (
              <Card>
                <FormularioDeposito 
                  onSuccess={() => {
                    // Cambiar a la tab de consulta después de crear exitosamente
                    setActiveTab('consulta')
                  }}
                  onError={setError}
                />
              </Card>
            )}

            {activeTab === 'consulta' && (
              <ConsultaDepositos 
                onError={setError}
              />
            )}

            {activeTab === 'bancos' && canManageBancos && (
              <GestionBancos 
                onError={setError}
              />
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              📋 Información Importante
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los recibos de depósito se generan automáticamente con numeración consecutiva</li>
              <li>• La fecha del depósito se registra automáticamente con la fecha actual</li>
              <li>• {user?.role === 'master' 
                ? 'Como Master, puedes gestionar bancos y ver depósitos de todas las empresas'
                : 'Como Admin, solo puedes ver y crear depósitos de tu empresa asignada'
              }</li>
              <li>• Los recibos incluyen todos los datos fiscales necesarios para el respaldo contable</li>
            </ul>
          </div>
        </div>
      </MainLayout>
    </ProtectedLayout>
  )
}