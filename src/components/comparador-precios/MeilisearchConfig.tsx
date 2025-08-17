// src/components/comparador-precios/MeilisearchConfig.tsx

import React, { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAsyncState } from '@/hooks/useAsyncState'
import { handleServiceError } from '@/utils/errorHandler'
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
  
  // Estado para verificación usando hook correcto
  const {
    data: status,
    loading: verificandoEstado,
    error: errorVerificacion,
    execute: verificarEstado
  } = useAsyncState<MeilisearchStats | null>(null)

  // Estado para configuración
  const {
    loading: configurando,
    error: errorConfiguracion,
    execute: ejecutarConfiguracion
  } = useAsyncState()

  useEffect(() => {
    verificarEstado(async () => {
      const { data, error: statusError } = await meilisearchService.verificarEstado()
      
      if (statusError) {
        throw new Error(handleServiceError(statusError, 'Meilisearch no está configurado o no está disponible'))
      }
      
      return data
    }, 'Error al verificar estado de Meilisearch')
  }, [verificarEstado])

  const configurarIndice = async () => {
    if (!company?.id) return
    
    await ejecutarConfiguracion(async () => {
      const { error: configError } = await meilisearchService.configurarIndice()
      
      if (configError) {
        throw new Error(handleServiceError(configError, 'Error al configurar el índice de búsqueda'))
      }
      
      // Reverificar estado después de configurar
      await verificarEstado(async () => {
        const { data, error: statusError } = await meilisearchService.verificarEstado()
        
        if (statusError) {
          throw new Error(handleServiceError(statusError, 'Error al verificar estado'))
        }
        
        return data
      }, 'Error al reverificar estado')
      
      return null
    }, 'Error al configurar Meilisearch')
  }

  const indexarProductos = async () => {
    if (!company?.id) return
    
    await ejecutarConfiguracion(async () => {
      // TODO: Implementar lógica para obtener productos maestro y indexarlos
      throw new Error('Función de indexación pendiente de implementar')
    }, 'Error al indexar productos')
  }

  return (
    <Card title="Configuración de Meilisearch">
      <div className="space-y-4">
        {/* Estado de conexión */}
        <div className="flex items-center space-x-3">
          {verificandoEstado || configurando ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : status?.healthy ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {verificandoEstado ? 'Verificando conexión...' : 
               configurando ? 'Configurando...' :
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

        {/* Errores */}
        {(errorVerificacion || errorConfiguracion) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{errorVerificacion || errorConfiguracion}</p>
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
                <div>MEILISEARCH_ADMIN_API_KEY=tu_admin_key (sin NEXT_PUBLIC_ por seguridad)</div>
              </div>
              <p>3. Reinicia la aplicación y configura el índice</p>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex space-x-3">
          <Button
            onClick={() => verificarEstado(async () => {
              const { data, error: statusError } = await meilisearchService.verificarEstado()
              
              if (statusError) {
                throw new Error(handleServiceError(statusError, 'Error al verificar estado'))
              }
              
              return data
            }, 'Error al verificar estado de Meilisearch')}
            disabled={verificandoEstado || configurando}
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
                disabled={verificandoEstado || configurando}
                variant="outline"
                size="sm"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Configurar Índice
              </Button>

              <Button
                onClick={indexarProductos}
                disabled={verificandoEstado || configurando}
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