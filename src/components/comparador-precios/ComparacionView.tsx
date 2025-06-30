// src/components/comparador-precios/ComparacionView.tsx

import React, { useState } from 'react'
import { useAsyncState } from '@/hooks/useAsyncState'
import { handleServiceError } from '@/utils/errorHandler'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'
import { comparadorPreciosService } from '@/lib/services/comparadorPreciosService'
import type { 
  ListaPrecio, 
  ComparacionResponse
} from '@/types/comparadorPrecios'

interface ComparacionViewProps {
  companyId?: string
  listas: ListaPrecio[]
}

export function ComparacionView({ companyId, listas }: ComparacionViewProps) {
  const [listasSeleccionadas, setListasSeleccionadas] = useState<Set<string>>(new Set())
  const [resultados, setResultados] = useState<ComparacionResponse | null>(null)

  const {
    loading: comparando,
    error: errorComparacion,
    execute: ejecutarComparacion
  } = useAsyncState()

  const handleSeleccionarLista = (listaId: string, seleccionada: boolean) => {
    const nuevasSeleccionadas = new Set(listasSeleccionadas)
    if (seleccionada) {
      nuevasSeleccionadas.add(listaId)
    } else {
      nuevasSeleccionadas.delete(listaId)
    }
    setListasSeleccionadas(nuevasSeleccionadas)
  }

  const handleComparar = async () => {
    if (!companyId || listasSeleccionadas.size < 2) return

    await ejecutarComparacion(async () => {
      const { data, error } = await comparadorPreciosService.compararListas(
        companyId,
        Array.from(listasSeleccionadas)
      )

      if (error) {
        throw new Error(handleServiceError(error, 'Error al comparar listas'))
      }

      setResultados(data!)
      return data
    })
  }

  const formatCurrency = (amount: number, moneda: 'USD' | 'BS') => {
    const symbol = moneda === 'USD' ? '$' : 'Bs.'
    return `${symbol} ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
  }

  const getAlertaColor = (diferencia: number) => {
    if (diferencia > 30) return 'text-red-600'
    if (diferencia > 15) return 'text-yellow-600'
    return 'text-green-600'
  }

  const puedeComparar = listasSeleccionadas.size >= 2 && !comparando

  if (listas.length === 0) {
    return (
      <Card title="Comparar Listas de Precios">
        <div className="text-center py-8 text-gray-500">
          <ScaleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay listas procesadas
          </h3>
          <p>Necesitas al menos 2 listas de precios procesadas para realizar una comparación.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selección de listas */}
      <Card title="Seleccionar Listas para Comparar">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona al menos 2 listas de precios para comparar precios entre proveedores.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listas.map((lista) => (
              <div
                key={lista.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                  listasSeleccionadas.has(lista.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSeleccionarLista(lista.id, !listasSeleccionadas.has(lista.id))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{lista.proveedorNombre}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(lista.fechaLista).toLocaleDateString('es-VE')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lista.productosExtraidos} productos • {lista.moneda}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={listasSeleccionadas.has(lista.id)}
                    onChange={(e) => handleSeleccionarLista(lista.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              {listasSeleccionadas.size} de {listas.length} listas seleccionadas
            </div>
            <Button
              onClick={handleComparar}
              disabled={!puedeComparar}
              loading={comparando}
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              {comparando ? 'Comparando...' : 'Comparar Precios'}
            </Button>
          </div>

          {errorComparacion && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {errorComparacion}
            </div>
          )}
        </div>
      </Card>

      {/* Resultados de comparación */}
      {resultados && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <Card title="Resumen de Comparación">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {resultados.estadisticas.totalProductos}
                </div>
                <div className="text-sm text-gray-500">Productos Comparados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {resultados.estadisticas.productosConVariacion}
                </div>
                <div className="text-sm text-gray-500">Con Variación de Precio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {resultados.estadisticas.promedioDiferenciaPrecio.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Diferencia Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {resultados.estadisticas.alertasPrecios}
                </div>
                <div className="text-sm text-gray-500">Alertas de Precio</div>
              </div>
            </div>

            {resultados.estadisticas.proveedorMasBarato.nombre && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-1">Proveedor Más Competitivo</h4>
                <p className="text-sm text-green-700">
                  <strong>{resultados.estadisticas.proveedorMasBarato.nombre}</strong> tiene los mejores precios en{' '}
                  <strong>{resultados.estadisticas.proveedorMasBarato.porcentaje.toFixed(1)}%</strong> de los productos
                </p>
              </div>
            )}
          </Card>

          {/* Tabla de resultados */}
          <Card title="Comparación Detallada de Precios">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mejor Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Todos los Precios
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resultados.resultados.map((resultado, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {resultado.productoNombre}
                          </div>
                          {resultado.presentacion && (
                            <div className="text-sm text-gray-500">
                              {resultado.presentacion}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(resultado.mejorPrecio.precio, resultado.mejorPrecio.moneda)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {resultado.mejorPrecio.proveedorNombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getAlertaColor(resultado.diferenciaPorcentual)}`}>
                          {resultado.diferenciaPorcentual.toFixed(1)}%
                        </div>
                        {resultado.alertaPrecio && (
                          <div className="text-xs text-red-600 flex items-center mt-1">
                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                            Alerta
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {resultado.precios.map((precio, priceIndex) => (
                            <div key={priceIndex} className="text-xs">
                              <span className="text-gray-600">{precio.proveedorNombre}:</span>{' '}
                              <span className={`font-medium ${
                                precio.proveedorNombre === resultado.mejorPrecio.proveedorNombre
                                  ? 'text-green-600'
                                  : 'text-gray-900'
                              }`}>
                                {formatCurrency(precio.precio, precio.moneda)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {resultados.resultados.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-8 w-8 mx-auto mb-2" />
                <p>No se encontraron productos coincidentes entre las listas seleccionadas.</p>
                <p className="text-sm mt-1">
                  Esto puede deberse a que los productos no han sido matcheados correctamente.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}