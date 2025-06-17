// src/lib/services/proveedorCuentasBancariasService.ts
import { createClient } from '@/utils/supabase/client'
import { ProveedorCuentaBancaria } from '@/types/index'

export class ProveedorCuentasBancariasService {
  private supabase = createClient()

  // Obtener todas las cuentas bancarias de un proveedor
  async getCuentasByProveedorId(proveedorId: string): Promise<{ data: ProveedorCuentaBancaria[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .eq('activo', true)
        .order('es_favorita', { ascending: false })
        .order('created_at', { ascending: true })

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear una nueva cuenta bancaria para un proveedor
  async createCuentaBancaria(cuenta: Omit<ProveedorCuentaBancaria, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ProveedorCuentaBancaria | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .insert([cuenta])
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar una cuenta bancaria
  async updateCuentaBancaria(id: string, updates: Partial<ProveedorCuentaBancaria>): Promise<{ data: ProveedorCuentaBancaria | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Eliminar una cuenta bancaria (soft delete)
  async deleteCuentaBancaria(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .update({ activo: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Marcar una cuenta como favorita (y desmarcar las demás del mismo proveedor)
  async marcarComoFavorita(proveedorId: string, cuentaId: string): Promise<{ error: any }> {
    try {
      // Primero desmarcamos todas las cuentas del proveedor
      await this.supabase
        .from('proveedores_cuentas_bancarias')
        .update({ es_favorita: false, updated_at: new Date().toISOString() })
        .eq('proveedor_id', proveedorId)

      // Luego marcamos la cuenta específica como favorita
      const { error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .update({ es_favorita: true, updated_at: new Date().toISOString() })
        .eq('id', cuentaId)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Obtener la cuenta favorita de un proveedor
  async getCuentaFavorita(proveedorId: string): Promise<{ data: ProveedorCuentaBancaria | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .select('*')
        .eq('proveedor_id', proveedorId)
        .eq('es_favorita', true)
        .eq('activo', true)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear múltiples cuentas bancarias para un proveedor
  async createMultipleCuentas(cuentas: Omit<ProveedorCuentaBancaria, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ data: ProveedorCuentaBancaria[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .insert(cuentas)
        .select()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Verificar si ya existe una cuenta con el mismo número para un proveedor
  async checkCuentaExists(proveedorId: string, numeroCuenta: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .select('id')
        .eq('proveedor_id', proveedorId)
        .eq('numero_cuenta', numeroCuenta)
        .eq('activo', true)
        .single()

      return !error && data !== null
    } catch {
      return false
    }
  }
}

export const proveedorCuentasBancariasService = new ProveedorCuentasBancariasService()