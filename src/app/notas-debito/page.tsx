// src/app/notas-debito/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Factura, NotaCredito, NotaDebito } from '@/types';
import { calcularMontoFinalPagar, verificarLimiteNotasCredito } from '@/lib/calculations';
import { FacturaForm } from '@/components/forms/FacturaForm';
import { NotaCreditoForm } from '@/components/forms/NotaCreditoForm';
import { NotaDebitoForm } from '@/components/forms/NotaDebitoForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { NotaDebitoPDFViewer, NotaDebitoPDFDownloadLink } from '@/components/pdf/NotaDebitoPDF';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { facturaService, notaCreditoService, notaDebitoService } from '@/lib/services';
import { format } from 'date-fns';
import { exportNotasDebitoToExcel } from '@/utils/exportExcel';
import { 
  PlusIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Importar nuevos componentes
import { NotasDebitoFilters } from '@/components/notas-debito/NotasDebitoFilters';
import { NotasDebitoList } from '@/components/notas-debito/NotasDebitoList';
import { NotaDebitoEditModal } from '@/components/notas-debito/NotaDebitoEditModal';
import { NotaDebitoDetailModal } from '@/components/notas-debito/NotaDebitoDetailModal';
import { QuickSummary } from '@/components/notas-debito/QuickSummary';

export default function NotasDebitoPage() {
  const { user, company } = useAuth();
  
  // Estados para crear nota de débito
  const [activeTab, setActiveTab] = useState<'crear' | 'consultar'>('crear');
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para consultar notas de débito
  const [notasDebitoList, setNotasDebitoList] = useState<NotaDebito[]>([]);
  const [allNotasDebito, setAllNotasDebito] = useState<NotaDebito[]>([]); // Para exportar todo
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    proveedor: '',
    numeroNota: '',
    numeroFactura: ''
  });
  const [stats, setStats] = useState({
    totalNotas: 0,
    montoTotalDiferencial: 0,
    montoTotalFinal: 0
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Estados para modales
  const [editingNota, setEditingNota] = useState<NotaDebito | null>(null);
  const [viewingNota, setViewingNota] = useState<NotaDebito | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Calcular paginación
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotasDebito = notasDebitoList.slice(startIndex, endIndex);

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

  // Cargar notas de débito al cambiar de tab o al iniciar
  useEffect(() => {
    if (activeTab === 'consultar' && company) {
      handleSearch();
    }
  }, [activeTab, company]);

  // Funciones para búsqueda y filtros
  const handleSearch = async () => {
    if (!company) return;

    setSearchLoading(true);
    setError(null);

    try {
      const searchFilters: any = {};
      
      if (filters.fechaDesde) searchFilters.fechaDesde = new Date(filters.fechaDesde);
      if (filters.fechaHasta) searchFilters.fechaHasta = new Date(filters.fechaHasta);
      if (filters.proveedor) searchFilters.proveedorId = filters.proveedor;
      if (filters.numeroNota) searchFilters.numeroNota = filters.numeroNota;
      if (filters.numeroFactura) searchFilters.numeroFactura = filters.numeroFactura;

      const { data, error: searchError } = await notaDebitoService.searchNotasDebito(
        company.id,
        searchFilters
      );

      if (searchError) {
        setError('Error al buscar notas de débito: ' + searchError.message);
        return;
      }

      setNotasDebitoList(data || []);
      setAllNotasDebito(data || []); // Guardar todos los resultados para exportación
      setTotalItems(data?.length || 0);
      setCurrentPage(1); // Resetear a primera página en nueva búsqueda

      // Obtener estadísticas
      const { data: statsData } = await notaDebitoService.getNotasDebitoStats(
        company.id,
        searchFilters
      );

      if (statsData) {
        setStats(statsData);
      }
    } catch (err: any) {
      setError('Error al buscar: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      fechaDesde: '',
      fechaHasta: '',
      proveedor: '',
      numeroNota: '',
      numeroFactura: ''
    });
  };

  const handleExportExcel = async () => {
    if (allNotasDebito.length === 0) {
      setError('No hay datos para exportar');
      return;
    }

    setExportingExcel(true);
    
    try {
      // Pequeño delay para mostrar el estado de carga
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await exportNotasDebitoToExcel(allNotasDebito, 'notas_debito', {
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        proveedor: filters.proveedor
      });
      
      if (result.success) {
        setSuccessMessage(`Archivo Excel generado exitosamente con ${allNotasDebito.length} registros`);
      } else {
        setError(`Error al exportar: ${result.error}`);
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setExportingExcel(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 3000);
    }
  };

  // Handlers para paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Volver a la primera página al cambiar items por página
  };

  // Funciones para editar y eliminar
  const handleEdit = (nota: NotaDebito) => {
    setEditingNota(nota);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (nota: NotaDebito, updates: { fecha: Date; tasaCambioPago: number }) => {
    setLoading(true);
    setError(null);

    try {
      // Aquí necesitamos obtener el ID de la nota de débito desde la base de datos
      // Por ahora, asumimos que tenemos acceso a él
      const { error: updateError } = await notaDebitoService.updateNotaDebito(
        nota.numero, // Esto debería ser el ID real
        updates
      );

      if (updateError) {
        setError('Error al actualizar: ' + updateError.message);
        return;
      }

      setSuccessMessage('Nota de débito actualizada exitosamente');
      setShowEditModal(false);
      setEditingNota(null);
      handleSearch(); // Recargar la lista
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Error al actualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (nota: NotaDebito) => {
    setLoading(true);
    setError(null);

    try {
      // Aquí necesitamos el ID real de la base de datos
      const { error: deleteError } = await notaDebitoService.deleteNotaDebito(nota.numero);

      if (deleteError) {
        setError('Error al eliminar: ' + deleteError.message);
        return;
      }

      setSuccessMessage('Nota de débito eliminada exitosamente');
      handleSearch(); // Recargar la lista
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError('Error al eliminar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (nota: NotaDebito) => {
    setViewingNota(nota);
    setShowDetailModal(true);
  };

  // Funciones existentes para crear nota de débito
  const handleFacturaSubmit = async (data: Factura) => {
    if (!user || !company) {
      setError('Usuario o compañía no encontrados');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existingFacturas } = await facturaService.getFacturasByCompany(company.id);
      
      if (existingFacturas?.some(f => f.numero === data.numero)) {
        setError(`Ya existe una factura con el número ${data.numero}`);
        return;
      }

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

    const nuevasNotas = [...notasCredito, data];
    const { excedeLimite, montoDisponibleUSD } = verificarLimiteNotasCredito(factura!, nuevasNotas);
    
    if (excedeLimite) {
      setLimitError(`La nota de crédito excede el monto disponible de la factura. Monto disponible: $${montoDisponibleUSD.toFixed(2)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existingNotas } = await notaCreditoService.getNotasCreditoByCompany(company.id);
      
      if (existingNotas?.some(nc => nc.numero === data.numero)) {
        setError(`Ya existe una nota de crédito con el número ${data.numero}`);
        return;
      }

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
      const numeroNotaDebito = await notaDebitoService.getNextNotaDebitoNumber(company.id);
      
      const notaDebitoCompleta = {
        ...data,
        numero: numeroNotaDebito,
      };

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
    <MainLayout>
      <div className="space-y-6">
        {/* Header con tabs */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">
            Notas de Débito por Diferencial Cambiario
          </h1>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 justify-center">
              <button
                onClick={() => setActiveTab('crear')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'crear'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crear Nueva
              </button>
              <button
                onClick={() => setActiveTab('consultar')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'consultar'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Consultar / Historial
              </button>
            </nav>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-500 hover:text-red-700"
            >
              Cerrar
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'crear' ? (
          <>
            {/* Loading Indicator */}
            {loading && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <p className="text-blue-600">Procesando...</p>
                </div>
              </div>
            )}

            {/* Step Indicator */}
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
              <div className="flex justify-start">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step === 'notaDebito' ? 'notasCredito' : 'factura')}
                  disabled={loading}
                >
                  Volver atrás
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Tab Consultar */
          <div className="space-y-6">
            {/* Filtros */}
            <NotasDebitoFilters
              filters={filters}
              onFilterChange={setFilters}
              onSearch={handleSearch}
              onClear={handleClearFilters}
              loading={searchLoading}
            />

            {/* Estadísticas con el nuevo componente */}
            <QuickSummary stats={stats} loading={searchLoading} />

            {/* Botón de exportar */}
            <div className="flex justify-end">
              <Button 
                variant="outline"
                onClick={handleExportExcel}
                disabled={notasDebitoList.length === 0 || exportingExcel}
              >
                {exportingExcel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Exportando...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Exportar a Excel
                  </>
                )}
              </Button>
            </div>

            {/* Tabla de notas de débito con paginación */}
            <Card>
              <NotasDebitoList
                notasDebito={paginatedNotasDebito}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={handleViewDetails}
                loading={searchLoading}
              />
              
              {/* Paginación */}
              {totalItems > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  showItemsPerPageSelector={true}
                />
              )}
            </Card>

            {/* Modales */}
            <NotaDebitoEditModal
              isOpen={showEditModal}
              notaDebito={editingNota}
              onClose={() => {
                setShowEditModal(false);
                setEditingNota(null);
              }}
              onSave={handleSaveEdit}
              loading={loading}
            />

            <NotaDebitoDetailModal
              isOpen={showDetailModal}
              notaDebito={viewingNota}
              onClose={() => {
                setShowDetailModal(false);
                setViewingNota(null);
              }}
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}