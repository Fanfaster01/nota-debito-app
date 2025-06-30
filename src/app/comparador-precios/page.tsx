// src/app/comparador-precios/page.tsx

'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { ComparadorPreciosContent } from '@/components/comparador-precios/ComparadorPreciosContent'
import { Card } from '@/components/ui/Card'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ComparadorPreciosPage() {
  const { user } = useAuth()

  // Solo admin y master pueden acceder
  if (!user || (user.role !== 'admin' && user.role !== 'master')) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <Card title="Acceso Denegado">
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600">
                Solo los administradores y usuarios master pueden acceder al comparador de precios.
              </p>
            </div>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <ComparadorPreciosContent />
      </div>
    </MainLayout>
  )
}