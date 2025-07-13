// src/components/ui/ExtensionInterferenceAlert.tsx

import React from 'react'
import { ExclamationTriangleIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'

interface ExtensionInterferenceAlertProps {
  onDismiss?: () => void
}

export function ExtensionInterferenceAlert({ onDismiss }: ExtensionInterferenceAlertProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ShieldExclamationIcon className="h-5 w-5 text-amber-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Extensión de Chrome detectada
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p className="mb-3">
              Se ha detectado que una extensión de Chrome está interfiriendo con las solicitudes de red. 
              Esto puede causar errores al cargar archivos.
            </p>
            
            <div className="space-y-2">
              <p className="font-medium">Soluciones recomendadas:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>
                  <strong>Modo incógnito:</strong> Abrir esta página en una ventana incógnita 
                  (Ctrl+Shift+N) donde las extensiones están deshabilitadas
                </li>
                <li>
                  <strong>Deshabilitar extensiones:</strong> Ir a chrome://extensions/ y 
                  deshabilitar temporalmente las extensiones que bloquean anuncios o modifican solicitudes
                </li>
                <li>
                  <strong>Usar otro navegador:</strong> Firefox, Safari, o Edge como alternativa temporal
                </li>
              </ol>
            </div>
            
            <div className="mt-3 p-2 bg-amber-100 rounded text-xs">
              <p className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                <strong>Nota:</strong> Hemos implementado un bypass automático, pero algunos casos pueden requerir las soluciones manuales.
              </p>
            </div>
          </div>
          
          {onDismiss && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs font-medium text-amber-800 underline hover:text-amber-600"
              >
                Entendido, continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}