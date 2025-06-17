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
import { useAuth } from '@/contexts/AuthContext';
import { facturaService, notaCreditoService, notaDebitoService } from '@/lib/services';
import { format } from 'date-fns';
import { exportNotasDebitoToExcel } from '@/utils/exportExcel';
import { 
  PlusIcon, 
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Importar componentes específicos
import { NotasDebitoFilters } from '@/components/notas-debito/NotasDebitoFilters';
import { NotasDebitoList } from '@/components/notas-debito/NotasDebitoList';
import { NotaDebitoEditModal } from '@/components/notas-debito/NotaDebitoEditModal';
import { NotaDebitoDetailModal } from '@/components/notas-debito/NotaDebitoDetailModal';
import { QuickSummary } from '@/components/notas-debito/QuickSummary';

interface NotasDebitoContentProps {
  embedded?: boolean // Para saber si está embebido en otro componente
}

export function NotasDebitoContent({ embedded = false }: NotasDebitoContentProps) {
  const { user, company } = useAuth();
  
  // Estados para crear nota de débito
  const [activeTab, setActiveTab] = useState<'crear' | 'consultar'>(embedded ? 'consultar' : 'crear');
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

  // Estados para la consulta
  const [notasDebito, setNotasDebito] = useState<NotaDebito[]>([]);
  const [totalNotasDebito, setTotalNotasDebito] = useState(0);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    proveedor: '',
    numeroNota: '',
    numeroFactura: ''
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargandoNotas, setCargandoNotas] = useState(false);

  // Estados para modales
  const [editingNota, setEditingNota] = useState<NotaDebito | null>(null);
  const [viewingNota, setViewingNota] = useState<NotaDebito | null>(null);

  // Verificar permisos
  if (!user || (user.role !== 'admin' && user.role !== 'master')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No tienes permisos para acceder a esta sección.
        </p>
      </div>
    );
  }

  // Cargar notas de débito para consulta
  useEffect(() => {
    if (activeTab === 'consultar' && company?.id) {
      cargarNotasDebito();
    }
  }, [activeTab, company?.id, filtros, paginaActual]);

  const cargarNotasDebito = async () => {
    if (!company?.id) return;

    setCargandoNotas(true);
    try {
      const result = await notaDebitoService.searchNotasDebitoForComponent(
        company.id,
        filtros,
        paginaActual,
        10
      );

      if (result.success && result.data) {
        setNotasDebito(result.data.notasDebito);
        setTotalNotasDebito(result.data.total);
      } else {
        setError(result.error || 'Error al cargar notas de débito');
      }
    } catch (err) {
      setError('Error al cargar notas de débito');
      console.error('Error cargando notas:', err);
    } finally {
      setCargandoNotas(false);
    }
  };

  const handleFacturaSubmit = async (nuevaFactura: Factura) => {
    if (!company?.id || !user?.id) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await facturaService.createFactura(nuevaFactura, company.id, user.id);
      
      if (result.success && result.data) {
        setFactura(result.data);
        setFacturaId(result.data.id);
        
        // Cargar notas de crédito existentes para esta factura
        const notasCreditoResult = await notaCreditoService.getNotasCreditoByFactura(result.data.id);
        if (notasCreditoResult.success && notasCreditoResult.data) {
          setNotasCredito(notasCreditoResult.data);
        }
        
        setStep('notasCredito');
      } else {
        setError(result.error || 'Error al crear la factura');
      }
    } catch (err) {
      setError('Error al procesar la factura');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotaCreditoSubmit = async (notaCredito: NotaCredito) => {
    if (!facturaId || !company?.id || !user?.id) return;

    setLoading(true);
    setError(null);
    setLimitError(null);

    try {
      // Verificar límite antes de crear
      const limitCheck = verificarLimiteNotasCredito(factura!, [...notasCredito, notaCredito]);
      if (!limitCheck.valido) {
        setLimitError(limitCheck.mensaje);
        setLoading(false);
        return;
      }

      const result = await notaCreditoService.createNotaCredito(notaCredito, facturaId, company.id, user.id);
      
      if (result.success && result.data) {
        setNotasCredito(prev => [...prev, result.data!]);
        setCurrentNotaCredito(result.data);
        setShowNotaCreditoForm(false);
        setSuccessMessage('Nota de crédito creada exitosamente');
      } else {
        setError(result.error || 'Error al crear la nota de crédito');
      }
    } catch (err) {
      setError('Error al procesar la nota de crédito');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const continueToNotaDebito = () => {
    if (!factura) return;

    const montoFinal = calcularMontoFinalPagar(factura, notasCredito);
    setMontoFinalPagar(montoFinal);
    setStep('notaDebito');
  };

  const handleNotaDebitoSubmit = async (notaDebitoData: NotaDebito) => {
    if (!company?.id || !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await notaDebitoService.createNotaDebito(
        notaDebitoData, 
        facturaId!, 
        notasCreditoIds, 
        company.id, 
        user.id
      );
      
      if (result.data) {
        // Convertir la respuesta de la base de datos al formato de la interfaz
        const notaDebitoCreada = {
          ...notaDebitoData,
          id: result.data.id,
          numero: result.data.numero
        };
        setNotaDebito(notaDebitoCreada);
        setStep('resultado');
        setSuccessMessage('Nota de débito creada exitosamente');
      } else {
        setError(result.error?.message || 'Error al crear la nota de débito');
      }
    } catch (err) {
      setError('Error al procesar la nota de débito');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('factura');
    setFactura(null);
    setFacturaId(null);
    setNotasCredito([]);
    setNotasCreditoIds([]);
    setNotaDebito(null);
    setMontoFinalPagar(0);
    setCurrentNotaCredito(null);
    setShowNotaCreditoForm(false);
    setLimitError(null);
    setError(null);
    setSuccessMessage(null);
  };

  const exportarExcel = async () => {
    if (!company?.id) return;

    try {
      await exportNotasDebitoToExcel(notasDebito, `notas-debito-${format(new Date(), 'yyyy-MM-dd')}`);
    } catch (err) {
      setError('Error al exportar a Excel');
      console.error('Error exportando:', err);
    }
  };

  // Encabezado condicional para cuando está embebido
  const HeaderComponent = embedded ? 'div' : 'div';

  return (
    <div className="space-y-6">
      {/* Header solo si no está embebido */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas de Débito</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestión de notas de débito por diferencial cambiario
          </p>
        </div>
      )}

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Tabs - solo mostrar si no está embebido */}
      {!embedded && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveTab('crear');
                resetForm();
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'crear'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PlusIcon className="h-5 w-5 inline mr-2" />
              Crear Nota de Débito
            </button>
            
            <button
              onClick={() => {
                setActiveTab('consultar');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'consultar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Consultar Notas
            </button>
          </nav>
        </div>
      )}

      {/* Contenido de los tabs */}
      {activeTab === 'crear' ? (
        <div className="space-y-6">
          {/* Progreso */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              {[
                { key: 'factura', label: 'Factura', step: 1 },
                { key: 'notasCredito', label: 'Notas de Crédito', step: 2 },
                { key: 'notaDebito', label: 'Nota de Débito', step: 3 },
                { key: 'resultado', label: 'Resultado', step: 4 }
              ].map((item, index) => (
                <div key={item.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    step === item.key
                      ? 'bg-blue-600 text-white'
                      : index < (['factura', 'notasCredito', 'notaDebito', 'resultado'].indexOf(step))
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {item.step}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step === item.key ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-16 h-1 mx-4 ${
                      index < (['factura', 'notasCredito', 'notaDebito', 'resultado'].indexOf(step))
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Formularios según el paso */}
          {step === 'factura' && (
            <Card title="Información de la Factura">
              <FacturaForm 
                onSubmit={handleFacturaSubmit}
                loading={loading}
              />
            </Card>
          )}

          {step === 'notasCredito' && factura && (
            <div className="space-y-6">
              <Card title="Notas de Crédito (Opcional)">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-700">
                      Las notas de crédito son opcionales. Puede continuar sin agregar ninguna o agregar las que necesite.
                    </p>
                  </div>

                  {limitError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-sm text-red-700">{limitError}</p>
                    </div>
                  )}

                  {/* Lista de notas de crédito */}
                  {notasCredito.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">Notas de Crédito Agregadas:</h4>
                      {notasCredito.map((nota, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium">{nota.numero}</p>
                            <p className="text-xs text-gray-500">Total: Bs. {nota.total.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario para nueva nota de crédito */}
                  {showNotaCreditoForm ? (
                    <NotaCreditoForm
                      factura={factura}
                      onSubmit={handleNotaCreditoSubmit}
                      onCancel={() => setShowNotaCreditoForm(false)}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => setShowNotaCreditoForm(true)}
                        variant="outline"
                        className="inline-flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Agregar Nota de Crédito
                      </Button>
                      
                      <Button
                        onClick={continueToNotaDebito}
                        className="inline-flex items-center"
                      >
                        Continuar
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {step === 'notaDebito' && factura && (
            <Card title="Generar Nota de Débito">
              <NotaDebitoForm
                factura={factura}
                notasCredito={notasCredito}
                montoFinalPagar={montoFinalPagar}
                onSubmit={handleNotaDebitoSubmit}
                loading={loading}
              />
            </Card>
          )}

          {step === 'resultado' && notaDebito && (
            <div className="space-y-6">
              <Card title="Nota de Débito Generada">
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <p className="text-sm text-green-700">
                      ¡Nota de débito generada exitosamente!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Información:</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Número:</span> {notaDebito.numero}</p>
                        <p><span className="font-medium">Fecha:</span> {format(new Date(notaDebito.fecha), 'dd/MM/yyyy')}</p>
                        <p><span className="font-medium">Monto:</span> Bs. {notaDebito.montoNetoPagarNotaDebito.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <NotaDebitoPDFDownloadLink notaDebito={notaDebito} />
                      <Button
                        onClick={resetForm}
                        variant="outline"
                        className="w-full"
                      >
                        Crear Nueva Nota
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Vista previa del PDF */}
              <Card title="Vista Previa">
                <NotaDebitoPDFViewer notaDebito={notaDebito} />
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* Tab de consulta */
        <div className="space-y-6">
          {/* Resumen rápido */}
          <QuickSummary 
            stats={{
              totalNotas: notasDebito.length,
              montoTotalDiferencial: notasDebito.reduce((sum, nota) => sum + (nota.diferencial || 0), 0),
              montoTotalFinal: notasDebito.reduce((sum, nota) => sum + nota.montoNetoPagarNotaDebito, 0)
            }}
            loading={cargandoNotas}
          />

          {/* Filtros */}
          <Card>
            <div className="p-6">
              <NotasDebitoFilters
                filters={filtros}
                onFilterChange={setFiltros}
                onSearch={() => cargarNotasDebito()}
                onClear={() => {
                  setFiltros({
                    fechaDesde: '',
                    fechaHasta: '',
                    proveedor: '',
                    numeroNota: '',
                    numeroFactura: ''
                  });
                  setPaginaActual(1);
                }}
                loading={cargandoNotas}
              />
            </div>
          </Card>

          {/* Acciones */}
          <div className="flex justify-end">
            <Button
              onClick={exportarExcel}
              variant="outline"
              disabled={notasDebito.length === 0}
              className="inline-flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>

          {/* Lista de notas de débito */}
          <NotasDebitoList
            notasDebito={notasDebito}
            loading={cargandoNotas}
            onEdit={setEditingNota}
            onViewDetails={setViewingNota}
            onDelete={async (nota) => {
              if (company?.id && nota.id) {
                const result = await notaDebitoService.deleteNotaDebitoForComponent(nota.id, company.id);
                if (result.success) {
                  cargarNotasDebito();
                  setSuccessMessage('Nota de débito eliminada exitosamente');
                } else {
                  setError(result.error || 'Error al eliminar nota de débito');
                }
              }
            }}
          />

          {/* Paginación */}
          {totalNotasDebito > 10 && (
            <Pagination
              currentPage={paginaActual}
              totalPages={Math.ceil(totalNotasDebito / 10)}
              onPageChange={setPaginaActual}
            />
          )}
        </div>
      )}

      {/* Modales */}
      {editingNota && (
        <NotaDebitoEditModal
          notaDebito={editingNota}
          isOpen={true}
          onClose={() => setEditingNota(null)}
          onSave={async (notaDebito, updates) => {
            if (company?.id && notaDebito.id) {
              // Crear nota actualizada con los cambios
              const updatedNota = {
                ...notaDebito,
                fecha: updates.fecha,
                tasaCambioPago: updates.tasaCambioPago
              };
              const result = await notaDebitoService.updateNotaDebitoForComponent(notaDebito.id, updatedNota, company.id);
              if (result.success) {
                cargarNotasDebito();
                setEditingNota(null);
                setSuccessMessage('Nota de débito actualizada exitosamente');
              } else {
                setError(result.error || 'Error al actualizar nota de débito');
              }
            }
          }}
        />
      )}

      {viewingNota && (
        <NotaDebitoDetailModal
          notaDebito={viewingNota}
          isOpen={true}
          onClose={() => setViewingNota(null)}
        />
      )}
    </div>
  );
}