// src/lib/services/bancoService.ts
import { createClient } from '@/utils/supabase/client'
import { Banco, TablesInsert } from '@/types/database'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export class BancoService {
  private supabase = createClient()

  // Obtener todos los bancos activos
  async getAllBancos(): Promise<{ data: Banco[] | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      return { data, error }
    } catch (err) {
      console.error('Error getting all bancos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener todos los bancos') }
    }
  }

  // Obtener lista simplificada de bancos
  async getBancos(): Promise<{ data: Array<{ id: string; nombre: string; codigo: string }> | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('id, nombre, codigo')
        .eq('is_active', true)
        .order('codigo')

      return { data, error }
    } catch (err) {
      console.error('Error getting bancos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener lista de bancos') }
    }
  }

  // Buscar banco por código
  async getBancoByCodigo(codigo: string): Promise<{ data: Banco | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('*')
        .eq('codigo', codigo)
        .eq('is_active', true)
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error getting banco by codigo:', err)
      return { data: null, error: handleServiceError(err, 'Error al buscar banco por código') }
    }
  }

  // Crear nuevo banco
  async createBanco(banco: TablesInsert<'bancos'>): Promise<{ data: Banco | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .insert(banco)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error creating banco:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear banco') }
    }
  }

  // Actualizar banco
  async updateBanco(id: string, updates: Partial<TablesInsert<'bancos'>>): Promise<{ data: Banco | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (err) {
      console.error('Error updating banco:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar banco') }
    }
  }

  // Desactivar banco (soft delete)
  async deactivateBanco(id: string): Promise<{ error: unknown }> {
    try {
      const { error } = await this.supabase
        .from('bancos')
        .update({ is_active: false })
        .eq('id', id)

      return { error }
    } catch (err) {
      console.error('Error deactivating banco:', err)
      return { error: handleServiceError(err, 'Error al desactivar banco') }
    }
  }

  // Verificar si existe un banco con el código
  async checkCodigoExists(codigo: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('id')
        .eq('codigo', codigo)
        .eq('is_active', true)
        .single()

      return !error && !!data
    } catch (err) {
      console.error('Error checking codigo exists:', err)
      return false
    }
  }
}

export const bancoService = new BancoService()