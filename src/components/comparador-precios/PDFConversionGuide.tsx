// src/components/comparador-precios/PDFConversionGuide.tsx

import React from 'react'
import { Card } from '@/components/ui/Card'
import { 
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface PDFConversionGuideProps {
  onClose?: () => void
}

export function PDFConversionGuide({ onClose }: PDFConversionGuideProps) {
  const conversionOptions = [
    {
      title: 'Convertir a Imagen',
      description: 'Ideal para listas con formato visual complejo',
      icon: <PhotoIcon className="h-6 w-6 text-blue-600" />,
      steps: [
        'Convierte tu PDF a imagen PNG o JPG',
        'Gemini analizará visualmente el contenido',
        'Sube la imagen (máx. 30MB)'
      ],
      tools: [
        { name: 'PDF24', url: 'https://tools.pdf24.org/es/pdf-to-jpg' },
        { name: 'ILovePDF', url: 'https://www.ilovepdf.com/es/pdf_a_jpg' },
        { name: 'SmallPDF', url: 'https://smallpdf.com/es/pdf-a-jpg' }
      ],
      recommended: true
    },
    {
      title: 'Convertir a Excel/CSV',
      description: 'Mejor para datos tabulares estructurados',
      icon: <TableCellsIcon className="h-6 w-6 text-green-600" />,
      steps: [
        'Extrae los datos a formato tabular',
        'Guarda como Excel (.xlsx) o CSV',
        'Sube el archivo para procesamiento rápido'
      ],
      tools: [
        { name: 'Tabula', url: 'https://tabula.technology/' },
        { name: 'PDF Tables', url: 'https://pdftables.com/' },
        { name: 'Copia manual a Excel', url: '' }
      ],
      recommended: false
    }
  ]

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                PDF Detectado - Opciones de Conversión
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Para obtener los mejores resultados en la extracción de productos, 
                convierte tu PDF usando una de estas opciones:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {conversionOptions.map((option, index) => (
              <div
                key={index}
                className={`relative border rounded-lg p-4 ${
                  option.recommended 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {option.recommended && (
                  <div className="absolute -top-2 left-4">
                    <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                      Recomendado
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 mb-3">
                  {option.icon}
                  <h4 className="font-medium text-gray-900">{option.title}</h4>
                </div>

                <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                <div className="space-y-2 mb-4">
                  <h5 className="text-sm font-medium text-gray-700">Pasos:</h5>
                  <ol className="text-sm text-gray-600 space-y-1">
                    {option.steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start">
                        <span className="inline-block w-4 h-4 bg-gray-300 text-white text-xs rounded-full flex-shrink-0 mt-0.5 mr-2 text-center leading-4">
                          {stepIndex + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Herramientas gratuitas:</h5>
                  <div className="space-y-1">
                    {option.tools.map((tool, toolIndex) => (
                      <div key={toolIndex} className="flex items-center text-sm">
                        {tool.url ? (
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {tool.name}
                            <ArrowTopRightOnSquareIcon className="h-3 w-3 ml-1" />
                          </a>
                        ) : (
                          <span className="text-gray-600">{tool.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-amber-800 font-medium mb-1">💡 Consejo:</p>
                <p className="text-amber-700">
                  Si tu PDF contiene imágenes de productos, la opción de &quot;Convertir a Imagen&quot; 
                  funcionará mejor. Para listas simples con solo texto y precios, 
                  Excel/CSV será más rápido.
                </p>
              </div>
            </div>
          </div>

          {onClose && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}