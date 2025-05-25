// src/components/notas-debito/QuickSummary.tsx
import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalculatorIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'

interface QuickSummaryProps {
  stats: {
    totalNotas: number
    montoTotalDiferencial: number
    montoTotalFinal: number
  }
  loading?: boolean
}

export const QuickSummary: React.FC<QuickSummaryProps> = ({ stats, loading }) => {
  const summaryItems = [
    {
      label: 'Total de Notas',
      value: stats.totalNotas,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      format: 'number'
    },
    {
      label: 'Diferencial Total',
      value: stats.montoTotalDiferencial,
      icon: CalculatorIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      format: 'currency'
    },
    {
      label: 'Monto Total Final',
      value: stats.montoTotalFinal,
      icon: BanknotesIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      format: 'currency'
    },
    {
      label: 'Promedio por Nota',
      value: stats.totalNotas > 0 ? stats.montoTotalFinal / stats.totalNotas : 0,
      icon: CurrencyDollarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      format: 'currency'
    }
  ]

  const formatValue = (value: number, format: string) => {
    if (format === 'currency') {
      return `Bs. ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    }
    return value.toString()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-gray-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryItems.map((item, index) => {
        const Icon = item.icon
        return (
          <Card key={index}>
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${item.bgColor} mr-4`}>
                <Icon className={`h-6 w-6 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{item.label}</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatValue(item.value, item.format)}
                </p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}