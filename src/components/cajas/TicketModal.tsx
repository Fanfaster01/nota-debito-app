// src/components/cajas/TicketModal.tsx
import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Button } from '@/components/ui/Button'
import { TicketCaja } from './TicketCaja'
import { ReporteCaja } from '@/types/caja'
import { 
  XMarkIcon, 
  PrinterIcon 
} from '@heroicons/react/24/outline'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  reporte: ReporteCaja | null
  onEditCierre?: () => void
  allowEdit?: boolean
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  reporte,
  onEditCierre,
  allowEdit = false
}) => {
  const componentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Cierre_Caja_${reporte?.caja.fecha || 'ticket'}`,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .no-print {
          display: none !important;
        }
      }
    `
  })

  if (!isOpen || !reporte) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h3 className="text-lg font-medium text-gray-900">
            Vista Previa del Ticket
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del ticket */}
        <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-100">
          <div ref={componentRef}>
            <TicketCaja reporte={reporte} />
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex justify-between p-4 border-t no-print">
          <div>
            {allowEdit && onEditCierre && (
              <Button
                variant="outline"
                onClick={onEditCierre}
                className="flex items-center"
              >
                Editar Cierre
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cerrar
            </Button>
            
            <Button 
              onClick={handlePrint}
              className="flex items-center"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}