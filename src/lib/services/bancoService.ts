// src/lib/services/bancoService.ts
import { createClient } from '@/utils/supabase/client'
import { Banco, TablesInsert } from '@/types/database'

export class BancoService {
  private supabase = createClient()

  // Obtener todos los bancos activos
  async getAllBancos(): Promise<{ data: Banco[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Buscar banco por código
  async getBancoByCodigo(codigo: string): Promise<{ data: Banco | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .select('*')
        .eq('codigo', codigo)
        .eq('is_active', true)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear nuevo banco
  async createBanco(banco: TablesInsert<'bancos'>): Promise<{ data: Banco | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .insert(banco)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar banco
  async updateBanco(id: string, updates: Partial<TablesInsert<'bancos'>>): Promise<{ data: Banco | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('bancos')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Desactivar banco (soft delete)
  async deactivateBanco(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('bancos')
        .update({ is_active: false })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
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
    } catch (error) {
      return false
    }
  }
}

export const bancoService = new BancoService()