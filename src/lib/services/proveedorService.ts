// src/lib/services/proveedorService.ts
import { createClient } from '@/utils/supabase/client'
import { Proveedor, TablesInsert } from '@/types/database'
import { ProveedorCuentaBancaria, TipoCambio } from '@/types/index'
import { proveedorCuentasBancariasService } from './proveedorCuentasBancariasService'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'


export interface ProveedorWithCuentas extends Proveedor {
  cuentas_bancarias?: ProveedorCuentaBancaria[]
}

export interface ProveedorFormData {
  nombre: string
  rif: string
  direccion: string
  telefono?: string
  email?: string
  contacto?: string
  porcentaje_retencion: number
  tipo_cambio: TipoCambio
  cuentas_bancarias: ProveedorCuentaBancaria[]
}

export class ProveedorService {
  private supabase = createClient()

  // Buscar proveedor por RIF con cuentas bancarias
  async getProveedorByRif(rif: string): Promise<{ data: ProveedorWithCuentas | null, error: unknown }> {
    try {
      const { data: proveedor, error: proveedorError } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('rif', rif.toUpperCase())
        .eq('is_active', true)
        .single()

      if (proveedorError || !proveedor) {
        return { data: null, error: proveedorError }
      }

      // Obtener cuentas bancarias del proveedor
      const { data: cuentas, error: cuentasError } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedor.id)

      return { 
        data: { 
          ...proveedor, 
          cuentas_bancarias: cuentas || [] 
        } as ProveedorWithCuentas, 
        error: null 
      }
    } catch (err) {
      console.error('Error getting proveedor by RIF:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener proveedor por RIF') }
    }
  }

  // Buscar proveedores (para búsqueda en tiempo real) con cuentas bancarias
  async searchProveedores(searchTerm: string): Promise<{ data: ProveedorWithCuentas[] | null, error: unknown }> {
    try {
      const { data: proveedores, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('is_active', true)
        .or(`nombre.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%`)
        .limit(10)
        .order('nombre')

      if (error || !proveedores) {
        return { data: null, error }
      }

      // Obtener cuentas bancarias para cada proveedor
      const proveedoresWithCuentas = await Promise.all(
        proveedores.map(async (proveedor) => {
          const { data: cuentas } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedor.id)
          return {
            ...proveedor,
            cuentas_bancarias: cuentas || []
          } as ProveedorWithCuentas
        })
      )

      return { data: proveedoresWithCuentas, error: null }
    } catch (err) {
      console.error('Error searching proveedores:', err)
      return { data: null, error: handleServiceError(err, 'Error al buscar proveedores') }
    }
  }

  // Buscar proveedores específicamente por RIF para autocompletar
  async searchProveedoresByRif(rif: string): Promise<{ success: boolean, data?: ProveedorWithCuentas[], error?: string }> {
    try {
      const { data: proveedores, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('is_active', true)
        .ilike('rif', `%${rif}%`)
        .limit(5)
        .order('nombre')

      if (error) {
        return { success: false, error: handleServiceError(error, 'Error al buscar proveedores') }
      }

      if (!proveedores) {
        return { success: true, data: [] }
      }

      // Obtener cuentas bancarias para cada proveedor
      const proveedoresWithCuentas = await Promise.all(
        proveedores.map(async (proveedor) => {
          const { data: cuentas } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedor.id)
          return {
            ...proveedor,
            cuentas_bancarias: cuentas || []
          } as ProveedorWithCuentas
        })
      )

      return { success: true, data: proveedoresWithCuentas }
    } catch (err) {
      console.error('Error searching proveedores by RIF:', err)
      return { success: false, error: handleServiceError(err, 'Error al buscar proveedores por RIF') }
    }
  }

  // Obtener todos los proveedores activos con paginación
  async getAllProveedoresPaginated(
    page: number = 1, 
    itemsPerPage: number = 10,
    searchTerm?: string
  ): Promise<{ 
    data: ProveedorWithCuentas[] | null, 
    totalCount: number,
    error: unknown 
  }> {
    try {
      let query = this.supabase
        .from('proveedores')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,rif.ilike.%${searchTerm}%,contacto.ilike.%${searchTerm}%`)
      }

      const from = (page - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      query = query.range(from, to)

      const { data: proveedores, error, count } = await query

      if (error || !proveedores) {
        return { data: null, totalCount: count || 0, error }
      }

      // Obtener cuentas bancarias para cada proveedor
      const proveedoresWithCuentas = await Promise.all(
        proveedores.map(async (proveedor) => {
          const { data: cuentas } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedor.id)
          return {
            ...proveedor,
            cuentas_bancarias: cuentas || []
          } as ProveedorWithCuentas
        })
      )

      return { data: proveedoresWithCuentas, totalCount: count || 0, error: null }
    } catch (err) {
      console.error('Error getting proveedores paginated:', err)
      return { data: null, totalCount: 0, error: handleServiceError(err, 'Error al obtener proveedores paginados') }
    }
  }

  // Obtener todos los proveedores activos
  async getAllProveedores(): Promise<{ data: ProveedorWithCuentas[] | null, error: unknown }> {
    try {
      const { data: proveedores, error } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('is_active', true)
        .order('nombre')

      if (error || !proveedores) {
        return { data: null, error }
      }

      // Obtener cuentas bancarias para cada proveedor
      const proveedoresWithCuentas = await Promise.all(
        proveedores.map(async (proveedor) => {
          const { data: cuentas } = await proveedorCuentasBancariasService.getCuentasByProveedorId(proveedor.id)
          return {
            ...proveedor,
            cuentas_bancarias: cuentas || []
          } as ProveedorWithCuentas
        })
      )

      return { data: proveedoresWithCuentas, error: null }
    } catch (err) {
      console.error('Error getting all proveedores:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener todos los proveedores') }
    }
  }

  // Crear nuevo proveedor
  async createProveedor(proveedor: Omit<TablesInsert<'proveedores'>, 'created_by'>): Promise<{ data: Proveedor | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error creating proveedor:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear proveedor') }
    }
  }

  // Actualizar proveedor
  async updateProveedor(id: string, updates: Partial<Omit<TablesInsert<'proveedores'>, 'id' | 'created_by' | 'created_at'>>): Promise<{ data: Proveedor | null, error: unknown }> {
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
    } catch (err) {
      console.error('Error updating proveedor:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar proveedor') }
    }
  }

  // Desactivar proveedor (soft delete)
  async deactivateProveedor(id: string): Promise<{ error: unknown }> {
    try {
      const { error } = await this.supabase
        .from('proveedores')
        .update({ is_active: false })
        .eq('id', id)

      return { error }
    } catch (err) {
      console.error('Error deactivating proveedor:', err)
      return { error: handleServiceError(err, 'Error al desactivar proveedor') }
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
    } catch (err) {
      console.error('Error checking RIF exists:', err)
      return false
    }
  }

  // Crear proveedor con cuentas bancarias
  async createProveedorWithCuentas(formData: ProveedorFormData): Promise<{ data: ProveedorWithCuentas | null, error: unknown }> {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await this.supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('Usuario no autenticado') }
      }

      // Obtener company_id del usuario
      const { data: userData } = await this.supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .single()

      if (!userData?.company_id) {
        return { data: null, error: new Error('Usuario sin compañía asignada') }
      }

      // Crear proveedor
      const proveedorData = {
        nombre: formData.nombre,
        rif: formData.rif.toUpperCase(),
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
        contacto: formData.contacto,
        porcentaje_retencion: formData.porcentaje_retencion || 75,
        tipo_cambio: formData.tipo_cambio,
        company_id: userData.company_id,
        created_by: user.id
      }

      const { data: proveedor, error: proveedorError } = await this.supabase
        .from('proveedores')
        .insert(proveedorData)
        .select()
        .single()

      if (proveedorError || !proveedor) {
        return { data: null, error: proveedorError }
      }

      // Crear cuentas bancarias si las hay
      if (formData.cuentas_bancarias && formData.cuentas_bancarias.length > 0) {
        const cuentasData = formData.cuentas_bancarias.map(cuenta => ({
          proveedor_id: proveedor.id,
          banco_id: cuenta.banco_id,
          banco_nombre: cuenta.banco_nombre || 'Banco no especificado', // banco_nombre es NOT NULL
          numero_cuenta: cuenta.numero_cuenta,
          titular_cuenta: cuenta.titular_cuenta,
          es_favorita: cuenta.es_favorita,
          activo: true
        }))

        const { data: cuentas, error: cuentasError } = await proveedorCuentasBancariasService.createMultipleCuentas(cuentasData)

        if (cuentasError) {
          console.error('Error creando cuentas bancarias:', cuentasError)
          // No retornar error aquí para no bloquear la creación del proveedor
        }

        return { 
          data: { 
            ...proveedor, 
            cuentas_bancarias: cuentas || [] 
          } as ProveedorWithCuentas, 
          error: null 
        }
      }

      return { 
        data: { 
          ...proveedor, 
          cuentas_bancarias: [] 
        } as ProveedorWithCuentas, 
        error: null 
      }
    } catch (err) {
      console.error('Error creating proveedor with cuentas:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear proveedor con cuentas bancarias') }
    }
  }

  // Actualizar proveedor con cuentas bancarias
  async updateProveedorWithCuentas(id: string, formData: ProveedorFormData): Promise<{ data: ProveedorWithCuentas | null, error: unknown }> {
    try {
      // Actualizar datos del proveedor
      const proveedorUpdates = {
        nombre: formData.nombre,
        rif: formData.rif.toUpperCase(),
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
        contacto: formData.contacto,
        porcentaje_retencion: formData.porcentaje_retencion,
        tipo_cambio: formData.tipo_cambio,
        updated_at: new Date().toISOString()
      }

      const { data: proveedor, error: proveedorError } = await this.supabase
        .from('proveedores')
        .update(proveedorUpdates)
        .eq('id', id)
        .select()
        .single()

      if (proveedorError || !proveedor) {
        return { data: null, error: proveedorError }
      }

      // Desactivar todas las cuentas bancarias existentes
      await this.supabase
        .from('proveedores_cuentas_bancarias')
        .update({ activo: false })
        .eq('proveedor_id', id)

      // Crear nuevas cuentas bancarias
      if (formData.cuentas_bancarias && formData.cuentas_bancarias.length > 0) {
        const cuentasData = formData.cuentas_bancarias.map(cuenta => ({
          proveedor_id: id,
          banco_id: cuenta.banco_id,
          banco_nombre: cuenta.banco_nombre || 'Banco no especificado', // banco_nombre es NOT NULL
          numero_cuenta: cuenta.numero_cuenta,
          titular_cuenta: cuenta.titular_cuenta,
          es_favorita: cuenta.es_favorita,
          activo: true
        }))

        const { data: cuentas, error: cuentasError } = await proveedorCuentasBancariasService.createMultipleCuentas(cuentasData)

        if (cuentasError) {
          console.error('Error actualizando cuentas bancarias:', cuentasError)
          // No retornar error aquí para no bloquear la actualización del proveedor
        }

        return { 
          data: { 
            ...proveedor, 
            cuentas_bancarias: cuentas || [] 
          } as ProveedorWithCuentas, 
          error: null 
        }
      }

      return { 
        data: { 
          ...proveedor, 
          cuentas_bancarias: [] 
        } as ProveedorWithCuentas, 
        error: null 
      }
    } catch (err) {
      console.error('Error updating proveedor with cuentas:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar proveedor con cuentas bancarias') }
    }
  }

  // Obtener proveedor con sus cuentas bancarias
  async getProveedorWithCuentas(id: string): Promise<{ data: ProveedorWithCuentas | null, error: unknown }> {
    try {
      const { data: proveedor, error: proveedorError } = await this.supabase
        .from('proveedores')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (proveedorError || !proveedor) {
        return { data: null, error: proveedorError }
      }

      const { data: cuentas, error: cuentasError } = await proveedorCuentasBancariasService.getCuentasByProveedorId(id)

      return { 
        data: { 
          ...proveedor, 
          cuentas_bancarias: cuentas || [] 
        } as ProveedorWithCuentas, 
        error: null 
      }
    } catch (err) {
      console.error('Error getting proveedor with cuentas:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener proveedor con cuentas bancarias') }
    }
  }
}

export const proveedorService = new ProveedorService()