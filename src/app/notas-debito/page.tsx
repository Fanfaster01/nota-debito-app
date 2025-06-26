// src/app/notas-debito/page.tsx
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotasDebitoContent } from '@/components/notas-debito/NotasDebitoContent';

export default function NotasDebitoPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Notas de Débito Automáticas
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Consulta de notas de débito generadas automáticamente por diferencial cambiario
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>ℹ️ Sistema Actualizado:</strong> Las notas de débito ahora se generan automáticamente 
              al procesar pagos en el módulo de <strong>Cuentas por Pagar</strong> cuando hay diferencial 
              cambiario significativo. Esta sección es solo para consulta del historial.
            </p>
          </div>
        </div>
        <NotasDebitoContent embedded={true} />
      </div>
    </MainLayout>
  );
}