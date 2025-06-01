// src/components/creditos/CreditosList.tsx
import React from 'react'
import { CreditoDetalladoUI } from '@/types/creditos'
import { Button } from '@/components/ui/Button'
import { 
  EyeIcon,
  PencilIcon,
  CreditCardIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CreditosListProps {
  creditos: CreditoDetalladoUI[]
  loading: boolean
  onViewDetail: (credito: CreditoDetalladoUI) => void
  onEdit: (credito: CreditoDetalladoUI) => void
  onAbono: (credito: CreditoDetalladoUI) => void
  onRefresh: () => void
}

export default function CreditosList({ 
  creditos, 
  loading, 
  onViewDetail, 
  onEdit, 
  onAbono,
  onRefresh 
}: CreditosListProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const getEstadoBadge = (estado: string) => {
    const badges = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'pagado': 'bg-green-100 text-green-800'
    }
    return badges[estado as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getVencimientoBadge = (estadoVencimiento: string) => {
    const badges = {
      'Pagado': 'bg-green-100 text-green-800',
      'Vigente': 'bg-blue-100 text-blue-800',
      'Por vencer': 'bg-yellow-100 text-yellow-800',
      'Vencido': 'bg-red-100 text-red-800'
    }
    return badges[estadoVencimiento as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="border-b border-gray-200 pb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (creditos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay créditos</h3>
        <p className="text-gray-600 mb-4">No se encontraron créditos con los filtros aplicados.</p>
        <Button onClick={onRefresh}>
          Actualizar
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Créditos ({creditos.length})
          </h3>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {creditos.map((credito) => (
          <div key={credito.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Factura #{credito.numeroFactura}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(credito.estado)}`}>
                    {credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVencimientoBadge(credito.estadoVencimiento)}`}>
                    {credito.estadoVencimiento}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Cliente */}
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{credito.nombreCliente}</p>
                      {credito.cliente && (
                        <p className="text-xs">
                          {credito.cliente.tipoDocumento}-{credito.cliente.numeroDocumento}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Fecha */}
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <p>Fecha: {format(credito.fechaHora, 'dd/MM/yyyy', { locale: es })}</p>
                      {credito.fechaVencimiento && (
                        <p className="text-xs">
                          Vence: {format(credito.fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Montos */}
                  <div className="flex items-center text-sm text-gray-600">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Bs {formatMoney(credito.montoBs)}</p>
                      {credito.montoAbonado > 0 && (
                        <p className="text-xs text-green-600">
                          Abonado: Bs {formatMoney(credito.montoAbonado)}
                        </p>
                      )}
                      {credito.saldoPendiente > 0 && (
                        <p className="text-xs text-red-600">
                          Pendiente: Bs {formatMoney(credito.saldoPendiente)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {credito.observaciones && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Observaciones:</span> {credito.observaciones}
                    </p>
                  </div>
                )}

                {/* Progreso de pago */}
                {credito.estado === 'pendiente' && credito.montoAbonado > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progreso de pago</span>
                      <span>{Math.round((credito.montoAbonado / credito.montoBs) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(credito.montoAbonado / credito.montoBs) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="secondary"
                  onClick={() => onViewDetail(credito)}
                  className="flex items-center"
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={() => onEdit(credito)}
                  className="flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Editar
                </Button>

                {credito.estado === 'pendiente' && (
                  <Button
                    onClick={() => onAbono(credito)}
                    className="flex items-center"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Abonar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}