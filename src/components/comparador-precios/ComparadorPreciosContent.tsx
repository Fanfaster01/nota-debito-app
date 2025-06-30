// src/components/comparador-precios/ComparadorPreciosContent.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAsyncState, useAsyncList } from '@/hooks/useAsyncState'
import { handleServiceError } from '@/utils/errorHandler'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { 
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { comparadorPreciosService } from '@/lib/services/comparadorPreciosService'
import { ComparacionView } from './ComparacionView'
import { MeilisearchConfig } from './MeilisearchConfig'
import type { 
  ListaPrecio
} from '@/types/comparadorPrecios'
import { 
  EstadoProcesamiento,
  ModeloIA 
} from '@/types/comparadorPrecios'

type TabActivo = 'cargar' | 'listas' | 'comparar' | 'configuracion'

export function ComparadorPreciosContent() {
  const { company } = useAuth()
  const [tabActivo, setTabActivo] = useState<TabActivo>('cargar')
  
  // Estados para carga de archivos
  const [archivos, setArchivos] = useState<File[]>([])
  const [proveedorNombre, setProveedorNombre] = useState('')
  const [fechaLista, setFechaLista] = useState(new Date().toISOString().split('T')[0])
  const [moneda, setMoneda] = useState<'USD' | 'BS'>('BS')
  const [tasaCambio, setTasaCambio] = useState<number>()
  const [modeloIA, setModeloIA] = useState<ModeloIA>(ModeloIA.GEMINI_15_FLASH)

  // Estados para listas cargadas
  const {
    data: listas,
    loading: listasLoading,
    error: listasError,
    execute: loadListas
  } = useAsyncList<ListaPrecio>([])

  // Estado para procesar archivo
  const {
    loading: procesandoArchivo,
    error: errorProcesamiento,
    execute: procesarArchivo
  } = useAsyncState()

  useEffect(() => {
    if (company?.id) {
      loadListas(async () => {
        const { data } = await comparadorPreciosService.getListas(company.id)
        return data || []
      })
    }
  }, [company?.id])

  const handleArchivoSeleccionado = (files: File[]) => {
    setArchivos(files)
  }

  const handleRemoverArchivo = (index: number) => {
    setArchivos(prev => prev.filter((_, i) => i !== index))
  }

  const handleCargarLista = async () => {
    if (!company?.id || archivos.length === 0 || !proveedorNombre) {
      return
    }

    await procesarArchivo(async () => {
      const archivo = archivos[0]
      const fechaListaDate = new Date(fechaLista)
      
      // Subir archivo
      const { data: uploadResult, error: uploadError } = await comparadorPreciosService.uploadLista(
        company.id,
        archivo,
        proveedorNombre,
        fechaListaDate,
        moneda,
        tasaCambio
      )

      if (uploadError) {
        throw new Error(handleServiceError(uploadError, 'Error al cargar archivo'))
      }

      // Procesar con IA
      const { data: procesResult, error: procesError } = await comparadorPreciosService.procesarListaConIA(
        uploadResult!.listaId,
        modeloIA
      )

      if (procesError) {
        throw new Error(handleServiceError(procesError, 'Error al procesar lista con IA'))
      }

      // Limpiar formulario y recargar listas
      setArchivos([])
      setProveedorNombre('')
      setFechaLista(new Date().toISOString().split('T')[0])
      setTasaCambio(undefined)
      
      await loadListas(async () => {
        const { data } = await comparadorPreciosService.getListas(company.id)
        return data || []
      })
      setTabActivo('listas')

      return procesResult
    })
  }

  const getEstadoIcon = (estado: EstadoProcesamiento) => {
    switch (estado) {
      case EstadoProcesamiento.COMPLETADO:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case EstadoProcesamiento.PROCESANDO:
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case EstadoProcesamiento.ERROR:
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getEstadoColor = (estado: EstadoProcesamiento) => {
    switch (estado) {
      case EstadoProcesamiento.COMPLETADO:
        return 'bg-green-100 text-green-800'
      case EstadoProcesamiento.PROCESANDO:
        return 'bg-blue-100 text-blue-800'
      case EstadoProcesamiento.ERROR:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-VE')
  }

  const puedeCargar = archivos.length > 0 && proveedorNombre.trim() !== '' && !procesandoArchivo

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Comparador de Precios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Carga y compara listas de precios de diferentes proveedores
          </p>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setTabActivo('cargar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActivo === 'cargar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <PlusIcon className="h-5 w-5 inline mr-2" />
            Cargar Lista
          </button>

          <button
            onClick={() => setTabActivo('listas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActivo === 'listas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 inline mr-2" />
            Listas Cargadas ({listas?.length || 0})
          </button>

          <button
            onClick={() => setTabActivo('comparar')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActivo === 'comparar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            Comparar
          </button>

          <button
            onClick={() => setTabActivo('configuracion')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              tabActivo === 'configuracion'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircleIcon className="h-5 w-5 inline mr-2" />
            Configuración
          </button>
        </nav>
      </div>

      {/* Contenido de los tabs */}
      {tabActivo === 'cargar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario de carga */}
          <Card title="Cargar Nueva Lista de Precios">
            <div className="space-y-6">
              {/* Información del proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  value={proveedorNombre}
                  onChange={(e) => setProveedorNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Distribuidora XYZ"
                  disabled={procesandoArchivo}
                />
              </div>

              {/* Fecha de la lista */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de la Lista *
                </label>
                <input
                  type="date"
                  value={fechaLista}
                  onChange={(e) => setFechaLista(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={procesandoArchivo}
                />
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda *
                </label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as 'USD' | 'BS')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={procesandoArchivo}
                >
                  <option value="BS">Bolívares (BS)</option>
                  <option value="USD">Dólares (USD)</option>
                </select>
              </div>

              {/* Tasa de cambio */}
              {moneda === 'BS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tasa de Cambio (BS/USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={tasaCambio || ''}
                    onChange={(e) => setTasaCambio(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 36.50"
                    disabled={procesandoArchivo}
                  />
                </div>
              )}

              {/* Modelo de IA */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo de IA
                </label>
                <select
                  value={modeloIA}
                  onChange={(e) => setModeloIA(e.target.value as ModeloIA)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={procesandoArchivo}
                >
                  <option value={ModeloIA.GEMINI_15_FLASH}>Gemini 1.5 Flash (GRATIS - Rápido)</option>
                  <option value={ModeloIA.GEMINI_15_PRO}>Gemini 1.5 Pro (GRATIS - Balanceado)</option>
                  <option value={ModeloIA.GEMINI_PRO}>Gemini Pro (Estándar)</option>
                </select>
              </div>

              {/* Botón de carga */}
              <Button
                onClick={handleCargarLista}
                disabled={!puedeCargar}
                className="w-full"
                loading={procesandoArchivo}
              >
                {procesandoArchivo ? 'Procesando con Gemini...' : 'Cargar y Procesar Lista'}
              </Button>

              {/* Error */}
              {errorProcesamiento && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errorProcesamiento}
                </div>
              )}
            </div>
          </Card>

          {/* Área de upload */}
          <Card title="Seleccionar Archivo">
            <FileUpload
              accept=".xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp,.heic,.heif"
              multiple={false}
              maxSize={30}
              onFilesSelected={handleArchivoSeleccionado}
              onRemoveFile={handleRemoverArchivo}
              files={archivos}
              disabled={procesandoArchivo}
              allowedTypes={['xlsx', 'xls', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']}
              dragDropText="Arrastra tu lista de precios aquí o"
              browseText="selecciona archivo"
            />
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                <strong>✨ Powered by Google Gemini:</strong> Extracción inteligente y gratuita de múltiples formatos:
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>📄 <strong>Documentos:</strong> Excel (.xlsx, .xls), CSV, PDF</li>
                <li>🖼️ <strong>Imágenes:</strong> PNG, JPG, WEBP, HEIC, HEIF</li>
                <li>🤖 <strong>IA Multimodal:</strong> Análisis visual y de texto optimizado para español</li>
                <li>💰 <strong>100% Gratuito:</strong> Hasta 1M tokens/mes sin costo</li>
                <li>📁 <strong>Archivos grandes:</strong> Hasta 30MB, extrae solo datos relevantes</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {tabActivo === 'listas' && (
        <Card title="Listas de Precios Cargadas">
          {listasLoading ? (
            <div className="flex items-center justify-center py-8">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando listas...</span>
            </div>
          ) : listasError ? (
            <div className="text-center py-8 text-red-600">
              <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2" />
              <p>Error al cargar las listas: {listasError}</p>
            </div>
          ) : !listas || listas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay listas cargadas
              </h3>
              <p>Comienza cargando tu primera lista de precios en la pestaña &quot;Cargar Lista&quot;</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Lista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Carga
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listas.map((lista) => (
                    <tr key={lista.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lista.proveedorNombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lista.moneda} • {lista.formatoArchivo.toUpperCase()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(lista.fechaLista.toString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lista.productosExtraidos || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getEstadoIcon(lista.estadoProcesamiento as EstadoProcesamiento)}
                          <span className={`ml-2 inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(lista.estadoProcesamiento as EstadoProcesamiento)}`}>
                            {lista.estadoProcesamiento}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(lista.fechaCarga.toString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tabActivo === 'comparar' && (
        <ComparacionView 
          companyId={company?.id}
          listas={listas?.filter(l => l.estadoProcesamiento === EstadoProcesamiento.COMPLETADO) || []}
        />
      )}

      {tabActivo === 'configuracion' && (
        <MeilisearchConfig />
      )}
    </div>
  )
}