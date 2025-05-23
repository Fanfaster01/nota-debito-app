// src/services/dataService.ts
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';
import { Factura, NotaCredito, NotaDebito } from '@/types';

type FacturaDB = Database['public']['Tables']['facturas']['Row'];
type NotaCreditoDB = Database['public']['Tables']['notas_credito']['Row'];
type NotaDebitoDB = Database['public']['Tables']['notas_debito']['Row'];
type FacturaInsert = Database['public']['Tables']['facturas']['Insert'];
type NotaCreditoInsert = Database['public']['Tables']['notas_credito']['Insert'];
type NotaDebitoInsert = Database['public']['Tables']['notas_debito']['Insert'];

// Obtener cliente de Supabase
const getSupabaseClient = () => createClient();

// Conversión de tipos de la aplicación a la base de datos
export const convertFacturaToDb = (factura: Factura, companyId: string, userId: string): FacturaInsert => ({
  numero: factura.numero,
  numero_control: factura.numeroControl,
  fecha: factura.fecha.toISOString().split('T')[0],
  proveedor_nombre: factura.proveedor.nombre,
  proveedor_rif: factura.proveedor.rif,
  proveedor_direccion: factura.proveedor.direccion,
  cliente_nombre: factura.cliente.nombre,
  cliente_rif: factura.cliente.rif,
  cliente_direccion: factura.cliente.direccion,
  sub_total: factura.subTotal,
  monto_exento: factura.montoExento,
  base_imponible: factura.baseImponible,
  alicuota_iva: factura.alicuotaIVA,
  iva: factura.iva,
  total: factura.total,
  tasa_cambio: factura.tasaCambio,
  monto_usd: factura.montoUSD,
  porcentaje_retencion: factura.porcentajeRetencion,
  retencion_iva: factura.retencionIVA,
  company_id: companyId,
  created_by: userId,
});

export const convertFacturaFromDb = (facturaDb: FacturaDB): Factura => ({
  numero: facturaDb.numero,
  numeroControl: facturaDb.numero_control,
  fecha: new Date(facturaDb.fecha),
  proveedor: {
    nombre: facturaDb.proveedor_nombre,
    rif: facturaDb.proveedor_rif,
    direccion: facturaDb.proveedor_direccion,
  },
  cliente: {
    nombre: facturaDb.cliente_nombre,
    rif: facturaDb.cliente_rif,
    direccion: facturaDb.cliente_direccion,
  },
  subTotal: facturaDb.sub_total,
  montoExento: facturaDb.monto_exento,
  baseImponible: facturaDb.base_imponible,
  alicuotaIVA: facturaDb.alicuota_iva,
  iva: facturaDb.iva,
  total: facturaDb.total,
  tasaCambio: facturaDb.tasa_cambio,
  montoUSD: facturaDb.monto_usd,
  porcentajeRetencion: facturaDb.porcentaje_retencion,
  retencionIVA: facturaDb.retencion_iva,
});

export const convertNotaCreditoToDb = (notaCredito: NotaCredito, facturaId: string, companyId: string, userId: string): NotaCreditoInsert => ({
  numero: notaCredito.numero,
  numero_control: notaCredito.numeroControl,
  fecha: notaCredito.fecha.toISOString().split('T')[0],
  factura_afectada: notaCredito.facturaAfectada,
  sub_total: notaCredito.subTotal,
  monto_exento: notaCredito.montoExento,
  base_imponible: notaCredito.baseImponible,
  alicuota_iva: notaCredito.alicuotaIVA,
  iva: notaCredito.iva,
  total: notaCredito.total,
  tasa_cambio: notaCredito.tasaCambio,
  monto_usd: notaCredito.montoUSD,
  porcentaje_retencion: notaCredito.porcentajeRetencion,
  retencion_iva: notaCredito.retencionIVA,
  factura_id: facturaId,
  company_id: companyId,
  created_by: userId,
});

export const convertNotaCreditoFromDb = (notaCreditoDb: NotaCreditoDB): NotaCredito => ({
  numero: notaCreditoDb.numero,
  numeroControl: notaCreditoDb.numero_control,
  fecha: new Date(notaCreditoDb.fecha),
  facturaAfectada: notaCreditoDb.factura_afectada,
  subTotal: notaCreditoDb.sub_total,
  montoExento: notaCreditoDb.monto_exento,
  baseImponible: notaCreditoDb.base_imponible,
  alicuotaIVA: notaCreditoDb.alicuota_iva,
  iva: notaCreditoDb.iva,
  total: notaCreditoDb.total,
  tasaCambio: notaCreditoDb.tasa_cambio,
  montoUSD: notaCreditoDb.monto_usd,
  porcentajeRetencion: notaCreditoDb.porcentaje_retencion,
  retencionIVA: notaCreditoDb.retencion_iva,
});

// Servicio para facturas
export const facturaService = {
  async getAll(companyId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(convertFacturaFromDb) || [];
  },

  async getById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? convertFacturaFromDb(data) : null;
  },

  async create(factura: Factura, companyId: string, userId: string) {
    const supabase = getSupabaseClient();
    const facturaDb = convertFacturaToDb(factura, companyId, userId);
    
    const { data, error } = await supabase
      .from('facturas')
      .insert(facturaDb)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, factura: Partial<Factura>) {
    const supabase = getSupabaseClient();
    // Convertir solo los campos que se van a actualizar
    const updateData: any = {};
    
    if (factura.numero) updateData.numero = factura.numero;
    if (factura.numeroControl) updateData.numero_control = factura.numeroControl;
    if (factura.fecha) updateData.fecha = factura.fecha.toISOString().split('T')[0];
    // ... agregar más campos según sea necesario

    const { data, error } = await supabase
      .from('facturas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('facturas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByNumero(numero: string, companyId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('facturas')
      .select('*')
      .eq('numero', numero)
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? convertFacturaFromDb(data) : null;
  },
};

// Servicio para notas de crédito
export const notaCreditoService = {
  async getByFacturaId(facturaId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notas_credito')
      .select('*')
      .eq('factura_id', facturaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map(convertNotaCreditoFromDb) || [];
  },

  async create(notaCredito: NotaCredito, facturaId: string, companyId: string, userId: string) {
    const supabase = getSupabaseClient();
    const notaCreditoDb = convertNotaCreditoToDb(notaCredito, facturaId, companyId, userId);
    
    const { data, error } = await supabase
      .from('notas_credito')
      .insert(notaCreditoDb)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notas_credito')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Servicio para notas de débito
export const notaDebitoService = {
  async getAll(companyId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notas_debito')
      .select(`
        *,
        facturas (
          numero,
          proveedor_nombre,
          cliente_nombre,
          total,
          tasa_cambio
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('notas_debito')
      .select(`
        *,
        facturas (*),
        nota_debito_notas_credito (
          notas_credito (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) return null;

    // Reconstruir el objeto NotaDebito
    const factura = convertFacturaFromDb(data.facturas);
    const notasCredito = data.nota_debito_notas_credito?.map((rel: any) => 
      convertNotaCreditoFromDb(rel.notas_credito)
    ) || [];

    const notaDebito: NotaDebito = {
      numero: data.numero,
      fecha: new Date(data.fecha),
      factura,
      notasCredito: notasCredito.length > 0 ? notasCredito : undefined,
      tasaCambioOriginal: data.tasa_cambio_original,
      tasaCambioPago: data.tasa_cambio_pago,
      montoUSDNeto: data.monto_usd_neto,
      diferencialCambiarioConIVA: data.diferencial_cambiario_con_iva,
      baseImponibleDiferencial: data.base_imponible_diferencial,
      ivaDiferencial: data.iva_diferencial,
      retencionIVADiferencial: data.retencion_iva_diferencial,
      montoNetoPagarNotaDebito: data.monto_neto_pagar_nota_debito,
    };

    return notaDebito;
  },

  async create(notaDebito: NotaDebito, facturaId: string, notasCreditoIds: string[], companyId: string, userId: string) {
    const supabase = getSupabaseClient();
    
    // Insertar la nota de débito
    const notaDebitoDb: NotaDebitoInsert = {
      numero: notaDebito.numero,
      fecha: notaDebito.fecha.toISOString().split('T')[0],
      factura_id: facturaId,
      tasa_cambio_original: notaDebito.tasaCambioOriginal,
      tasa_cambio_pago: notaDebito.tasaCambioPago,
      monto_usd_neto: notaDebito.montoUSDNeto,
      diferencial_cambiario_con_iva: notaDebito.diferencialCambiarioConIVA,
      base_imponible_diferencial: notaDebito.baseImponibleDiferencial,
      iva_diferencial: notaDebito.ivaDiferencial,
      retencion_iva_diferencial: notaDebito.retencionIVADiferencial,
      monto_neto_pagar_nota_debito: notaDebito.montoNetoPagarNotaDebito,
      monto_final_pagar: 0, // Se calculará después
      company_id: companyId,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('notas_debito')
      .insert(notaDebitoDb)
      .select()
      .single();

    if (error) throw error;

    // Insertar las relaciones con notas de crédito
    if (notasCreditoIds.length > 0) {
      const relations = notasCreditoIds.map(notaCreditoId => ({
        nota_debito_id: data.id,
        nota_credito_id: notaCreditoId,
      }));

      const { error: relError } = await supabase
        .from('nota_debito_notas_credito')
        .insert(relations);

      if (relError) throw relError;
    }

    return data;
  },

  async delete(id: string) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('notas_debito')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Servicio para usuarios (solo para usuarios master)
export const userService = {
  async getAll() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        companies (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'admin' | 'user';
    company_id: string;
    permissions?: string[];
  }) {
    const supabase = getSupabaseClient();
    
    // Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Crear perfil en la tabla users
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        company_id: userData.company_id,
        permissions: userData.permissions || [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, userData: Partial<{
    full_name: string;
    role: 'admin' | 'user';
    company_id: string;
    permissions: string[];
    is_active: boolean;
  }>) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const supabase = getSupabaseClient();
    // Desactivar usuario en lugar de eliminarlo
    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },
};