// src/components/creditos/ResumenCreditosCard.tsx
import React from 'react'
import { ResumenCreditos } from '@/types/creditos'
import { Card } from '@/components/ui/Card'
import { 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

interface ResumenCreditosCardProps {
  resumen: ResumenCreditos
}

export default function ResumenCreditosCard({ resumen }: ResumenCreditosCardProps) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const cards = [
    {
      title: 'Total Créditos',
      value: resumen.totalCreditos,
      icon: CreditCardIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pendientes',
      value: resumen.creditosPendientes,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Pagados',
      value: resumen.creditosPagados,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Vencidos',
      value: resumen.creditosVencidos,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
            </div>
            <div className={`p-3 rounded-full ${card.bgColor}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </Card>
      ))}

      {/* Tarjeta de montos */}
      <Card className="p-6 md:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Resumen Financiero</h3>
          <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Monto Pendiente Total:</span>
            <span className="text-sm font-semibold text-gray-900">Bs {formatMoney(resumen.montoPendienteTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Monto Abonado:</span>
            <span className="text-sm font-semibold text-gray-900">Bs {formatMoney(resumen.montoAbonado)}</span>
          </div>
        </div>
      </Card>

      {/* Tarjeta de clientes */}
      <Card className="p-6 md:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Clientes con Crédito</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{resumen.clientesConCredito}</p>
          </div>
          <div className="p-3 rounded-full bg-purple-100">
            <UsersIcon className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </Card>
    </div>
  )
}