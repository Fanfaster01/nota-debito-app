// src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Factura, NotaCredito, NotaDebito } from '@/types';
import { calcularMontoFinalPagar, verificarLimiteNotasCredito } from '@/lib/calculations';
import { FacturaForm } from '@/components/forms/FacturaForm';
import { NotaCreditoForm } from '@/components/forms/NotaCreditoForm';
import { NotaDebitoForm } from '@/components/forms/NotaDebitoForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NotaDebitoPDFViewer, NotaDebitoPDFDownloadLink } from '@/components/pdf/NotaDebitoPDF';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { facturaService, notaCreditoService, notaDebitoService } from '@/lib/services';
import { format } from 'date-fns';

export default function Home() {
  const { user, company } = useAuth();
  const [step, setStep] = useState<'factura' | 'notasCredito' | 'notaDebito' | 'resultado'>('factura');
  const [factura, setFactura] = useState<Factura | null>(null);
  const [facturaId, setFacturaId] = useState<string | null>(null);
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([]);
  const [notasCreditoIds, setNotasCreditoIds] = useState<string[]>([]);
  const [notaDebito, setNotaDebito] = useState<NotaDebito | null>(null);
  const [montoFinalPagar, setMontoFinalPagar] = useState<number>(0);
  const [currentNotaCredito, setCurrentNotaCredito] = useState<NotaCredito | null>(null);
  const [showNotaCreditoForm, setShowNotaCreditoForm] = useState<boolean>(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar límite de notas de crédito cuando cambian las notas o la factura
  useEffect(() => {
    if (factura && notasCredito.length > 0) {
      const { excedeLimite } = verificarLimiteNotasCredito(factura, notasCredito);
      
      if (excedeLimite) {
        setLimitError(`Las notas de crédito exceden el monto de la factura. Por favor, ajuste los montos.`);
      } else {
        setLimitError(null);
      }
    }
  }, [factura, notasCredito]);

  const handleFacturaSubmit = async (data: Factura) => {
    if (!user || !company) {
      setError('Usuario o compañía no encontrados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si el número de factura ya existe en la compañía
      const { data: existingFacturas } = await facturaService.getFacturasByCompany(company.id);
      
      if (existingFacturas?.some(f => f.numero === data.numero)) {
        setError(`Ya existe una factura con el número ${data.numero}`);
        return;
      }

      // Crear la factura en la base de datos
      const { data: createdFactura, error: createError } = await facturaService.createFactura(
        data, 
        company.id, 
        user.id
      );

      if (createError) {
        setError('Error al guardar la factura: ' + (createError.message || 'Error desconocido'));
        return;
      }

      if (!createdFactura) {
        setError('Error: No se pudo crear la factura');
        return;
      }

      setFactura(data);
      setFacturaId(createdFactura.id);
      setStep('notasCredito');
    } catch (err: any) {
      setError(err.message || 'Error al procesar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleNotaCreditoSubmit = async (data: NotaCredito) => {
    if (!user || !company || !facturaId) {
      setError('Datos de usuario, compañía o factura no encontrados');
      return;
    }

    // Verificar si la nueva nota de crédito excedería el límite
    const nuevasNotas = [...notasCredito, data];
    const { excedeLimite, montoDisponibleUSD } = verificarLimiteNotasCredito(factura!, nuevasNotas);
    
    if (excedeLimite) {
      setLimitError(`La nota de crédito excede el monto disponible de la factura. Monto disponible: $${montoDisponibleUSD.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar si el número de nota de crédito ya existe en la compañía
      const { data: existingNotas } = await notaCreditoService.getNotasCreditoByCompany(company.id);
      
      if (existingNotas?.some(nc => nc.numero === data.numero)) {
        setError(`Ya existe una nota de crédito con el número ${data.numero}`);
        return;
      }

      // Crear la nota de crédito en la base de datos
      const { data: createdNotaCredito, error: createError } = await notaCreditoService.createNotaCredito(
        data,
        facturaId,
        company.id,
        user.id
      );

      if (createError) {
        setError('Error al guardar la nota de crédito: ' + (createError.message || 'Error desconocido'));
        return;
      }

      if (!createdNotaCredito) {
        setError('Error: No se pudo crear la nota de crédito');
        return;
      }

      setNotasCredito([...notasCredito, data]);
      setNotasCreditoIds([...notasCreditoIds, createdNotaCredito.id]);
      setCurrentNotaCredito(null);
      setShowNotaCreditoForm(false);
      setLimitError(null);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la nota de crédito');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNotaCredito = (index: number) => {
    setCurrentNotaCredito(notasCredito[index]);
    setShowNotaCreditoForm(true);
  };

  const handleDeleteNotaCredito = async (index: number) => {
    if (!notasCreditoIds[index]) return;
    
    setLoading(true);
    try {
      const { error: deleteError } = await notaCreditoService.deleteNotaCredito(notasCreditoIds[index]);
      
      if (deleteError) {
        setError('Error al eliminar la nota de crédito: ' + deleteError.message);
        return;
      }

      const updatedNotas = [...notasCredito];
      const updatedIds = [...notasCreditoIds];
      updatedNotas.splice(index, 1);
      updatedIds.splice(index, 1);
      setNotasCredito(updatedNotas);
      setNotasCreditoIds(updatedIds);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la nota de crédito');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToNotaDebito = () => {
    setStep('notaDebito');
  };

  const handleNotaDebitoSubmit = async (data: NotaDebito) => {
    if (!user || !company || !facturaId) {
      setError('Datos de usuario, compañía o factura no encontrados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generar número secuencial para la nota de débito
      const numeroNotaDebito = `ND-${Date.now()}`;
      const notaDebitoCompleta = {
        ...data,
        numero: numeroNotaDebito,
      };

      // Crear la nota de débito en la base de datos
      const { data: createdNotaDebito, error: createError } = await notaDebitoService.createNotaDebito(
        notaDebitoCompleta,
        facturaId,
        notasCreditoIds,
        company.id,
        user.id
      );

      if (createError) {
        setError('Error al guardar la nota de débito: ' + (createError.message || 'Error desconocido'));
        return;
      }

      if (!createdNotaDebito) {
        setError('Error: No se pudo crear la nota de débito');
        return;
      }

      setNotaDebito(notaDebitoCompleta);
      
      if (factura) {
        const montoFinal = calcularMontoFinalPagar(factura, notasCredito, notaDebitoCompleta);
        setMontoFinalPagar(montoFinal);
      }
      
      setStep('resultado');
    } catch (err: any) {
      setError(err.message || 'Error al crear la nota de débito');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFactura(null);
    setFacturaId(null);
    setNotasCredito([]);
    setNotasCreditoIds([]);
    setNotaDebito(null);
    setStep('factura');
    setShowNotaCreditoForm(false);
    setCurrentNotaCredito(null);
    setLimitError(null);
    setError(null);
    setMontoFinalPagar(0);
  };

  return (
    <ProtectedLayout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Generador de Notas de Débito por Diferencial Cambiario
            </h1>
            <p className="mt-3 text-lg text-gray-500">
              Crear notas de débito por diferencial cambiario para facturas en divisas
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-600">Procesando...</p>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-gray-50 px-3 text-lg font-medium text-gray-500">
                  {step === 'factura' ? 'Paso 1: Datos de la Factura' : 
                   step === 'notasCredito' ? 'Paso 2: Datos de las Notas de Crédito (opcional)' : 
                   step === 'notaDebito' ? 'Paso 3: Generar Nota de Débito' : 
                   'Resultado'}
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Factura Form */}
          {step === 'factura' && (
            <FacturaForm onSubmit={handleFacturaSubmit} />
          )}

          {/* Step 2: Notas de Crédito */}
          {step === 'notasCredito' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">Notas de Crédito asociadas a la factura</h2>
              </div>

              {limitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{limitError}</p>
                </div>
              )}

              {/* Lista de notas de crédito */}
              {notasCredito.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-lg mb-2">Notas de crédito registradas:</h3>
                  <div className="bg-white rounded-md shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto (Bs)</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto (USD)</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {notasCredito.map((notaCredito, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">{notaCredito.numero}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {notaCredito.fecha instanceof Date ? format(notaCredito.fecha, 'dd/MM/yyyy') : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{notaCredito.total.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{notaCredito.montoUSD.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleEditNotaCredito(index)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                                disabled={loading}
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteNotaCredito(index)}
                                className="text-red-600 hover:text-red-900"
                                disabled={loading}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Formulario de nota de crédito */}
              {!showNotaCreditoForm ? (
                <div className="flex space-x-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowNotaCreditoForm(true)}
                    disabled={loading}
                  >
                    Agregar Nota de Crédito
                  </Button>
                  <Button 
                    onClick={handleContinueToNotaDebito}
                    disabled={loading}
                  >
                    {notasCredito.length > 0 ? 'Continuar sin agregar más notas' : 'Continuar sin Notas de Crédito'}
                  </Button>
                </div>
              ) : (
                <>
                  <NotaCreditoForm 
                    factura={factura} 
                    onSubmit={handleNotaCreditoSubmit}
                    defaultValues={currentNotaCredito || undefined}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowNotaCreditoForm(false);
                      setCurrentNotaCredito(null);
                    }}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Nota de Débito */}
          {step === 'notaDebito' && (
            <NotaDebitoForm 
              factura={factura} 
              notasCredito={notasCredito}
              onSubmit={handleNotaDebitoSubmit}
            />
          )}

          {/* Step 4: Resultado */}
          {step === 'resultado' && notaDebito && (
            <div className="space-y-8">
              <Card title="Nota de Débito Generada">
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-700 font-medium">
                      La Nota de Débito por Diferencial Cambiario ha sido generada y guardada exitosamente.
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <Button 
                      variant="outline" 
                      onClick={handleReset}
                    >
                      Crear Nueva Nota
                    </Button>
                    <NotaDebitoPDFDownloadLink 
                      notaDebito={notaDebito} 
                      montoFinalPagar={montoFinalPagar} 
                    />
                  </div>
                </div>
              </Card>
              
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <NotaDebitoPDFViewer 
                  notaDebito={notaDebito} 
                  montoFinalPagar={montoFinalPagar}
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          {step !== 'factura' && step !== 'resultado' && (
            <div className="mt-8 flex justify-start">
              <Button 
                variant="outline" 
                onClick={() => setStep(step === 'notaDebito' ? 'notasCredito' : 'factura')}
                disabled={loading}
              >
                Volver atrás
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}