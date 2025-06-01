'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { cajaService } from '@/lib/services/cajaService'
import type { NotaCreditoCajaUI } from '@/types/caja'

interface NotaCreditoCajaListProps {
  notasCredito: NotaCreditoCajaUI[]
  onNotaActualizada: (nota: NotaCreditoCajaUI) => void
  onNotaEliminada: (notaId: string) => void
}

export default function NotaCreditoCajaList({ 
  notasCredito, 
  onNotaActualizada, 
  onNotaEliminada 
}: NotaCreditoCajaListProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const iniciarEdicion = (nota: NotaCreditoCajaUI) => {
    setEditandoId(nota.id!)
    setFormData({
      [nota.id!]: {
        numeroNotaCredito: nota.numeroNotaCredito,
        facturaAfectada: nota.facturaAfectada,
        montoBs: nota.montoBs,
        nombreCliente: nota.nombreCliente,
        explicacion: nota.explicacion
      }
    })
    setError(null)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormData({})
    setError(null)
  }

  const guardarEdicion = async (notaId: string) => {
    const datos = formData[notaId]
    if (!datos) return

    setError(null)

    try {
      const { data, error: updateError } = await cajaService.actualizarNotaCreditoCaja(notaId, {
        numeroNotaCredito: datos.numeroNotaCredito,
        facturaAfectada: datos.facturaAfectada,
        montoBs: parseFloat(datos.montoBs),
        nombreCliente: datos.nombreCliente,
        explicacion: datos.explicacion
      })

      if (updateError) {
        setError(updateError.message || 'Error al actualizar la nota de crédito')
        return
      }

      if (data) {
        onNotaActualizada(data)
        cancelarEdicion()
      }
    } catch (err) {
      setError('Error inesperado al actualizar la nota de crédito')
    }
  }

  const eliminarNota = async (notaId: string) => {
    if (!confirm('¿Está seguro de eliminar esta nota de crédito?')) return

    setEliminandoId(notaId)
    setError(null)

    try {
      const { error: deleteError } = await cajaService.eliminarNotaCreditoCaja(notaId)

      if (deleteError) {
        setError(deleteError.message || 'Error al eliminar la nota de crédito')
        return
      }

      onNotaEliminada(notaId)
    } catch (err) {
      setError('Error inesperado al eliminar la nota de crédito')
    } finally {
      setEliminandoId(null)
    }
  }

  const actualizarCampo = (notaId: string, campo: string, valor: string) => {
    setFormData(prev => ({
      ...prev,
      [notaId]: {
        ...prev[notaId],
        [campo]: valor
      }
    }))
  }

  const calcularTotal = () => {
    return notasCredito.reduce((sum, nota) => sum + nota.montoBs, 0)
  }

  if (notasCredito.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay notas de crédito registradas
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
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
                N° Nota Crédito
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Factura Afectada
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Explicación
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto Bs
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notasCredito.map((nota) => {
              const estaEditando = editandoId === nota.id
              const datos = estaEditando ? formData[nota.id!] : nota

              return (
                <tr key={nota.id} className={estaEditando ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {format(nota.fechaHora, 'HH:mm')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos.numeroNotaCredito}
                        onChange={(e) => actualizarCampo(nota.id!, 'numeroNotaCredito', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{nota.numeroNotaCredito}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos.facturaAfectada}
                        onChange={(e) => actualizarCampo(nota.id!, 'facturaAfectada', e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{nota.facturaAfectada}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {estaEditando ? (
                      <input
                        type="text"
                        value={datos.nombreCliente}
                        onChange={(e) => actualizarCampo(nota.id!, 'nombreCliente', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{nota.nombreCliente}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {estaEditando ? (
                      <textarea
                        value={datos.explicacion}
                        onChange={(e) => actualizarCampo(nota.id!, 'explicacion', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        rows={2}
                      />
                    ) : (
                      <span className="text-sm text-gray-900 block max-w-xs truncate" title={nota.explicacion}>
                        {nota.explicacion}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    {estaEditando ? (
                      <input
                        type="number"
                        step="0.01"
                        value={datos.montoBs}
                        onChange={(e) => actualizarCampo(nota.id!, 'montoBs', e.target.value)}
                        className="w-28 px-2 py-1 border border-gray-300 rounded-md text-sm text-right"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {nota.montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    {estaEditando ? (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => guardarEdicion(nota.id!)}
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
                          onClick={() => iniciarEdicion(nota)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => eliminarNota(nota.id!)}
                          disabled={eliminandoId === nota.id}
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
              <td colSpan={5} className="px-4 py-3 text-right font-medium text-gray-900">
                Total:
              </td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {calcularTotal().toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Total de Notas de Crédito:</strong> {notasCredito.length} | 
          <strong className="ml-2">Monto Total:</strong> Bs {calcularTotal().toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  )
}