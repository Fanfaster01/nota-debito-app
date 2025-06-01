// src/components/notas-debito/NotasDebitoList.tsx
import React, { useState } from 'react'
import { NotaDebito } from '@/types'
import { Button } from '@/components/ui/Button'
import { 
  DocumentArrowDownIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  DocumentTextIcon,
  ChevronUpIcon,
  ChevronDownIcon
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

type SortField = 'numero' | 'fecha' | 'proveedor' | 'tasaCambioPago' | 'diferencial' | 'montoFinal'
type SortDirection = 'asc' | 'desc'

export const NotasDebitoList: React.FC<NotasDebitoListProps> = ({
  notasDebito,
  onEdit,
  onDelete,
  onViewDetails,
  loading
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleDeleteConfirm = (nota: NotaDebito) => {
    onDelete(nota)
    setDeleteConfirm(null)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedNotasDebito = [...notasDebito].sort((a, b) => {
    if (!sortField) return 0

    let aValue: any
    let bValue: any

    switch (sortField) {
      case 'numero':
        aValue = a.numero
        bValue = b.numero
        break
      case 'fecha':
        aValue = new Date(a.fecha).getTime()
        bValue = new Date(b.fecha).getTime()
        break
      case 'proveedor':
        aValue = a.factura.proveedor.nombre.toLowerCase()
        bValue = b.factura.proveedor.nombre.toLowerCase()
        break
      case 'tasaCambioPago':
        aValue = a.tasaCambioPago
        bValue = b.tasaCambioPago
        break
      case 'diferencial':
        aValue = a.diferencialCambiarioConIVA
        bValue = b.diferencialCambiarioConIVA
        break
      case 'montoFinal':
        aValue = calcularMontoFinalPagar(a.factura, a.notasCredito || [], a)
        bValue = calcularMontoFinalPagar(b.factura, b.notasCredito || [], b)
        break
      default:
        return 0
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4" />
      : <ChevronDownIcon className="w-4 h-4" />
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
        <p className="text-sm text-gray-400 mt-2">
          Intenta ajustar los filtros de búsqueda o crear una nueva nota de débito
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('numero')}
              >
                <div className="flex items-center space-x-1">
                  <span>Número</span>
                  <SortIcon field="numero" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('fecha')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha</span>
                  <SortIcon field="fecha" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('proveedor')}
              >
                <div className="flex items-center space-x-1">
                  <span>Proveedor</span>
                  <SortIcon field="proveedor" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factura
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('tasaCambioPago')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tasa Original → Pago</span>
                  <SortIcon field="tasaCambioPago" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('diferencial')}
              >
                <div className="flex items-center space-x-1">
                  <span>Diferencial</span>
                  <SortIcon field="diferencial" />
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('montoFinal')}
              >
                <div className="flex items-center space-x-1">
                  <span>Monto Final</span>
                  <SortIcon field="montoFinal" />
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedNotasDebito.map((nota) => {
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