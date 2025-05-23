// src/components/layout/ProtectedLayout.tsx
'use client';

import React from 'react';
import { useAuth, usePermissions } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedLayout({ children, requiredPermission }: ProtectedLayoutProps) {
  const { user, userProfile, loading } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return <LoginForm />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// src/components/layout/Navbar.tsx
export function Navbar() {
  const { userProfile, signOut } = useAuth();
  const { isMaster, isAdmin } = usePermissions();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Notas de Débito
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{userProfile?.full_name || userProfile?.email}</span>
              {isMaster() && <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Master</span>}
              {isAdmin() && !isMaster() && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Admin</span>}
            </div>
            
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// src/components/layout/Sidebar.tsx
export function Sidebar() {
  const { isMaster, isAdmin, hasPermission } = usePermissions();

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      permission: null,
    },
    {
      name: 'Notas de Débito',
      href: '/notas-debito',
      icon: '📄',
      permission: 'notas_debito',
    },
    {
      name: 'Facturas',
      href: '/facturas',
      icon: '🧾',
      permission: 'facturas',
    },
    {
      name: 'Reportes',
      href: '/reportes',
      icon: '📈',
      permission: 'reportes',
    },
  ];

  const adminMenuItems = [
    {
      name: 'Usuarios',
      href: '/usuarios',
      icon: '👥',
      permission: 'usuarios',
    },
    {
      name: 'Configuración',
      href: '/configuracion',
      icon: '⚙️',
      permission: 'configuracion',
    },
  ];

  return (
    <div className="w-64 bg-white h-screen shadow-sm border-r">
      <div className="p-6">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </a>
            );
          })}

          {(isMaster() || isAdmin()) && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administración
                </p>
              </div>
              
              {adminMenuItems.map((item) => {
                if (item.permission && !hasPermission(item.permission)) {
                  return null;
                }

                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </a>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  );
}