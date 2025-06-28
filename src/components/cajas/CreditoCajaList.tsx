'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { PencilIcon, TrashIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cajaService } from '@/lib/services/cajaService'
import type { CreditoCajaUI } from '@/types/caja'
import { useAsyncState } from '@/hooks/useAsyncState'

interface CreditoCajaListProps {
  creditos: CreditoCajaUI[]
  onCreditoActualizado: (credito: CreditoCajaUI) => void
  onCreditoEliminado: (creditoId: string) => void
}

interface CreditoFormData {
  numeroFactura: string
  nombreCliente: string
  telefonoCliente: string
  montoBs: string | number
}

export default function CreditoCajaList({ 
  creditos, 
  onCreditoActualizado, 
  onCreditoEliminado 
}: CreditoCajaListProps) {
  // Estados de edición y eliminación con useAsyncState
  const updateState = useAsyncState<CreditoCajaUI>()
  const deleteState = useAsyncState<void>()
  
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, CreditoFormData>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const iniciarEdicion = (credito: CreditoCajaUI) => {
    setEditandoId(credito.id!)
    setFormData({
      [credito.id!]: {
        numeroFactura: credito.numeroFactura,
        nombreCliente: credito.nombreCliente,
        telefonoCliente: credito.telefonoCliente,
        montoBs: credito.montoBs
      }
    })
    updateState.clearError()
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormData({})
    updateState.clearError()
  }

  const guardarEdicion = async (creditoId: string) => {
    const datos = formData[creditoId]
    if (!datos) return

    const result = await updateState.execute(
      async () => {
        const { data, error: updateError } = await cajaService.actualizarCreditoCaja(creditoId, {
          numeroFactura: datos.numeroFactura,
          nombreCliente: datos.nombreCliente,
          telefonoCliente: datos.telefonoCliente,
          montoBs: typeof datos.montoBs === 'string' ? parseFloat(datos.montoBs) : datos.montoBs
        })

        if (updateError) {
          throw updateError
        }

        if (!data) {
          throw new Error('No se pudo actualizar el crédito')
        }

        return data
      },
      'Error al actualizar el crédito'
    )

    if (result) {
      onCreditoActualizado(result)
      cancelarEdicion()
    }
  }

  const eliminarCredito = async (creditoId: string) => {
    const result = await deleteState.execute(
      async () => {
        const { error: deleteError } = await cajaService.eliminarCreditoCaja(creditoId)

        if (deleteError) {
          throw deleteError
        }

        return void 0
      },
      'Error al eliminar el crédito'
    )

    if (result !== null) {
      onCreditoEliminado(creditoId)
      setDeleteConfirm(null)
    }
  }

  const actualizarCampo = (creditoId: string, campo: keyof CreditoFormData, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [creditoId]: {
        ...(prev[creditoId] || {}),
        [campo]: valor
      }
    }))
  }

  const calcularTotales = () => {
    return {
      totalBs: creditos.reduce((sum, credito) => sum + credito.montoBs, 0),
      totalUsd: creditos.reduce((sum, credito) => sum + credito.montoUsd, 0)
    }
  }

  if (creditos.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <CreditCardIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay créditos registrados</p>
          <p className="text-sm text-gray-400 mt-2">
            Los créditos que registres aparecerán aquí
          </p>
        </div>
      </Card>
    )
  }

  const totales = calcularTotales()

  return (
    <div className="space-y-4">
      {(updateState.error || deleteState.error) && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {updateState.error || deleteState.error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factura
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Bs
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto USD
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Creado por
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {creditos.map((credito) => {
              const estaEditando = editandoId === credito.id
              const datos = estaEditando ? formData[credito.id!] : null

              return (
                <tr key={credito.id} className={estaEditando ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {format(credito.fechaHora, 'HH:mm')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos?.numeroFactura || ''}
                        onChange={(e) => actualizarCampo(credito.id!, 'numeroFactura', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{credito.numeroFactura}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos?.nombreCliente || ''}
                        onChange={(e) => actualizarCampo(credito.id!, 'nombreCliente', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{credito.nombreCliente}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos?.telefonoCliente || ''}
                        onChange={(e) => actualizarCampo(credito.id!, 'telefonoCliente', e.target.value)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{credito.telefonoCliente}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {estaEditando ? (
                      <input
                        type="number"
                        step="0.01"
                        value={datos?.montoBs || ''}
                        onChange={(e) => actualizarCampo(credito.id!, 'montoBs', e.target.value)}
                        className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm text-right"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {credito.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {credito.montoUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      credito.estado === 'pendiente' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {credito.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {credito.usuario?.full_name || 'Usuario no disponible'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {estaEditando ? (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => guardarEdicion(credito.id!)}
                          className="text-green-600 hover:text-green-900 text-sm font-medium"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => iniciarEdicion(credito)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(credito.id!)}
                          disabled={deleteState.loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right font-medium text-gray-900">
                Totales:
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {totales.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {totales.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <p className="text-sm text-amber-800">
          <strong>Total de Créditos:</strong> {creditos.length} | 
          <strong className="ml-2">Monto Total Bs:</strong> {totales.totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
          <strong className="ml-2">Monto Total USD:</strong> {totales.totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              ¿Eliminar Venta a Crédito?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. La venta a crédito será eliminada permanentemente.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteState.loading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => eliminarCredito(deleteConfirm)}
                disabled={deleteState.loading}
              >
                {deleteState.loading ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}