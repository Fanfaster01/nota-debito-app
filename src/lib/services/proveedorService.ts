// src/lib/services/proveedorService.ts
import { createClient } from '@/utils/supabase/client'
import { Proveedor, TablesInsert } from '@/types/database'

export class ProveedorService {
  private supabase = createClient()

  // Buscar proveedor por RIF
  async getProveedorByRif(rif: string): Promise<{ data: Proveedor | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('rif', rif.toUpperCase())
        .eq('is_active', true)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Buscar proveedores (para búsqueda en tiempo real)
  async searchProveedores(searchTerm: string): Promise<{ data: Proveedor[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('is_active', true)
        .or(`nombre.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%`)
        .limit(10)
        .order('nombre')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener todos los proveedores activos
  async getAllProveedores(): Promise<{ data: Proveedor[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear nuevo proveedor
  async createProveedor(proveedor: Omit<TablesInsert<'proveedores'>, 'created_by'>): Promise<{ data: Proveedor | null, error: any }> {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('Usuario no autenticado') }
      }

      // Normalizar RIF a mayúsculas
      const proveedorData = {
        ...proveedor,
        rif: proveedor.rif.toUpperCase(),
        created_by: user.id
      }

      const { data, error } = await this.supabase
        .from('proveedores')
        .insert(proveedorData)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar proveedor
  async updateProveedor(id: string, updates: Partial<Omit<TablesInsert<'proveedores'>, 'id' | 'created_by' | 'created_at'>>): Promise<{ data: Proveedor | null, error: any }> {
    try {
      // Si se está actualizando el RIF, normalizarlo
      if (updates.rif) {
        updates.rif = updates.rif.toUpperCase()
      }

      const { data, error } = await this.supabase
        .from('proveedores')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Desactivar proveedor (soft delete)
  async deactivateProveedor(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('proveedores')
        .update({ is_active: false })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Verificar si existe un proveedor con el RIF
  async checkRifExists(rif: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select('id')
        .eq('rif', rif.toUpperCase())
        .eq('is_active', true)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }
}

export const proveedorService = new ProveedorService()