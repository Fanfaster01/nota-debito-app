// src/components/forms/FacturaForm.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Factura } from '@/types';
import { facturaSchema } from '@/lib/validators';
import { recalcularFactura } from '@/lib/calculations';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { proveedorService, ProveedorWithBanco } from '@/lib/services/proveedorService';
import { ProveedorModal } from './ProveedorModal';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

interface FacturaFormProps {
  onSubmit: (data: Factura) => void;
  defaultValues?: Partial<Factura>;
}

export const FacturaForm: React.FC<FacturaFormProps> = ({ onSubmit, defaultValues }) => {
  const { company } = useAuth();
  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [searchingProveedor, setSearchingProveedor] = useState(false);
  const [proveedorFound, setProveedorFound] = useState(false);
  const [proveedorSuggestions, setProveedorSuggestions] = useState<ProveedorWithBanco[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<Factura>({
    resolver: zodResolver(facturaSchema),
    defaultValues: defaultValues || {
      fecha: new Date(),
      proveedor: {
        nombre: '',
        rif: '',
        direccion: '',
      },
      cliente: {
        nombre: company?.name || '',
        rif: company?.rif || '',
        direccion: company?.address || '',
      },
      baseImponible: 0,
      montoExento: 0,
      subTotal: 0,
      alicuotaIVA: 16,
      iva: 0,
      total: 0,
      porcentajeRetencion: 75,
      retencionIVA: 0,
      tasaCambio: 0,
      montoUSD: 0,
    },
  });

  // Watch for changes
  const baseImponible = watch('baseImponible');
  const montoExento = watch('montoExento');
  const alicuotaIVA = watch('alicuotaIVA');
  const porcentajeRetencion = watch('porcentajeRetencion');
  const tasaCambio = watch('tasaCambio');
  const proveedorRif = watch('proveedor.rif');

  // Auto-completar datos del cliente cuando se carga la compañía
  useEffect(() => {
    if (company) {
      setValue('cliente.nombre', company.name);
      setValue('cliente.rif', company.rif);
      setValue('cliente.direccion', company.address);
    }
  }, [company, setValue]);

  // Buscar proveedor por RIF con debounce
  const searchProveedorByRif = useCallback(
    debounce(async (rif: string) => {
      if (!rif || rif.length < 3) {
        setProveedorFound(false);
        setProveedorSuggestions([]);
        return;
      }

      setSearchingProveedor(true);
      try {
        // Buscar por RIF exacto
        const { data: proveedorExacto, error: errorExacto } = await proveedorService.getProveedorByRif(rif);
        
        if (!errorExacto && proveedorExacto) {
          // Proveedor encontrado - autocompletar
          setValue('proveedor.nombre', proveedorExacto.nombre);
          setValue('proveedor.direccion', proveedorExacto.direccion);
          
          // AQUÍ ES DONDE SE ACTUALIZA EL PORCENTAJE DE RETENCIÓN
          setValue('porcentajeRetencion', proveedorExacto.porcentaje_retencion || 75);
          
          setProveedorFound(true);
          setProveedorSuggestions([]);
          setShowSuggestions(false);
        } else {
          // No encontrado exacto, buscar sugerencias
          const { data: sugerencias } = await proveedorService.searchProveedores(rif);
          setProveedorSuggestions(sugerencias || []);
          setShowSuggestions((sugerencias?.length || 0) > 0);
          setProveedorFound(false);
        }
      } catch (error) {
        console.error('Error buscando proveedor:', error);
        setProveedorFound(false);
      } finally {
        setSearchingProveedor(false);
      }
    }, 500),
    [setValue]
  );

  // Efecto para buscar cuando cambia el RIF
  useEffect(() => {
    searchProveedorByRif(proveedorRif);
  }, [proveedorRif, searchProveedorByRif]);

  // Update calculated fields when dependencies change
  useEffect(() => {
    const values = {
      baseImponible,
      montoExento,
      alicuotaIVA,
      porcentajeRetencion,
      tasaCambio,
    };
    
    const recalculatedValues = recalcularFactura(values);
    
    setValue('subTotal', recalculatedValues.subTotal || 0);
    setValue('iva', recalculatedValues.iva || 0);
    setValue('total', recalculatedValues.total || 0);
    setValue('retencionIVA', recalculatedValues.retencionIVA || 0);
    setValue('montoUSD', recalculatedValues.montoUSD || 0);
  }, [baseImponible, montoExento, alicuotaIVA, porcentajeRetencion, tasaCambio, setValue]);

  const onFormSubmit = (data: Factura) => {
    // Asegurar que los datos del cliente sean los de la compañía
    if (company) {
      data.cliente = {
        nombre: company.name,
        rif: company.rif,
        direccion: company.address,
      };
    }
    onSubmit(data);
  };

  const handleReset = () => {
    reset({
      fecha: new Date(),
      proveedor: {
        nombre: '',
        rif: '',
        direccion: '',
      },
      cliente: {
        nombre: company?.name || '',
        rif: company?.rif || '',
        direccion: company?.address || '',
      },
      baseImponible: 0,
      montoExento: 0,
      subTotal: 0,
      alicuotaIVA: 16,
      iva: 0,
      total: 0,
      porcentajeRetencion: 75,
      retencionIVA: 0,
      tasaCambio: 0,
      montoUSD: 0,
    });
    setProveedorFound(false);
    setProveedorSuggestions([]);
  };

  const handleSaveProveedor = async (proveedorData: any) => {
    try {
      const { data: nuevoProveedor, error } = await proveedorService.createProveedor(proveedorData);
      
      if (error) {
        console.error('Error al crear proveedor:', error);
        alert('Error al crear el proveedor: ' + error.message);
        return;
      }

      if (nuevoProveedor) {
        // Autocompletar los campos con el nuevo proveedor
        setValue('proveedor.nombre', nuevoProveedor.nombre);
        setValue('proveedor.rif', nuevoProveedor.rif);
        setValue('proveedor.direccion', nuevoProveedor.direccion);
        
        // TAMBIÉN ACTUALIZAR EL PORCENTAJE CUANDO SE CREA UN NUEVO PROVEEDOR
        setValue('porcentajeRetencion', nuevoProveedor.porcentaje_retencion || 75);
        
        setProveedorFound(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar el proveedor');
    }
  };

  const selectProveedor = (proveedor: ProveedorWithBanco) => {
    setValue('proveedor.nombre', proveedor.nombre);
    setValue('proveedor.rif', proveedor.rif);
    setValue('proveedor.direccion', proveedor.direccion);
    
    // ACTUALIZAR PORCENTAJE AL SELECCIONAR DE LAS SUGERENCIAS
    setValue('porcentajeRetencion', proveedor.porcentaje_retencion || 75);
    
    setProveedorFound(true);
    setShowSuggestions(false);
    setProveedorSuggestions([]);
  };

  return (
    <>
      <Card title="Datos de la Factura">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Número de Factura"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Datos del Proveedor</h4>
                <button
                  type="button"
                  onClick={() => setShowProveedorModal(true)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nuevo Proveedor
                </button>
              </div>
              
              <div className="relative">
                <div className="relative">
                  <Input
                    label="RIF"
                    {...register('proveedor.rif')}
                    error={errors.proveedor?.rif?.message}
                    placeholder="J-12345678-9"
                    className={proveedorFound ? 'pr-8' : ''}
                  />
                  {searchingProveedor && (
                    <div className="absolute right-2 top-8">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {proveedorFound && (
                    <div className="absolute right-2 top-8">
                      <div className="text-green-500">✓</div>
                    </div>
                  )}
                </div>
                
                {/* Sugerencias dropdown */}
                {showSuggestions && proveedorSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                    {proveedorSuggestions.map((prov) => (
                      <button
                        key={prov.id}
                        type="button"
                        onClick={() => selectProveedor(prov)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                      >
                        <div className="font-medium">{prov.nombre}</div>
                        <div className="text-sm text-gray-500">{prov.rif}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                label="Nombre del Proveedor"
                {...register('proveedor.nombre')}
                error={errors.proveedor?.nombre?.message}
                readOnly={proveedorFound}
                className={proveedorFound ? 'bg-gray-50' : ''}
              />
              <Input
                label="Dirección"
                {...register('proveedor.direccion')}
                error={errors.proveedor?.direccion?.message}
                readOnly={proveedorFound}
                className={proveedorFound ? 'bg-gray-50' : ''}
              />
              
              {/* Mostrar información adicional del proveedor cuando se encuentra */}
              {proveedorFound && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                  <p className="text-blue-800">
                    <strong>Retención configurada:</strong> {porcentajeRetencion}%
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Datos del Cliente (Su Compañía)</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-3">
                  Los datos del cliente corresponden a su compañía asignada y no pueden ser modificados.
                </p>
                <Input
                  label="Nombre del Cliente"
                  {...register('cliente.nombre')}
                  error={errors.cliente?.nombre?.message}
                  readOnly
                  className="bg-gray-100 mb-3"
                />
                <Input
                  label="RIF"
                  {...register('cliente.rif')}
                  error={errors.cliente?.rif?.message}
                  readOnly
                  className="bg-gray-100 mb-3"
                />
                <Input
                  label="Dirección"
                  {...register('cliente.direccion')}
                  error={errors.cliente?.direccion?.message}
                  readOnly
                  className="bg-gray-100 mt-1"
                />
              </div>
            </div>
          </div>

          {/* Resto del formulario sin cambios */}
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
              error={errors.porcentajeRetencion?.message}
              className={proveedorFound ? 'bg-gray-50' : ''}
              readOnly={proveedorFound}
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
              onClick={handleReset}
            >
              Limpiar
            </Button>
            <Button type="submit">Guardar Factura</Button>
          </div>
        </form>
      </Card>

      {/* Modal para agregar proveedor */}
      <ProveedorModal
        isOpen={showProveedorModal}
        onClose={() => setShowProveedorModal(false)}
        onSave={handleSaveProveedor}
        initialRif={getValues('proveedor.rif')}
      />
    </>
  );
};