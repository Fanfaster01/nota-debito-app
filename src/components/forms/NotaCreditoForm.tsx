// src/components/forms/NotaCreditoForm.tsx
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotaCredito, Factura } from '@/types';
import { notaCreditoSchema } from '@/lib/validators';
import { recalcularNotaCredito } from '@/lib/calculations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface NotaCreditoFormProps {
  factura: Factura | null;
  onSubmit: (data: NotaCredito) => void;
  defaultValues?: Partial<NotaCredito>;
}

export const NotaCreditoForm: React.FC<NotaCreditoFormProps> = ({ 
  factura, 
  onSubmit, 
  defaultValues 
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    reset,
  } = useForm<NotaCredito>({
    resolver: zodResolver(notaCreditoSchema),
    defaultValues: defaultValues || {
      fecha: new Date(),
      facturaAfectada: factura?.numero || '',
      montoExento: 0,
      baseImponible: 0,
      subTotal: 0,
      alicuotaIVA: factura?.alicuotaIVA || 16,
      iva: 0,
      total: 0,
      porcentajeRetencion: factura?.porcentajeRetencion || 75,
      retencionIVA: 0,
      tasaCambio: factura?.tasaCambio || 0,
      montoUSD: 0,
    },
  });

  // Watch for changes in fields that affect calculations
  const baseImponible = watch('baseImponible');
  const montoExento = watch('montoExento');
  const alicuotaIVA = watch('alicuotaIVA');
  const porcentajeRetencion = watch('porcentajeRetencion');
  const tasaCambio = watch('tasaCambio');

  // Update calculated fields when dependencies change
  useEffect(() => {
    const values = {
      baseImponible,
      montoExento,
      alicuotaIVA,
      porcentajeRetencion,
      tasaCambio,
    };
    
    const recalculatedValues = recalcularNotaCredito(values);
    
    setValue('subTotal', recalculatedValues.subTotal || 0);
    setValue('iva', recalculatedValues.iva || 0);
    setValue('total', recalculatedValues.total || 0);
    setValue('retencionIVA', recalculatedValues.retencionIVA || 0);
    setValue('montoUSD', recalculatedValues.montoUSD || 0);
  }, [baseImponible, montoExento, alicuotaIVA, porcentajeRetencion, tasaCambio, setValue]);

  // Update form values when factura changes
  useEffect(() => {
    if (factura) {
      setValue('facturaAfectada', factura.numero);
      setValue('alicuotaIVA', factura.alicuotaIVA);
      setValue('porcentajeRetencion', factura.porcentajeRetencion);
      setValue('tasaCambio', factura.tasaCambio);
    }
  }, [factura, setValue]);

  const onFormSubmit = (data: NotaCredito) => {
    onSubmit(data);
  };

  return (
    <Card title="Datos de la Nota de Crédito">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Número de Nota de Crédito"
            {...register('numero')}
            error={errors.numero?.message}
          />
          <Input
            label="Número de Control"
            {...register('numeroControl')}
            error={errors.numeroControl?.message}
          />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Factura Afectada"
            {...register('facturaAfectada')}
            readOnly={!!factura}
            error={errors.facturaAfectada?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Monto Exento"
            type="number"
            step="0.01"
            {...register('montoExento', { valueAsNumber: true })}
            error={errors.montoExento?.message}
          />
          <Input
            label="Base Imponible"
            type="number"
            step="0.01"
            {...register('baseImponible', { valueAsNumber: true })}
            error={errors.baseImponible?.message}
          />
          <Input
            label="Subtotal"
            type="number"
            step="0.01"
            {...register('subTotal', { valueAsNumber: true })}
            readOnly
            error={errors.subTotal?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Alícuota IVA (%)"
            type="number"
            step="0.01"
            {...register('alicuotaIVA', { valueAsNumber: true })}
            readOnly={!!factura}
            error={errors.alicuotaIVA?.message}
          />
          <Input
            label="IVA"
            type="number"
            step="0.01"
            {...register('iva', { valueAsNumber: true })}
            readOnly
            error={errors.iva?.message}
          />
          <Input
            label="Total"
            type="number"
            step="0.01"
            {...register('total', { valueAsNumber: true })}
            readOnly
            error={errors.total?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Tasa de Cambio (Bs/USD)"
            type="number"
            step="0.01"
            {...register('tasaCambio', { valueAsNumber: true })}
            readOnly={!!factura}
            error={errors.tasaCambio?.message}
          />
          <Input
            label="Monto en USD"
            type="number"
            step="0.01"
            {...register('montoUSD', { valueAsNumber: true })}
            readOnly
            error={errors.montoUSD?.message}
          />
          <div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Porcentaje de Retención (%)"
            type="number"
            step="0.01"
            {...register('porcentajeRetencion', { valueAsNumber: true })}
            readOnly={!!factura}
            error={errors.porcentajeRetencion?.message}
          />
          <Input
            label="Monto de Retención IVA"
            type="number"
            step="0.01"
            {...register('retencionIVA', { valueAsNumber: true })}
            readOnly
            error={errors.retencionIVA?.message}
          />
          <div></div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => reset()}
          >
            Limpiar
          </Button>
          <Button type="submit">Guardar Nota de Crédito</Button>
        </div>
      </form>
    </Card>
  );
};