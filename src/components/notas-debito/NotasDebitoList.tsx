// src/components/notas-debito/NotasDebitoList.tsx
import React, { useState } from 'react'
import { NotaDebito } from '@/types'
import { Button } from '@/components/ui/Button'
import { 
  DocumentArrowDownIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { formatearFecha } from '@/utils/dateUtils'
import { NotaDebitoPDFDownloadLink } from '@/components/pdf/NotaDebitoPDF'
import { calcularMontoFinalPagar } from '@/lib/calculations'

interface NotasDebitoListProps {
  notasDebito: NotaDebito[]
  onEdit: (nota: NotaDebito) => void
  onDelete: (nota: NotaDebito) => void
  onViewDetails: (nota: NotaDebito) => void
  loading?: boolean
}

export const NotasDebitoList: React.FC<NotasDebitoListProps> = ({
  notasDebito,
  onEdit,
  onDelete,
  onViewDetails,
  loading
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleDeleteConfirm = (nota: NotaDebito) => {
    onDelete(nota)
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (notasDebito.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No se encontraron notas de débito</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factura
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tasa Original → Pago
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Diferencial
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Final
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notasDebito.map((nota) => {
              const montoFinal = calcularMontoFinalPagar(
                nota.factura,
                nota.notasCredito || [],
                nota
              )
              
              return (
                <tr key={nota.numero}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ND-{nota.numero}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatearFecha(nota.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{nota.factura.proveedor.nombre}</div>
                    <div className="text-sm text-gray-500">{nota.factura.proveedor.rif}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {nota.factura.numero}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span>{nota.tasaCambioOriginal.toFixed(2)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{nota.tasaCambioPago.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Bs. {nota.diferencialCambiarioConIVA.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Bs. {montoFinal.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewDetails(nota)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onEdit(nota)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <NotaDebitoPDFDownloadLink 
                        notaDebito={nota} 
                        montoFinalPagar={montoFinal}
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </NotaDebitoPDFDownloadLink>
                      
                      <button
                        onClick={() => setDeleteConfirm(nota.numero)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar Nota de Débito?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. La nota de débito ND-{deleteConfirm} será eliminada permanentemente.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  const nota = notasDebito.find(n => n.numero === deleteConfirm)
                  if (nota) handleDeleteConfirm(nota)
                }}
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