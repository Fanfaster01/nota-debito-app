// src/components/forms/NotaDebitoForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Factura, NotaCredito, NotaDebito } from '@/types';
import { notaDebitoSchema } from '@/lib/validators';
import { calcularNotaDebito, calcularMontoFinalPagar } from '@/lib/calculations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { format, addDays } from 'date-fns';

// Función auxiliar para formatear fechas correctamente
const formatearFecha = (fecha: Date): string => {
  // Añadimos un día para corregir el desfase de zona horaria
  const fechaCorregida = addDays(fecha, 1);
  return format(fechaCorregida, 'dd/MM/yyyy');
};

interface NotaDebitoFormProps {
  factura: Factura | null;
  notaCredito: NotaCredito | null;
  onSubmit: (data: NotaDebito) => void;
  defaultValues?: Partial<NotaDebito>;
}

export const NotaDebitoForm: React.FC<NotaDebitoFormProps> = ({ 
  factura, 
  notaCredito, 
  onSubmit, 
  defaultValues 
}) => {
  const [notaDebito, setNotaDebito] = useState<NotaDebito | null>(null);
  const [montoFinalPagar, setMontoFinalPagar] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    reset,
    setValue,
  } = useForm<{ 
    tasaCambioPago: number;
    fecha: Date;
  }>({
    resolver: zodResolver(notaDebitoSchema),
    defaultValues: {
      tasaCambioPago: 0,
      fecha: new Date(),
    },
  });

  const tasaCambioPago = watch('tasaCambioPago');
  const fecha = watch('fecha');

  // Calculate nota de débito when tasaCambioPago changes
  useEffect(() => {
    if (factura && tasaCambioPago > 0) {
      const calculatedNotaDebito = calcularNotaDebito(factura, notaCredito, tasaCambioPago);
      setNotaDebito(calculatedNotaDebito);
      
      // Calculate monto final a pagar
      const montoFinal = calcularMontoFinalPagar(factura, notaCredito, calculatedNotaDebito);
      setMontoFinalPagar(montoFinal);
    }
  }, [factura, notaCredito, tasaCambioPago]);

  const onFormSubmit = (data: { tasaCambioPago: number; fecha: Date }) => {
    if (factura && notaDebito) {
      const completeNotaDebito: NotaDebito = {
        ...notaDebito,
        fecha: data.fecha,
        tasaCambioPago: data.tasaCambioPago,
      };
      onSubmit(completeNotaDebito);
    }
  };

  if (!factura) {
    return (
      <Card title="Nota de Débito por Diferencial Cambiario">
        <div className="text-center p-6">
          <p className="text-gray-500">Primero debe ingresar la información de una factura.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Nota de Débito por Diferencial Cambiario">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="fecha"
            control={control}
            render={({ field }) => (
              <Input
                label="Fecha"
                type="date"
                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  field.onChange(date);
                }}
                error={errors.fecha?.message}
              />
            )}
          />
          <Input
            label="Tasa de Cambio al Momento del Pago (Bs/USD)"
            type="number"
            step="0.01"
            {...register('tasaCambioPago', { valueAsNumber: true })}
            error={errors.tasaCambioPago?.message}
          />
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">Resumen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Factura Original</h4>
              <p><span className="font-medium">Número:</span> {factura.numero}</p>
              <p><span className="font-medium">Fecha:</span> {factura.fecha instanceof Date ? formatearFecha(factura.fecha) : '-'}</p>
              <p><span className="font-medium">Total:</span> Bs. {factura.total.toFixed(2)}</p>
              <p><span className="font-medium">Monto en USD:</span> $ {factura.montoUSD.toFixed(2)}</p>
              <p><span className="font-medium">Tasa de Cambio:</span> Bs. {factura.tasaCambio.toFixed(2)}</p>
              <p><span className="font-medium">Retención IVA:</span> Bs. {factura.retencionIVA.toFixed(2)}</p>
              <p><span className="font-medium">Monto a pagar después de retención:</span> Bs. {(factura.total - factura.retencionIVA).toFixed(2)}</p>
            </div>

            {notaCredito && (
              <div>
                <h4 className="font-medium mb-2">Nota de Crédito</h4>
                <p><span className="font-medium">Número:</span> {notaCredito.numero}</p>
                <p><span className="font-medium">Fecha:</span> {notaCredito.fecha instanceof Date ? formatearFecha(notaCredito.fecha) : '-'}</p>
                <p><span className="font-medium">Total:</span> Bs. {notaCredito.total.toFixed(2)}</p>
                <p><span className="font-medium">Monto en USD:</span> $ {notaCredito.montoUSD.toFixed(2)}</p>
                <p><span className="font-medium">Retención IVA:</span> Bs. {notaCredito.retencionIVA.toFixed(2)}</p>
                <p><span className="font-medium">Monto a restar después de retención:</span> Bs. {(notaCredito.total - notaCredito.retencionIVA).toFixed(2)}</p>
              </div>
            )}
          </div>

          {notaDebito && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="font-medium mb-2">Cálculo del Diferencial Cambiario</h4>
              <div className="p-4 bg-gray-50 rounded mb-4">
                <p className="font-medium mb-2">Datos del cálculo:</p>
                <p>• Monto neto en USD: $ {notaDebito.montoUSDNeto.toFixed(2)}</p>
                <p>• Valor en Bs. con tasa original: $ {notaDebito.montoUSDNeto.toFixed(2)} × {notaDebito.tasaCambioOriginal.toFixed(2)} = Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioOriginal).toFixed(2)}</p>
                <p>• Valor en Bs. con tasa de pago: $ {notaDebito.montoUSDNeto.toFixed(2)} × {notaDebito.tasaCambioPago.toFixed(2)} = Bs. {(notaDebito.montoUSDNeto * notaDebito.tasaCambioPago).toFixed(2)}</p>
                <p>• Diferencial cambiario (con IVA): Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)}</p>
                <p>• Base imponible: Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)}</p>
                <p>• IVA ({factura.alicuotaIVA}%): Bs. {notaDebito.ivaDiferencial.toFixed(2)}</p>
                <p>• Retención de IVA ({factura.porcentajeRetencion}%): Bs. {notaDebito.retencionIVADiferencial.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium mb-2">Nota de Débito:</h5>
                  <p><span className="font-medium">Base Imponible del Diferencial:</span> Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)}</p>
                  <p><span className="font-medium">IVA ({factura.alicuotaIVA}%):</span> Bs. {notaDebito.ivaDiferencial.toFixed(2)}</p>
                  <p><span className="font-medium">Total Nota de Débito:</span> Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)}</p>
                  <p><span className="font-medium">Retención de IVA ({factura.porcentajeRetencion}%):</span> Bs. {notaDebito.retencionIVADiferencial.toFixed(2)}</p>
                  <p className="font-medium mt-2">Nota de Débito después de retención: Bs. {notaDebito.montoNetoPagarNotaDebito.toFixed(2)}</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Verificación del cálculo:</h5>
                  <p>• El diferencial cambiario con IVA (Bs. {notaDebito.diferencialCambiarioConIVA.toFixed(2)}) se descompone en:</p>
                  <p className="ml-4">- Base imponible: Bs. {notaDebito.baseImponibleDiferencial.toFixed(2)}</p>
                  <p className="ml-4">- IVA ({factura.alicuotaIVA}%): Bs. {notaDebito.ivaDiferencial.toFixed(2)}</p>
                  <p>• La retención del IVA se calcula sobre el IVA del diferencial:</p>
                  <p className="ml-4">Bs. {notaDebito.ivaDiferencial.toFixed(2)} × {(factura.porcentajeRetencion / 100).toFixed(2)} = Bs. {notaDebito.retencionIVADiferencial.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-xl text-center mb-4">Resumen Final de la Operación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p><span className="font-medium">Factura original (después de retención):</span> Bs. {(factura.total - factura.retencionIVA).toFixed(2)}</p>
                    {notaCredito && (
                      <p><span className="font-medium">Menos: Nota de Crédito (después de retención):</span> Bs. {(notaCredito.total - notaCredito.retencionIVA).toFixed(2)}</p>
                    )}
                    <p><span className="font-medium">Más: Nota de Débito (después de retención):</span> Bs. {notaDebito.montoNetoPagarNotaDebito.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <p className="text-center text-2xl font-bold">MONTO FINAL A PAGAR: Bs. {montoFinalPagar.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => reset()}
          >
            Limpiar
          </Button>
          <Button 
            type="submit"
            disabled={!notaDebito}
          >
            Generar Nota de Débito
          </Button>
        </div>
      </form>
    </Card>
  );
};