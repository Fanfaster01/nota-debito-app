'use client';

import React, { useState, useEffect } from 'react';
import { NotaDebito } from '@/types';
import { NotaDebitoGenerada } from '@/types/cuentasPorPagar';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { useAuth } from '@/contexts/AuthContext';
import { cuentasPorPagarService } from '@/lib/services/cuentasPorPagarService';
import { exportNotasDebitoToExcel } from '@/utils/exportExcel';
import { 
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Importar componentes específicos
import { NotasDebitoFilters } from '@/components/notas-debito/NotasDebitoFilters';
import { NotasDebitoList } from '@/components/notas-debito/NotasDebitoList';
import { NotaDebitoDetailModal } from '@/components/notas-debito/NotaDebitoDetailModal';
import { QuickSummary } from '@/components/notas-debito/QuickSummary';

interface NotasDebitoContentProps {
  embedded?: boolean // Para saber si está embebido en otro componente (reservado para uso futuro)
}

// Función para convertir NotaDebitoGenerada a NotaDebito para compatibilidad
function convertirNotaDebitoGeneradaANotaDebito(notaGenerada: NotaDebitoGenerada): NotaDebito {
  return {
    id: notaGenerada.id,
    numero: notaGenerada.numero,
    fecha: new Date(notaGenerada.fecha),
    factura: {
      numero: notaGenerada.factura?.numero || '',
      numeroControl: notaGenerada.factura?.numeroControl || '',
      fecha: new Date(notaGenerada.factura?.fecha || notaGenerada.fecha),
      proveedor: {
        nombre: notaGenerada.factura?.proveedorNombre || '',
        rif: notaGenerada.factura?.proveedorRif || '',
        direccion: notaGenerada.factura?.proveedorDireccion || ''
      },
      cliente: {
        nombre: notaGenerada.factura?.clienteNombre || '',
        rif: notaGenerada.factura?.clienteRif || '',
        direccion: notaGenerada.factura?.clienteDireccion || ''
      },
      subTotal: notaGenerada.factura?.subTotal || 0,
      montoExento: notaGenerada.factura?.montoExento || 0,
      baseImponible: notaGenerada.factura?.baseImponible || 0,
      alicuotaIVA: notaGenerada.factura?.alicuotaIVA || 16,
      iva: notaGenerada.factura?.iva || 0,
      total: notaGenerada.factura?.total || 0,
      tasaCambio: notaGenerada.tasaCambioOriginal,
      montoUSD: notaGenerada.montoUSDNeto,
      porcentajeRetencion: notaGenerada.factura?.porcentajeRetencion || 75,
      retencionIVA: notaGenerada.factura?.retencionIVA || 0
    },
    tasaCambioOriginal: notaGenerada.tasaCambioOriginal,
    tasaCambioPago: notaGenerada.tasaCambioPago,
    montoUSDNeto: notaGenerada.montoUSDNeto,
    diferencialCambiarioConIVA: notaGenerada.diferencialCambiarioConIVA,
    baseImponibleDiferencial: notaGenerada.baseImponibleDiferencial,
    ivaDiferencial: notaGenerada.ivaDiferencial,
    retencionIVADiferencial: notaGenerada.retencionIVADiferencial,
    montoNetoPagarNotaDebito: notaGenerada.montoNetoPagarNotaDebito,
    diferencial: notaGenerada.diferencialCambiarioConIVA // Para compatibilidad con QuickSummary
  };
}

export function NotasDebitoContent({ embedded = false }: NotasDebitoContentProps) {
  const { company } = useAuth();
  
  // Estados para consulta de notas de débito automáticas
  const [notasDebito, setNotasDebito] = useState<NotaDebitoGenerada[]>([]);
  const [cargandoNotas, setCargandoNotas] = useState<boolean>(false);
  const [totalNotasDebito, setTotalNotasDebito] = useState<number>(0);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    proveedor: '',
    numeroNota: '',
    numeroFactura: ''
  });
  
  // Estados para modales
  const [viewingNota, setViewingNota] = useState<NotaDebito | null>(null);
  
  // Estados de UI
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (company?.id) {
      cargarNotasDebito();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, paginaActual]);

  const cargarNotasDebito = async () => {
    if (!company?.id) return;
    
    setCargandoNotas(true);
    setError(null);
    
    try {
      const result = await cuentasPorPagarService.getNotasDebitoAutomaticas(
        company.id,
        filtros,
        paginaActual,
        10 // límite por página
      );
      
      if (result.success && result.data) {
        setNotasDebito(result.data.notasDebito);
        setTotalNotasDebito(result.data.total);
      } else {
        setError(result.error || 'Error al cargar las notas de débito');
        setNotasDebito([]);
        setTotalNotasDebito(0);
      }
    } catch (error) {
      console.error('Error cargando notas de débito:', error);
      setError('Error al cargar las notas de débito');
      setNotasDebito([]);
      setTotalNotasDebito(0);
    } finally {
      setCargandoNotas(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      proveedor: '',
      numeroNota: '',
      numeroFactura: ''
    });
    setPaginaActual(1);
  };

  const exportarExcel = async () => {
    if (!company?.id) return;
    
    try {
      // Obtener todas las notas de débito para exportar
      const result = await cuentasPorPagarService.getNotasDebitoAutomaticas(
        company.id,
        filtros,
        1,
        1000 // límite alto para obtener todas
      );
      
      if (result.success && result.data) {
        // Convertir a formato NotaDebito para exportación
        const notasParaExportar = result.data.notasDebito.map(convertirNotaDebitoGeneradaANotaDebito);
        exportNotasDebitoToExcel(notasParaExportar, 'notas-debito');
        setSuccessMessage('Excel exportado exitosamente');
      } else {
        setError('Error al exportar Excel');
      }
    } catch (error) {
      console.error('Error exportando Excel:', error);
      setError('Error al exportar Excel');
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Contenido de consulta */}
      <div className="space-y-6">
        {/* Resumen rápido */}
        <QuickSummary 
          stats={{
            totalNotas: totalNotasDebito,
            montoTotalDiferencial: notasDebito.reduce((sum, nota) => sum + nota.diferencialCambiarioConIVA, 0),
            montoTotalFinal: notasDebito.reduce((sum, nota) => sum + nota.montoNetoPagarNotaDebito, 0)
          }}
          loading={cargandoNotas}
        />

        {/* Filtros */}
        <Card>
          <div className="p-6">
            <NotasDebitoFilters
              filters={filtros}
              onFilterChange={(newFilters) => {
                // Convertir NotasDebitoFilters a formato esperado
                setFiltros({
                  fechaDesde: newFilters.fechaDesde || '',
                  fechaHasta: newFilters.fechaHasta || '',
                  proveedor: newFilters.proveedor || '',
                  numeroNota: newFilters.numeroNota || '',
                  numeroFactura: newFilters.numeroFactura || ''
                })
              }}
              onSearch={() => cargarNotasDebito()}
              onClear={limpiarFiltros}
              loading={cargandoNotas}
            />
          </div>
        </Card>

        {/* Acciones */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {totalNotasDebito > 0 && (
              <>Mostrando {notasDebito.length} de {totalNotasDebito} notas de débito</>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportarExcel}
              disabled={notasDebito.length === 0 || cargandoNotas}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Lista de notas de débito */}
        <Card>
          <NotasDebitoList
            notasDebito={notasDebito.map(convertirNotaDebitoGeneradaANotaDebito)}
            loading={cargandoNotas}
            onViewDetails={(nota) => setViewingNota(nota)}
            onEdit={() => {
              setError('La edición manual está deshabilitada. Las notas de débito se generan automáticamente desde Cuentas por Pagar.')
            }}
            onDelete={() => {
              setError('La eliminación manual está deshabilitada. Las notas de débito se generan automáticamente desde Cuentas por Pagar.')
            }}
          />
        </Card>

        {/* Paginación */}
        {totalNotasDebito > 10 && (
          <Pagination
            currentPage={paginaActual}
            totalPages={Math.ceil(totalNotasDebito / 10)}
            totalItems={totalNotasDebito}
            itemsPerPage={10}
            onPageChange={setPaginaActual}
          />
        )}
      </div>

      {/* Modal de detalle */}
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