// src/lib/services/proveedorService.ts
import { createClient } from '@/utils/supabase/client'
import { Proveedor, TablesInsert } from '@/types/database'

export interface ProveedorWithBanco extends Proveedor {
  bancos?: {
    id: string
    nombre: string
    codigo: string
  } | null
}

export class ProveedorService {
  private supabase = createClient()

  // Buscar proveedor por RIF
  async getProveedorByRif(rif: string): Promise<{ data: ProveedorWithBanco | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `)
        .eq('rif', rif.toUpperCase())
        .eq('is_active', true)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Buscar proveedores (para búsqueda en tiempo real)
  async searchProveedores(searchTerm: string): Promise<{ data: ProveedorWithBanco[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `)
        .eq('is_active', true)
        .or(`nombre.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%`)
        .limit(10)
        .order('nombre')

      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener todos los proveedores activos con paginación
  async getAllProveedoresPaginated(
    page: number = 1, 
    itemsPerPage: number = 10,
    searchTerm?: string
  ): Promise<{ 
    data: ProveedorWithBanco[] | null, 
    totalCount: number,
    error: any 
  }> {
    try {
      let query = this.supabase
        .from('proveedores')
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%,contacto.ilike.%${searchTerm}%`)
      }

      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      query = query.range(from, to)

      const { data, error, count } = await query

      return { data, totalCount: count || 0, error }
    } catch (error) {
      return { data: null, totalCount: 0, error }
    }
  }

  // Obtener todos los proveedores activos
  async getAllProveedores(): Promise<{ data: ProveedorWithBanco[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('proveedores')
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `)
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
        created_by: user.id,
        porcentaje_retencion: proveedor.porcentaje_retencion || 75
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
  async checkRifExists(rif: string, excludeId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('proveedores')
        .select('id')
        .eq('rif', rif.toUpperCase())
        .eq('is_active', true)

      if (excludeId) {
        query = query.neq('id', excludeId)
      }

      const { data, error } = await query.single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }
}

export const proveedorService = new ProveedorService()