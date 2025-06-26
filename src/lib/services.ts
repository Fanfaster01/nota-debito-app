// src/lib/services.ts
import { createClient } from '@/utils/supabase/client'
import { Factura, NotaCredito, NotaDebito } from '@/types'
import { FacturaDB, NotaCreditoDB, NotaDebitoDB, User } from '@/types/database'
import { 
  mapFacturaToDB, 
  mapFacturaFromDB,
  mapNotaCreditoToDB,
  mapNotaCreditoFromDB,
  mapNotaDebitoToDB,
  mapNotaDebitoFromDB
} from './mappers'
import { calcularNotaDebito, calcularMontoFinalPagar } from './calculations'

// Servicio para gestionar facturas
export class FacturaService {
  private supabase = createClient()

  async createFactura(factura: Factura, companyId: string, userId: string): Promise<{ data: FacturaDB | null, error: any }> {
    try {
      const facturaDB = mapFacturaToDB(factura, companyId, userId)
      
      const { data, error } = await this.supabase
        .from('facturas')
        .insert(facturaDB)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getFacturasByCompany(companyId: string): Promise<{ data: Factura[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('facturas')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) return { data: null, error }

      const facturas = data?.map(mapFacturaFromDB) || []
      return { data: facturas, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getFacturaById(id: string): Promise<{ data: FacturaDB | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('facturas')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateFactura(id: string, factura: Partial<Factura>): Promise<{ data: FacturaDB | null, error: any }> {
    try {
      // Note: Aquí podrías implementar un mapper parcial si necesitas actualizar facturas
      const { data, error } = await this.supabase
        .from('facturas')
        .update({ /* mapped fields */ })
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteFactura(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('facturas')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

// Servicio para gestionar notas de crédito
export class NotaCreditoService {
  private supabase = createClient()

  async createNotaCredito(
    notaCredito: NotaCredito, 
    facturaId: string,
    companyId: string, 
    userId: string
  ): Promise<{ data: NotaCreditoDB | null, error: any }> {
    try {
      const notaCreditoDB = mapNotaCreditoToDB(notaCredito, facturaId, companyId, userId)
      
      const { data, error } = await this.supabase
        .from('notas_credito')
        .insert(notaCreditoDB)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getNotasCreditoByFactura(facturaId: string): Promise<{ data: NotaCredito[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('notas_credito')
        .select('*')
        .eq('factura_id', facturaId)
        .order('created_at', { ascending: false })

      if (error) return { data: null, error }

      const notasCredito = data?.map(mapNotaCreditoFromDB) || []
      return { data: notasCredito, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getNotasCreditoByCompany(companyId: string): Promise<{ data: NotaCredito[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('notas_credito')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) return { data: null, error }

      const notasCredito = data?.map(mapNotaCreditoFromDB) || []
      return { data: notasCredito, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteNotaCredito(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('notas_credito')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

// Servicio para gestionar notas de débito
export class NotaDebitoService {
  private supabase = createClient()

  async getNextNotaDebitoNumber(companyId: string): Promise<string> {
    try {
      // Obtener el año y mes actual
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const prefix = `${year}${month}`;
      
      // Buscar la última nota de débito de este mes para esta compañía
      const { data, error } = await this.supabase
        .from('notas_debito')
        .select('numero')
        .eq('company_id', companyId)
        .like('numero', `${prefix}-%`)
        .order('numero', { ascending: false })
        .limit(1)
        .single();
      
      let nextNumber = 1;
      
      if (!error && data) {
        // Extraer el número secuencial de la última nota
        const parts = data.numero.split('-');
        if (parts.length > 1) {
          const lastNumber = parseInt(parts[1], 10);
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1;
          }
        }
      }
      
      // Formato: YYYYMM-XXXXXX
      return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      // Si hay error, generar un número único basado en timestamp
      const fecha = new Date();
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `${year}${month}${day}-${random}`;
    }
  }

  /**
   * @deprecated Manual creation is deprecated. Use automatic generation through cuentasPorPagarService.
   */
  async createNotaDebito(
    notaDebito: NotaDebito,
    facturaId: string,
    notasCreditoIds: string[],
    companyId: string,
    userId: string
  ): Promise<{ data: NotaDebitoDB | null, error: any }> {
    try {
      const notaDebitoDB = mapNotaDebitoToDB(notaDebito, facturaId, companyId, userId)
      
      // Crear la nota de débito
      const { data: notaDebitoCreated, error: notaDebitoError } = await this.supabase
        .from('notas_debito')
        .insert(notaDebitoDB)
        .select()
        .single()

      if (notaDebitoError) return { data: null, error: notaDebitoError }

      // Crear las relaciones con las notas de crédito
      if (notasCreditoIds.length > 0) {
        const relaciones = notasCreditoIds.map(notaCreditoId => ({
          nota_debito_id: notaDebitoCreated.id,
          nota_credito_id: notaCreditoId
        }))

        const { error: relacionesError } = await this.supabase
          .from('nota_debito_notas_credito')
          .insert(relaciones)

        if (relacionesError) {
          // Si hay error en las relaciones, eliminar la nota de débito creada
          await this.supabase.from('notas_debito').delete().eq('id', notaDebitoCreated.id)
          return { data: null, error: relacionesError }
        }
      }

      return { data: notaDebitoCreated, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getNotasDebitoByCompany(companyId: string): Promise<{ data: NotaDebito[] | null, error: any }> {
    try {
      // Obtener notas de débito con sus facturas relacionadas
      const { data, error } = await this.supabase
        .from('notas_debito')
        .select(`
          *,
          facturas (*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) return { data: null, error }

      if (!data) return { data: [], error: null }

      // Para cada nota de débito, obtener las notas de crédito relacionadas
      const notasDebitoCompletas = await Promise.all(
        data.map(async (notaDebitoDB) => {
          // Obtener IDs de las notas de crédito relacionadas
          const { data: relaciones } = await this.supabase
            .from('nota_debito_notas_credito')
            .select('nota_credito_id')
            .eq('nota_debito_id', notaDebitoDB.id)

          let notasCredito: NotaCredito[] = []

          if (relaciones && relaciones.length > 0) {
            const notasCreditoIds = relaciones.map(r => r.nota_credito_id)
            
            const { data: notasCreditoDB } = await this.supabase
              .from('notas_credito')
              .select('*')
              .in('id', notasCreditoIds)

            if (notasCreditoDB) {
              notasCredito = notasCreditoDB.map(mapNotaCreditoFromDB)
            }
          }

          const factura = mapFacturaFromDB(notaDebitoDB.facturas)
          return mapNotaDebitoFromDB(notaDebitoDB, factura, notasCredito)
        })
      )

      return { data: notasDebitoCompletas, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async getNotaDebitoById(id: string): Promise<{ data: NotaDebito | null, error: any }> {
    try {
      // Obtener nota de débito con factura
      const { data: notaDebitoDB, error: notaDebitoError } = await this.supabase
        .from('notas_debito')
        .select(`
          *,
          facturas (*)
        `)
        .eq('id', id)
        .single()

      if (notaDebitoError) return { data: null, error: notaDebitoError }

      // Obtener notas de crédito relacionadas
      const { data: relaciones } = await this.supabase
        .from('nota_debito_notas_credito')
        .select('nota_credito_id')
        .eq('nota_debito_id', id)

      let notasCredito: NotaCredito[] = []

      if (relaciones && relaciones.length > 0) {
        const notasCreditoIds = relaciones.map(r => r.nota_credito_id)
        
        const { data: notasCreditoDB } = await this.supabase
          .from('notas_credito')
          .select('*')
          .in('id', notasCreditoIds)

        if (notasCreditoDB) {
          notasCredito = notasCreditoDB.map(mapNotaCreditoFromDB)
        }
      }

      const factura = mapFacturaFromDB(notaDebitoDB.facturas)
      const notaDebito = mapNotaDebitoFromDB(notaDebitoDB, factura, notasCredito)

      return { data: notaDebito, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  async deleteNotaDebito(id: string): Promise<{ error: any }> {
    try {
      // Primero eliminar las relaciones
      await this.supabase
        .from('nota_debito_notas_credito')
        .delete()
        .eq('nota_debito_id', id)

      // Luego eliminar la nota de débito
      const { error } = await this.supabase
        .from('notas_debito')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Buscar notas de débito con filtros
  async searchNotasDebito(
    companyId: string,
    filters?: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      proveedorId?: string;
      numeroNota?: string;
      numeroFactura?: string;
    }
  ): Promise<{ data: NotaDebito[] | null, error: any }> {
    try {
      let query = this.supabase
        .from('notas_debito')
        .select(`
          *,
          facturas!inner (
            *,
            proveedor_nombre,
            proveedor_rif
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      // Aplicar filtros si existen
      if (filters?.fechaDesde) {
        query = query.gte('fecha', filters.fechaDesde.toISOString().split('T')[0]);
      }
      
      if (filters?.fechaHasta) {
        query = query.lte('fecha', filters.fechaHasta.toISOString().split('T')[0]);
      }
      
      if (filters?.numeroNota) {
        query = query.ilike('numero', `%${filters.numeroNota}%`);
      }
      
      if (filters?.numeroFactura) {
        query = query.ilike('facturas.numero', `%${filters.numeroFactura}%`);
      }

      const { data, error } = await query;

      if (error) return { data: null, error };
      if (!data) return { data: [], error: null };

      // Si hay filtro de proveedor, filtrar en memoria después de obtener los datos
      let filteredData = data;
      if (filters?.proveedorId) {
        filteredData = data.filter(nd => 
          nd.facturas.proveedor_nombre.toLowerCase().includes(filters.proveedorId!.toLowerCase()) ||
          nd.facturas.proveedor_rif.toLowerCase().includes(filters.proveedorId!.toLowerCase())
        );
      }

      // Mapear los datos completos
      const notasDebitoCompletas = await Promise.all(
        filteredData.map(async (notaDebitoDB) => {
          // Obtener notas de crédito relacionadas
          const { data: relaciones } = await this.supabase
            .from('nota_debito_notas_credito')
            .select('nota_credito_id')
            .eq('nota_debito_id', notaDebitoDB.id);

          let notasCredito: NotaCredito[] = [];

          if (relaciones && relaciones.length > 0) {
            const notasCreditoIds = relaciones.map(r => r.nota_credito_id);
            
            const { data: notasCreditoDB } = await this.supabase
              .from('notas_credito')
              .select('*')
              .in('id', notasCreditoIds);

            if (notasCreditoDB) {
              notasCredito = notasCreditoDB.map(mapNotaCreditoFromDB);
            }
          }

          const factura = mapFacturaFromDB(notaDebitoDB.facturas);
          return mapNotaDebitoFromDB(notaDebitoDB, factura, notasCredito);
        })
      );

      return { data: notasDebitoCompletas, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Actualizar nota de débito
  async updateNotaDebito(
    id: string,
    updates: {
      fecha?: Date;
      tasaCambioPago?: number;
    }
  ): Promise<{ data: NotaDebitoDB | null, error: any }> {
    try {
      // Si se actualiza la tasa de cambio, recalcular todos los montos
      if (updates.tasaCambioPago) {
        // Primero obtener la nota de débito actual con su factura
        const { data: notaDebitoActual, error: fetchError } = await this.getNotaDebitoById(id);
        
        if (fetchError || !notaDebitoActual) {
          return { data: null, error: fetchError || new Error('Nota de débito no encontrada') };
        }

        // Recalcular con la nueva tasa
        const notaDebitoRecalculada = calcularNotaDebito(
          notaDebitoActual.factura,
          notaDebitoActual.notasCredito || [],
          updates.tasaCambioPago
        );

        // Calcular monto final
        const montoFinalPagar = calcularMontoFinalPagar(
          notaDebitoActual.factura,
          notaDebitoActual.notasCredito || [],
          notaDebitoRecalculada
        );

        // Actualizar con todos los valores recalculados
        const { data, error } = await this.supabase
          .from('notas_debito')
          .update({
            fecha: updates.fecha?.toISOString().split('T')[0] || notaDebitoActual.fecha,
            tasa_cambio_pago: updates.tasaCambioPago,
            monto_usd_neto: notaDebitoRecalculada.montoUSDNeto,
            diferencial_cambiario_con_iva: notaDebitoRecalculada.diferencialCambiarioConIVA,
            base_imponible_diferencial: notaDebitoRecalculada.baseImponibleDiferencial,
            iva_diferencial: notaDebitoRecalculada.ivaDiferencial,
            retencion_iva_diferencial: notaDebitoRecalculada.retencionIVADiferencial,
            monto_neto_pagar_nota_debito: notaDebitoRecalculada.montoNetoPagarNotaDebito,
            monto_final_pagar: montoFinalPagar
          })
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      } else {
        // Solo actualizar fecha
        const { data, error } = await this.supabase
          .from('notas_debito')
          .update({
            fecha: updates.fecha?.toISOString().split('T')[0]
          })
          .eq('id', id)
          .select()
          .single();

        return { data, error };
      }
    } catch (error) {
      return { data: null, error };
    }
  }

  // Obtener estadísticas de notas de débito
  async getNotasDebitoStats(
    companyId: string,
    filters?: {
      fechaDesde?: Date;
      fechaHasta?: Date;
    }
  ): Promise<{ 
    data: {
      totalNotas: number;
      montoTotalDiferencial: number;
      montoTotalFinal: number;
    } | null, 
    error: any 
  }> {
    try {
      let query = this.supabase
        .from('notas_debito')
        .select('diferencial_cambiario_con_iva, monto_final_pagar')
        .eq('company_id', companyId);

      if (filters?.fechaDesde) {
        query = query.gte('fecha', filters.fechaDesde.toISOString().split('T')[0]);
      }
      
      if (filters?.fechaHasta) {
        query = query.lte('fecha', filters.fechaHasta.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) return { data: null, error };

      const stats = {
        totalNotas: data?.length || 0,
        montoTotalDiferencial: data?.reduce((sum, nd) => sum + nd.diferencial_cambiario_con_iva, 0) || 0,
        montoTotalFinal: data?.reduce((sum, nd) => sum + nd.monto_final_pagar, 0) || 0
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  // Método específico para el componente NotasDebitoContent
  async searchNotasDebitoForComponent(
    companyId: string,
    filters: {
      fechaDesde?: string;
      fechaHasta?: string;
      proveedor?: string;
      numeroNota?: string;
      numeroFactura?: string;
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{ 
    success: boolean;
    data?: {
      notasDebito: NotaDebito[];
      total: number;
    };
    error?: string;
  }> {
    try {
      // Convertir filtros de string a Date si es necesario
      const searchFilters: {
        fechaDesde?: Date;
        fechaHasta?: Date;
        proveedorId?: string;
        numeroNota?: string;
        numeroFactura?: string;
      } = {};

      if (filters.fechaDesde) {
        searchFilters.fechaDesde = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        searchFilters.fechaHasta = new Date(filters.fechaHasta);
      }
      if (filters.proveedor) {
        searchFilters.proveedorId = filters.proveedor;
      }
      if (filters.numeroNota) {
        searchFilters.numeroNota = filters.numeroNota;
      }
      if (filters.numeroFactura) {
        searchFilters.numeroFactura = filters.numeroFactura;
      }

      // Buscar notas de débito
      const { data: notasDebito, error } = await this.searchNotasDebito(companyId, searchFilters);
      
      if (error) {
        return { success: false, error: error.message || 'Error al buscar notas de débito' };
      }

      if (!notasDebito) {
        return { success: true, data: { notasDebito: [], total: 0 } };
      }

      // Mapear los datos para incluir el campo 'diferencial' para compatibilidad
      const notasDebitoMapped = notasDebito.map(nota => ({
        ...nota,
        diferencial: nota.diferencialCambiarioConIVA
      }));

      // Aplicar paginación
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotas = notasDebitoMapped.slice(startIndex, endIndex);

      return {
        success: true,
        data: {
          notasDebito: paginatedNotas,
          total: notasDebitoMapped.length
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Método para actualizar nota de débito con formato esperado por el componente
  async updateNotaDebitoForComponent(
    id: string,
    notaDebito: NotaDebito,
    companyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.updateNotaDebito(id, {
        fecha: notaDebito.fecha,
        tasaCambioPago: notaDebito.tasaCambioPago
      });

      if (error) {
        return { success: false, error: error.message || 'Error al actualizar nota de débito' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Método para eliminar nota de débito con formato esperado por el componente
  async deleteNotaDebitoForComponent(
    id: string,
    companyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.deleteNotaDebito(id);

      if (error) {
        return { success: false, error: error.message || 'Error al eliminar nota de débito' };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

// Servicio para gestionar usuarios y compañías
export class UserService {
  private supabase = createClient()

  async getCurrentUser(): Promise<{ data: User | null, error: any }> {
    try {
      const { data: authUser, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !authUser.user) {
        return { data: null, error: authError }
      }

      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single()

      return { data: userData, error: userError }
    } catch (error) {
      return { data: null, error }
    }
  }

  async updateUserProfile(updates: Partial<User>): Promise<{ data: User | null, error: any }> {
    try {
      const { data: authUser } = await this.supabase.auth.getUser()
      
      if (!authUser.user) {
        return { data: null, error: new Error('No authenticated user') }
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', authUser.user.id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }
}

// Instancias de los servicios para exportar
export const facturaService = new FacturaService()
export const notaCreditoService = new NotaCreditoService()
export const notaDebitoService = new NotaDebitoService()
export const userService = new UserService()