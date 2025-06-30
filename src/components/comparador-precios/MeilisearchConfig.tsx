// src/components/comparador-precios/MeilisearchConfig.tsx

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { meilisearchService } from '@/lib/services/meilisearchService'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  ServerIcon
} from '@heroicons/react/24/outline'

interface MeilisearchStats {
  healthy: boolean
  stats?: {
    numberOfDocuments: number
    isIndexing: boolean
    fieldDistribution: Record<string, number>
  }
}

export function MeilisearchConfig() {
  const { company } = useAuth()
  const [status, setStatus] = useState<MeilisearchStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    verificarEstado()
  }, [])

  const verificarEstado = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: statusError } = await meilisearchService.verificarEstado()
      
      if (statusError) {
        setError('Meilisearch no está configurado o no está disponible')
        setStatus(null)
      } else {
        setStatus(data)
      }
    } catch (err) {
      setError('No se pudo conectar con Meilisearch')
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const configurarIndice = async () => {
    if (!company?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error: configError } = await meilisearchService.configurarIndice()
      
      if (configError) {
        setError('Error al configurar el índice de búsqueda')
      } else {
        await verificarEstado()
      }
    } catch (err) {
      setError('Error al configurar Meilisearch')
    } finally {
      setLoading(false)
    }
  }

  const indexarProductos = async () => {
    if (!company?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Aquí iría la lógica para obtener productos maestro y indexarlos
      // Por ahora, solo mostramos el mensaje
      setError('Función de indexación pendiente de implementar')
    } catch (err) {
      setError('Error al indexar productos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Configuración de Meilisearch">
      <div className="space-y-4">
        {/* Estado de conexión */}
        <div className="flex items-center space-x-3">
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : status?.healthy ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {loading ? 'Verificando conexión...' : 
               status?.healthy ? 'Meilisearch conectado' : 
               'Meilisearch no disponible'}
            </p>
            {status?.stats && (
              <p className="text-xs text-gray-500">
                {status.stats.numberOfDocuments} productos indexados
              </p>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {status?.stats && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Estadísticas del Índice</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Documentos:</span>
                <span className="ml-1 font-medium">{status.stats.numberOfDocuments}</span>
              </div>
              <div>
                <span className="text-gray-500">Estado:</span>
                <span className="ml-1 font-medium">
                  {status.stats.isIndexing ? 'Indexando...' : 'Listo'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Información de configuración */}
        {!status?.healthy && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              🚀 Configuración de Meilisearch
            </h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>1. Crea una cuenta gratuita en <a href="https://www.meilisearch.com/cloud" target="_blank" rel="noopener noreferrer" className="underline">Meilisearch Cloud</a></p>
              <p>2. Agrega las variables de entorno:</p>
              <div className="bg-blue-100 rounded p-2 mt-2 font-mono text-xs">
                <div>NEXT_PUBLIC_MEILISEARCH_URL=tu_url</div>
                <div>NEXT_PUBLIC_MEILISEARCH_SEARCH_API_KEY=tu_search_key</div>
                <div>NEXT_PUBLIC_MEILISEARCH_ADMIN_API_KEY=tu_admin_key</div>
              </div>
              <p>3. Reinicia la aplicación y configura el índice</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex space-x-3">
          <Button
            onClick={verificarEstado}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <ServerIcon className="h-4 w-4 mr-2" />
            Verificar Estado
          </Button>

          {status?.healthy && (
            <>
              <Button
                onClick={configurarIndice}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Configurar Índice
              </Button>

              <Button
                onClick={indexarProductos}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                Indexar Productos
              </Button>
            </>
          )}
        </div>

        {/* Nota sobre beneficios */}
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-green-900 mb-2">
            ✨ Beneficios de Meilisearch
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• <strong>Matching 4x más preciso:</strong> Tolerancia a errores tipográficos</li>
            <li>• <strong>Velocidad extrema:</strong> Búsquedas en menos de 50ms</li>
            <li>• <strong>Optimizado para español:</strong> Manejo perfecto de acentos</li>
            <li>• <strong>100% gratuito:</strong> Para volúmenes pequeños y medianos</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}