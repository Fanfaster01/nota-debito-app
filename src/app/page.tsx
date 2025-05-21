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
import { format } from 'date-fns';

export default function Home() {
  const [step, setStep] = useState<'factura' | 'notasCredito' | 'notaDebito' | 'resultado'>('factura');
  const [factura, setFactura] = useState<Factura | null>(null);
  const [notasCredito, setNotasCredito] = useState<NotaCredito[]>([]);
  const [notaDebito, setNotaDebito] = useState<NotaDebito | null>(null);
  const [montoFinalPagar, setMontoFinalPagar] = useState<number>(0);
  const [currentNotaCredito, setCurrentNotaCredito] = useState<NotaCredito | null>(null);
  const [showNotaCreditoForm, setShowNotaCreditoForm] = useState<boolean>(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Verificar límite de notas de crédito cuando cambian las notas o la factura
  useEffect(() => {
    if (factura && notasCredito.length > 0) {
      const { excedeLimite, montoDisponibleUSD } = verificarLimiteNotasCredito(factura, notasCredito);
      
      if (excedeLimite) {
        setLimitError(`Las notas de crédito exceden el monto de la factura. Por favor, ajuste los montos.`);
      } else {
        setLimitError(null);
      }
    }
  }, [factura, notasCredito]);

  const handleFacturaSubmit = (data: Factura) => {
    setFactura(data);
    setStep('notasCredito');
  };

  const handleNotaCreditoSubmit = (data: NotaCredito) => {
    // Verificar si la nueva nota de crédito excedería el límite
    const nuevasNotas = [...notasCredito, data];
    const { excedeLimite, montoDisponibleUSD } = verificarLimiteNotasCredito(factura!, nuevasNotas);
    
    if (excedeLimite) {
      setLimitError(`La nota de crédito excede el monto disponible de la factura. Monto disponible: $${montoDisponibleUSD.toFixed(2)}`);
      return;
    }
    
    setNotasCredito([...notasCredito, data]);
    setCurrentNotaCredito(null);
    setShowNotaCreditoForm(false);
    setLimitError(null);
  };

  const handleEditNotaCredito = (index: number) => {
    setCurrentNotaCredito(notasCredito[index]);
    setShowNotaCreditoForm(true);
  };

  const handleDeleteNotaCredito = (index: number) => {
    const updatedNotas = [...notasCredito];
    updatedNotas.splice(index, 1);
    setNotasCredito(updatedNotas);
  };

  const handleSkipNotasCredito = () => {
    setStep('notaDebito');
  };

  const handleContinueToNotaDebito = () => {
    setStep('notaDebito');
  };

  const handleNotaDebitoSubmit = (data: NotaDebito) => {
    setNotaDebito(data);
    
    if (factura) {
      const montoFinal = calcularMontoFinalPagar(factura, notasCredito, data);
      setMontoFinalPagar(montoFinal);
    }
    
    setStep('resultado');
  };

  const handleReset = () => {
    setFactura(null);
    setNotasCredito([]);
    setNotaDebito(null);
    setStep('factura');
    setShowNotaCreditoForm(false);
    setCurrentNotaCredito(null);
    setLimitError(null);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Generador de Notas de Débito por Diferencial Cambiario
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Crear notas de débito por diferencial cambiario para facturas en divisas
          </p>
        </div>

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

        {step === 'factura' && (
          <FacturaForm onSubmit={handleFacturaSubmit} />
        )}

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
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteNotaCredito(index)}
                              className="text-red-600 hover:text-red-900"
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

            {/* Mostrar el formulario solo cuando se presiona el botón */}
            {!showNotaCreditoForm ? (
              <div className="flex space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNotaCreditoForm(true)}
                >
                  Agregar Nota de Crédito
                </Button>
                <Button 
                  onClick={handleContinueToNotaDebito}
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
                >
                  Cancelar
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'notaDebito' && (
          <NotaDebitoForm 
            factura={factura} 
            notasCredito={notasCredito}
            onSubmit={handleNotaDebitoSubmit}
          />
        )}

        {step === 'resultado' && notaDebito && (
          <div className="space-y-8">
            <Card title="Nota de Débito Generada">
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-700 font-medium">
                    La Nota de Débito por Diferencial Cambiario ha sido generada exitosamente.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                  >
                    Volver al inicio
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

        {step !== 'factura' && step !== 'resultado' && (
          <div className="mt-8 flex justify-start">
            <Button 
              variant="outline" 
              onClick={() => setStep(step === 'notaDebito' ? 'notasCredito' : 'factura')}
            >
              Volver atrás
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}