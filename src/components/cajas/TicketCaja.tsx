// src/components/cajas/TicketCaja.tsx
import React from 'react'
import { ReporteCaja } from '@/types/caja'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatearFecha } from '@/utils/dateUtils'

interface TicketCajaProps {
  reporte: ReporteCaja
}

export const TicketCaja: React.FC<TicketCajaProps> = ({ reporte }) => {
  const { caja, pagosMovil, pagosZelle, notasCredito, creditos, totales } = reporte

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
        <div className="text-xs">REPORTE DE PAGOS</div>
      </div>

      {/* Información de la caja */}
      <div className="mb-3 text-xs">
        <div className="flex justify-between">
          <span>FECHA:</span>
          <span>{formatearFecha(caja.fecha)}</span>
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
        <div className="flex justify-between">
          <span>TASA DEL DÍA:</span>
          <span className="font-bold">Bs. {formatMonto(caja.tasaDia)} / USD</span>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* SECCIÓN PAGOS MÓVILES */}
      <div className="text-center font-bold text-xs mb-2">
        PAGOS MÓVILES ({totales.cantidadPagosMovil})
      </div>

      {pagosMovil.length > 0 ? (
        <>
          {/* Encabezados de la tabla */}
          <div className="grid grid-cols-12 gap-1 text-xs font-bold border-b border-gray-400 pb-1 mb-1">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">HORA</div>
            <div className="col-span-4">CLIENTE</div>
            <div className="col-span-2">REF</div>
            <div className="col-span-3 text-right">MONTO</div>
          </div>

          {/* Lista de pagos móviles */}
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
          <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
            <span>TOTAL MÓVIL:</span>
            <span>Bs. {formatMonto(totales.montoTotalMovil)}</span>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-xs">
          NO HAY PAGOS MÓVILES
        </div>
      )}

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* SECCIÓN PAGOS ZELLE */}
      <div className="text-center font-bold text-xs mb-2">
        PAGOS ZELLE ({totales.cantidadZelle})
      </div>

      {pagosZelle.length > 0 ? (
        <>
          {/* Encabezados de la tabla */}
          <div className="grid grid-cols-12 gap-1 text-xs font-bold border-b border-gray-400 pb-1 mb-1">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">HORA</div>
            <div className="col-span-4">CLIENTE</div>
            <div className="col-span-2 text-right">USD</div>
            <div className="col-span-3 text-right">BS</div>
          </div>

          {/* Lista de pagos Zelle */}
          <div className="mb-2">
            {pagosZelle.map((pago, index) => (
              <div key={pago.id} className="grid grid-cols-12 gap-1 text-xs py-0.5">
                <div className="col-span-1 text-center">{index + 1}</div>
                <div className="col-span-2">{format(pago.fechaHora, 'HH:mm')}</div>
                <div className="col-span-4">{formatearTexto(pago.nombreCliente, 15)}</div>
                <div className="col-span-2 text-right">{formatMonto(pago.montoUsd)}</div>
                <div className="col-span-3 text-right">{formatMonto(pago.montoBs)}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between font-bold">
              <span>TOTAL USD:</span>
              <span>$ {formatMonto(totales.montoTotalZelleUsd)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
              <span>TOTAL ZELLE BS:</span>
              <span>Bs. {formatMonto(totales.montoTotalZelleBs)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-xs">
          NO HAY PAGOS ZELLE
        </div>
      )}

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* SECCIÓN NOTAS DE CRÉDITO */}
      <div className="text-center font-bold text-xs mb-2">
        NOTAS DE CRÉDITO ({totales.cantidadNotasCredito})
      </div>

      {notasCredito.length > 0 ? (
        <>
          {/* Encabezados de la tabla */}
          <div className="grid grid-cols-12 gap-1 text-xs font-bold border-b border-gray-400 pb-1 mb-1">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">HORA</div>
            <div className="col-span-2">N° NC</div>
            <div className="col-span-2">FACT</div>
            <div className="col-span-2">CLIENTE</div>
            <div className="col-span-3 text-right">MONTO</div>
          </div>

          {/* Lista de notas de crédito */}
          <div className="mb-2">
            {notasCredito.map((nota, index) => (
              <div key={nota.id} className="grid grid-cols-12 gap-1 text-xs py-0.5">
                <div className="col-span-1 text-center">{index + 1}</div>
                <div className="col-span-2">{format(nota.fechaHora, 'HH:mm')}</div>
                <div className="col-span-2">{nota.numeroNotaCredito}</div>
                <div className="col-span-2">{nota.facturaAfectada}</div>
                <div className="col-span-2">{formatearTexto(nota.nombreCliente, 8)}</div>
                <div className="col-span-3 text-right">{formatMonto(nota.montoBs)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
            <span>TOTAL NC:</span>
            <span>Bs. {formatMonto(totales.montoTotalNotasCredito)}</span>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-xs">
          NO HAY NOTAS DE CRÉDITO
        </div>
      )}

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* SECCIÓN VENTAS A CRÉDITO */}
      <div className="text-center font-bold text-xs mb-2">
        VENTAS A CRÉDITO ({totales.cantidadCreditos})
      </div>

      {creditos.length > 0 ? (
        <>
          {/* Encabezados de la tabla */}
          <div className="grid grid-cols-12 gap-1 text-xs font-bold border-b border-gray-400 pb-1 mb-1">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-2">HORA</div>
            <div className="col-span-2">FACT</div>
            <div className="col-span-3">CLIENTE</div>
            <div className="col-span-2 text-right">USD</div>
            <div className="col-span-2 text-right">BS</div>
          </div>

          {/* Lista de créditos */}
          <div className="mb-2">
            {creditos.map((credito, index) => (
              <div key={credito.id} className="grid grid-cols-12 gap-1 text-xs py-0.5">
                <div className="col-span-1 text-center">{index + 1}</div>
                <div className="col-span-2">{format(credito.fechaHora, 'HH:mm')}</div>
                <div className="col-span-2">{credito.numeroFactura}</div>
                <div className="col-span-3">{formatearTexto(credito.nombreCliente, 12)}</div>
                <div className="col-span-2 text-right">{formatMonto(credito.montoUsd)}</div>
                <div className="col-span-2 text-right">{formatMonto(credito.montoBs)}</div>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between font-bold">
              <span>TOTAL USD:</span>
              <span>$ {formatMonto(totales.montoTotalCreditosUsd)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-400 pt-1">
              <span>TOTAL CRÉDITOS BS:</span>
              <span>Bs. {formatMonto(totales.montoTotalCreditosBs)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-xs">
          NO HAY VENTAS A CRÉDITO
        </div>
      )}

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* TOTALES GENERALES */}
      <div className="text-xs">
        <div className="flex justify-between font-bold">
          <span>CANTIDAD TOTAL:</span>
          <span>{totales.cantidadPagosMovil + totales.cantidadZelle + totales.cantidadNotasCredito + totales.cantidadCreditos} OPERACIONES</span>
        </div>
        <div className="border-t border-gray-400 pt-1 mt-1 space-y-1">
          <div className="flex justify-between">
            <span>Total Pagos Móvil:</span>
            <span>Bs. {formatMonto(totales.montoTotalMovil)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Pagos Zelle:</span>
            <span>Bs. {formatMonto(totales.montoTotalZelleBs)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Notas Crédito:</span>
            <span>Bs. {formatMonto(totales.montoTotalNotasCredito)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Ventas Crédito:</span>
            <span>Bs. {formatMonto(totales.montoTotalCreditosBs)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-gray-400 pt-1">
            <span>TOTAL GENERAL:</span>
            <span>Bs. {formatMonto(totales.montoTotalGeneral)}</span>
          </div>
        </div>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-dashed border-gray-400 my-2"></div>

      {/* Resumen final */}
      <div className="text-xs">
        <div className="flex justify-between">
          <span>Fondo de Caja (Bs):</span>
          <span>Bs. {formatMonto(caja.montoApertura)}</span>
        </div>
        {caja.montoAperturaUsd > 0 && (
          <div className="flex justify-between">
            <span>Fondo de Caja ($):</span>
            <span>$ {formatMonto(caja.montoAperturaUsd)}</span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span>Total Ingresos del Día:</span>
          <span>Bs. {formatMonto(totales.montoTotalGeneral)}</span>
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