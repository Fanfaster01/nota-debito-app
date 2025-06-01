// src/components/layout/ProtectedLayout.tsx
'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LoginForm } from '@/components/auth/LoginForm'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { authUser, user, company, loading, signOut } = useAuth()

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario autenticado, mostrar login
  if (!authUser || !user) {
    return <LoginForm />
  }

  // Si el usuario está autenticado pero no tiene compañía, mostrar mensaje
  if (!company && user.role !== 'master') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Pendiente
              </h2>
              <p className="text-gray-600 mb-6">
                Tu cuenta está pendiente de ser asignada a una compañía. 
                Por favor contacta al administrador para obtener acceso.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p><strong>Usuario:</strong> {user.full_name || user.email}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Rol:</strong> {user.role}</p>
              </div>
              <div className="mt-6">
                <Button variant="outline" onClick={() => signOut()}>
                  Cerrar Sesión
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Usuario autenticado y con acceso, mostrar header y contenido
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Generador de Notas de Débito
              </h1>
              {company && (
                <span className="ml-4 text-sm text-gray-500">
                  {company.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.full_name || user.email}</span>
                <span className="ml-2 text-gray-400">({user.role})</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        {children}
      </main>
    </div>
  )
}