// src/components/cajas/TicketCaja.tsx
import React from 'react'
import { ReporteCaja } from '@/types/caja'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TicketCajaProps {
  reporte: ReporteCaja
}

export const TicketCaja: React.FC<TicketCajaProps> = ({ reporte }) => {
  const { caja, pagosMovil, totales } = reporte

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  const formatearTexto = (texto: string, maxLength: number) => {
    if (texto.length <= maxLength) return texto
    return texto.substring(0, maxLength - 3) + '...'
  }

  return (
    <div 
      className="bg-white text-black font-mono text-xs"
      style={{ 
        width: '300px', // ~8cm a 96dpi
        padding: '10px',
        margin: '0 auto'
      }}
    >
      {/* Encabezado de la empresa */}
      <div className="text-center mb-3 pb-2 border-b border-dashed border-gray-400">
        <div className="font-bold text-sm">{caja.company?.name || 'EMPRESA'}</div>
        <div className="text-xs">RIF: {caja.company?.rif || 'J-00000000-0'}</div>
      </div>

      {/* Título del documento */}
      <div className="text-center mb-3">
        <div className="font-bold">CIERRE DE CAJA</div>
        <div className="text-xs">REPORTE DE PAGOS MÓVILES</div>
      </div>

      {/* Información de la caja */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span>{format(caja.fecha, 'dd/MM/yyyy', { locale: es })}</span>
        </div>
        <div className="flex justify-between">
          <span>CAJERO:</span>
          <span>{formatearTexto(caja.usuario?.full_name || caja.usuario?.email || 'Usuario', 20)}</span>
        </div>
        <div className="flex justify-between">
          <span>APERTURA:</span>
          <span>{format(caja.horaApertura, 'HH:mm', { locale: es })}</span>
        </div>
        {caja.horaCierre && (
          <div className="flex justify-between">
            <span>CIERRE:</span>
            <span>{format(caja.horaCierre, 'HH:mm', { locale: es })}</span>
          </div>
        )}
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Montos de apertura y cierre */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>MONTO APERTURA:</span>
          <span className="font-bold">Bs. {formatMonto(caja.montoApertura)}</span>
        </div>
        {caja.montoCierre !== null && caja.montoCierre !== undefined && (
          <div className="flex justify-between">
            <span>MONTO CIERRE:</span>
            <span className="font-bold">Bs. {formatMonto(caja.montoCierre)}</span>
          </div>
        )}
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Título de pagos móviles */}
      <div className="text-center font-bold text-xs mb-2">
        DETALLE DE PAGOS MÓVILES
      </div>

      {/* Encabezados de la tabla */}
      <div className="grid grid-cols-12 gap-1 text-xs font-bold border-b border-gray-400 pb-1 mb-1">
        <div className="col-span-1 text-center">#</div>
        <div className="col-span-2">HORA</div>
        <div className="col-span-4">CLIENTE</div>
        <div className="col-span-2">REF</div>
        <div className="col-span-3 text-right">MONTO</div>
      </div>

      {/* Lista de pagos móviles */}
      {pagosMovil.length > 0 ? (
        <div className="mb-2">
          {pagosMovil.map((pago, index) => (
            <div key={pago.id} className="grid grid-cols-12 gap-1 text-xs py-0.5">
              <div className="col-span-1 text-center">{index + 1}</div>
              <div className="col-span-2">{format(pago.fechaHora, 'HH:mm')}</div>
              <div className="col-span-4">{formatearTexto(pago.nombreCliente, 15)}</div>
              <div className="col-span-2">{pago.numeroReferencia.slice(-6)}</div>
              <div className="col-span-3 text-right">{formatMonto(pago.monto)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-2 text-xs">
          NO HAY PAGOS REGISTRADOS
        </div>
      )}

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Totales */}
      <div className="text-xs">
        <div className="flex justify-between font-bold">
          <span>CANTIDAD DE PAGOS:</span>
          <span>{totales.cantidadPagos}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL PAGOS MÓVILES:</span>
          <span>Bs. {formatMonto(totales.montoTotal)}</span>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Resumen final */}
      <div className="text-xs">
        <div className="flex justify-between">
          <span>Apertura:</span>
          <span>Bs. {formatMonto(caja.montoApertura)}</span>
        </div>
        <div className="flex justify-between">
          <span>Total Pagos:</span>
          <span>Bs. {formatMonto(totales.montoTotal)}</span>
        </div>
        <div className="flex justify-between font-bold border-t border-gray-400 pt-1 mt-1">
          <span>TOTAL EN CAJA:</span>
          <span>Bs. {formatMonto(caja.montoApertura + totales.montoTotal)}</span>
        </div>
      </div>

      {/* Observaciones si existen */}
      {caja.observaciones && (
        <>
          <div className="border-t border-dashed border-gray-400 my-2"></div>
          <div className="text-xs">
            <div className="font-bold">OBSERVACIONES:</div>
            <div className="mt-1">{caja.observaciones}</div>
          </div>
        </>
      )}

      {/* Pie del ticket */}
      <div className="text-center text-xs mt-4 pt-2 border-t border-dashed border-gray-400">
        <div>DOCUMENTO NO FISCAL</div>
        <div className="mt-1">
          {format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
        </div>
      </div>

      {/* Espacio para firmas */}
      <div className="mt-6 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-1 text-xs">
              CAJERO
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-1 text-xs">
              SUPERVISOR
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}