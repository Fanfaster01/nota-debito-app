// src/components/cajas/PagoZelleList.tsx
import React, { useState } from 'react'
import { PagoZelleUI } from '@/types/caja'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  PencilIcon, 
  TrashIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PagoZelleListProps {
  pagosZelle: PagoZelleUI[]
  onEdit: (pago: PagoZelleUI) => void
  onDelete: (pagoId: string) => void
  loading?: boolean
}

export const PagoZelleList: React.FC<PagoZelleListProps> = ({
  pagosZelle,
  onEdit,
  onDelete,
  loading
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDelete = (pagoId: string) => {
    onDelete(pagoId)
    setDeleteConfirm(null)
  }

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  if (pagosZelle.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay pagos Zelle registrados</p>
          <p className="text-sm text-gray-400 mt-2">
            Los pagos que registres aparecerán aquí
          </p>
        </div>
      </Card>
    )
  }

  const totalUsd = pagosZelle.reduce((sum, pago) => sum + pago.montoUsd, 0)
  const totalBs = pagosZelle.reduce((sum, pago) => sum + pago.montoBs, 0)

  return (
    <>
      <Card title={`Pagos Zelle Registrados (${pagosZelle.length})`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hora
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teléfono
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto USD
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Bs
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pagosZelle.map((pago) => (
                <tr key={pago.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(pago.fechaHora, 'HH:mm', { locale: es })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pago.nombreCliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pago.telefono}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    $ {formatMonto(pago.montoUsd)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {formatMonto(pago.tasa)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatMonto(pago.montoBs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => onEdit(pago)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      disabled={loading}
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(pago.id!)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                  $ {formatMonto(totalUsd)}
                </td>
                <td></td>
                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">
                  {formatMonto(totalBs)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar Pago Zelle?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. El pago será eliminado permanentemente.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={loading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}