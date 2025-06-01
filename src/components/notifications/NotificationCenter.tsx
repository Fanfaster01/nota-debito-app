// src/components/notifications/NotificationCenter.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { notificationService, NotificacionCredito } from '@/lib/services/notificationService'
import { 
  BellIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationCenter() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificacionCredito[]>([])
  const [alertStats, setAlertStats] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Solo mostrar para usuarios Master y Admin
  const canAccess = user?.role === 'master' || user?.role === 'admin'
  const isMaster = user?.role === 'master'

  useEffect(() => {
    if (canAccess) {
      loadNotifications()
      loadAlertStats()
      
      // Actualizar cada 5 minutos
      const interval = setInterval(() => {
        loadNotifications()
        loadAlertStats()
      }, 5 * 60 * 1000)

      return () => clearInterval(interval)
    }
  }, [user, canAccess])

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    const companyId = isMaster ? undefined : user.company_id!
    const { data } = await notificationService.generateNotifications(companyId)
    
    if (data) {
      setNotifications(data)
    }
    setLoading(false)
  }

  const loadAlertStats = async () => {
    if (!user) return
    
    const companyId = isMaster ? undefined : user.company_id!
    const { data } = await notificationService.getAlertStats(companyId)
    
    if (data) {
      setAlertStats(data)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vencido':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'vencimiento_proximo':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'pago_recibido':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <BellIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      default:
        return 'border-l-blue-500 bg-blue-50'
    }
  }

  const totalNotifications = notifications.length
  const highPriorityCount = notifications.filter(n => n.priority === 'high').length

  if (!canAccess) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icono de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
      >
        <BellIcon className="h-6 w-6" />
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notificaciones</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {alertStats && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div className="text-red-600">
                  Vencidos: {alertStats.creditosVencidos}
                </div>
                <div className="text-yellow-600">
                  Por vencer: {alertStats.creditosProximosAVencer}
                </div>
              </div>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(notification.createdAt, 'HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={loadNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Actualizar notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}