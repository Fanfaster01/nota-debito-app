// src/app/notas-debito/page.tsx
'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotasDebitoContent } from '@/components/notas-debito/NotasDebitoContent';

export default function NotasDebitoPage() {
  return (
    <MainLayout>
      <NotasDebitoContent />
    </MainLayout>
  );
}