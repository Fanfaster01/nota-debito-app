'use client';

import React, { useState } from 'react';
import { Factura, NotaCredito, NotaDebito } from '@/types';
import { calcularMontoFinalPagar } from '@/lib/calculations';
import { FacturaForm } from '@/components/forms/FacturaForm';
import { NotaCreditoForm } from '@/components/forms/NotaCreditoForm';
import { NotaDebitoForm } from '@/components/forms/NotaDebitoForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { NotaDebitoPDFViewer, NotaDebitoPDFDownloadLink } from '@/components/pdf/NotaDebitoPDF';

export default function Home() {
  const [step, setStep] = useState<'factura' | 'notaCredito' | 'notaDebito' | 'resultado'>('factura');
  const [factura, setFactura] = useState<Factura | null>(null);
  const [notaCredito, setNotaCredito] = useState<NotaCredito | null>(null);
  const [notaDebito, setNotaDebito] = useState<NotaDebito | null>(null);
  const [showNotaCredito, setShowNotaCredito] = useState<boolean>(false);
  const [montoFinalPagar, setMontoFinalPagar] = useState<number>(0);

  const handleFacturaSubmit = (data: Factura) => {
    setFactura(data);
    setStep('notaCredito');
  };

  const handleNotaCreditoSubmit = (data: NotaCredito) => {
    setNotaCredito(data);
    setStep('notaDebito');
  };

  const handleSkipNotaCredito = () => {
    setNotaCredito(null);
    setStep('notaDebito');
  };

  const handleNotaDebitoSubmit = (data: NotaDebito) => {
    setNotaDebito(data);
    
    if (factura) {
      const montoFinal = calcularMontoFinalPagar(factura, notaCredito, data);
      setMontoFinalPagar(montoFinal);
    }
    
    setStep('resultado');
  };

  const handleReset = () => {
    setFactura(null);
    setNotaCredito(null);
    setNotaDebito(null);
    setStep('factura');
    setShowNotaCredito(false);
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
                 step === 'notaCredito' ? 'Paso 2: Datos de la Nota de Crédito (opcional)' : 
                 step === 'notaDebito' ? 'Paso 3: Generar Nota de Débito' : 
                 'Resultado'}
              </span>
            </div>
          </div>
        </div>

        {step === 'factura' && (
          <FacturaForm onSubmit={handleFacturaSubmit} />
        )}

        {step === 'notaCredito' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium">¿Existe una Nota de Crédito asociada a esta factura?</h2>
              <div className="flex space-x-4">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowNotaCredito(true)}
                >
                  Sí, ingresar Nota de Crédito
                </Button>
                <Button 
                  onClick={handleSkipNotaCredito}
                >
                  No, continuar sin Nota de Crédito
                </Button>
              </div>
            </div>

            {showNotaCredito && (
              <NotaCreditoForm 
                factura={factura} 
                onSubmit={handleNotaCreditoSubmit}
              />
            )}
          </div>
        )}

        {step === 'notaDebito' && (
          <NotaDebitoForm 
            factura={factura} 
            notaCredito={notaCredito}
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
              onClick={() => setStep(step === 'notaDebito' ? 'notaCredito' : 'factura')}
            >
              Volver atrás
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}