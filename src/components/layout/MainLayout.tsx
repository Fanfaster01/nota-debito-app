// src/components/layout/MainLayout.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { LoginForm } from '@/components/auth/LoginForm'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import { settingsService } from '@/lib/services/settingsService'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UsersIcon, 
  DocumentTextIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  CreditCardIcon,
  DocumentChartBarIcon,
  BuildingLibraryIcon,
  ReceiptPercentIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Gestión de Cajas', href: '/cajas', icon: BanknotesIcon },
]

const adminNavigation = [
  { name: 'Proveedores', href: '/proveedores', icon: BuildingStorefrontIcon },
  { name: 'Cuentas por Pagar', href: '/cuentas-por-pagar', icon: ReceiptPercentIcon },
  { name: 'Comparador de Precios', href: '/comparador-precios', icon: ScaleIcon },
  { name: 'Consulta Notas de Débito', href: '/notas-debito', icon: DocumentTextIcon },
  { name: 'Ventas a Crédito', href: '/ventas-credito', icon: CreditCardIcon },
  { name: 'Depósitos Bancarios', href: '/depositos-bancarios', icon: BuildingLibraryIcon },
  { name: 'Cierres de Caja', href: '/cierres-caja', icon: DocumentChartBarIcon },
]

const masterNavigation = [
  { name: 'Proveedores', href: '/proveedores', icon: BuildingStorefrontIcon },
  { name: 'Cuentas por Pagar', href: '/cuentas-por-pagar', icon: ReceiptPercentIcon },
  { name: 'Comparador de Precios', href: '/comparador-precios', icon: ScaleIcon },
  { name: 'Ventas a Crédito', href: '/ventas-credito', icon: CreditCardIcon },
  { name: 'Depósitos Bancarios', href: '/depositos-bancarios', icon: BuildingLibraryIcon },
  { name: 'Cierres de Caja', href: '/cierres-caja', icon: DocumentChartBarIcon },
  { name: 'Compañías', href: '/admin/companies', icon: BuildingOfficeIcon },
  { name: 'Usuarios', href: '/admin/users', icon: UsersIcon },
  { name: 'Configuración', href: '/admin/settings', icon: CogIcon },
]

export function MainLayout({ children }: MainLayoutProps) {
  const { authUser, user, company, loading, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appName, setAppName] = useState('Admin DSL')
  const pathname = usePathname()

  // Cargar el nombre de la app desde la configuración
  useEffect(() => {
    const loadAppName = async () => {
      try {
        const { data } = await settingsService.getSetting('app_name')
        if (data) {
          setAppName(data as string)
        }
      } catch (error) {
        console.error('Error loading app name:', error)
        // Mantener el valor por defecto si falla
      }
    }

    loadAppName()

    // Actualizar el nombre cuando el usuario navega (especialmente útil después de cambiar configuraciones)
    const intervalId = setInterval(loadAppName, 30000) // Verificar cada 30 segundos

    return () => clearInterval(intervalId)
  }, [])

  // Función para forzar actualización del nombre (útil para otros componentes)
  const refreshAppName = async () => {
    try {
      const { data } = await settingsService.getSetting('app_name')
      if (data) {
        setAppName(data as string)
      }
    } catch (error) {
      console.error('Error refreshing app name:', error)
    }
  }

  // Escuchar cambios en la ruta para actualizar el nombre si venimos de configuraciones
  useEffect(() => {
    if (pathname.includes('/admin/settings')) {
      // Refrescar el nombre después de un pequeño delay para permitir que se guarden los cambios
      const timeoutId = setTimeout(refreshAppName, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [pathname])

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

  // Si el usuario está autenticado pero no tiene compañía (y no es master), mostrar mensaje
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

  const availableNavigation = user.role === 'master' 
    ? [...navigation, ...masterNavigation] 
    : user.role === 'admin'
    ? [...navigation, ...adminNavigation]
    : navigation

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para móvil */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-0 flex">
          <div className="relative mr-16 flex w-full max-w-xs flex-1">
            <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
              <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 px-6 pb-2">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-white">{appName}</h1>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {availableNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 ${
                                isActive
                                  ? 'bg-orange-500/20 text-white border border-orange-500/30'
                                  : 'text-gray-300 hover:text-white hover:bg-white/10'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className={`h-6 w-6 shrink-0 ${
                                isActive 
                                  ? 'text-orange-500' 
                                  : 'text-gray-400 group-hover:text-orange-400'
                              }`} />
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-800 bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold text-white">{appName}</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {availableNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors duration-200 ${
                            isActive
                              ? 'bg-orange-500/20 text-white border border-orange-500/30'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <item.icon className={`h-6 w-6 shrink-0 ${
                            isActive 
                              ? 'text-orange-500' 
                              : 'text-gray-400 group-hover:text-orange-400'
                          }`} />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-72">
        {/* Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 hover:text-orange-500 lg:hidden transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="h-6 w-px bg-gray-200 lg:hidden" />

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              {company && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{company.name}</span>
                  <span className="ml-2 text-gray-400">({company.rif})</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationCenter />
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

        {/* Contenido */}
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}