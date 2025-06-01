// src/lib/services/clienteService.ts
import { createClient } from '@/utils/supabase/client'
import { Cliente, TablesInsert, TablesUpdate } from '@/types/database'

export interface ClienteUI {
  id?: string
  tipoDocumento: 'V' | 'E' | 'J' | 'G' | 'P'
  numeroDocumento: string
  nombre: string
  telefono?: string | null
  direccion?: string | null
  createdAt?: Date
  updatedAt?: Date
  createdBy?: string
  isActive?: boolean
}

export class ClienteService {
  private supabase = createClient()

  // Mapear de DB a UI
  private mapClienteFromDB(clienteDB: Cliente): ClienteUI {
    return {
      id: clienteDB.id,
      tipoDocumento: clienteDB.tipo_documento,
      numeroDocumento: clienteDB.numero_documento,
      nombre: clienteDB.nombre,
      telefono: clienteDB.telefono,
      direccion: clienteDB.direccion,
      createdAt: new Date(clienteDB.created_at),
      updatedAt: new Date(clienteDB.updated_at),
      createdBy: clienteDB.created_by,
      isActive: clienteDB.is_active
    }
  }

  // Mapear de UI a DB
  private mapClienteToDB(clienteUI: Omit<ClienteUI, 'id' | 'createdAt' | 'updatedAt'>): Omit<TablesInsert<'clientes'>, 'id' | 'created_at' | 'updated_at'> {
    return {
      tipo_documento: clienteUI.tipoDocumento,
      numero_documento: clienteUI.numeroDocumento,
      nombre: clienteUI.nombre,
      telefono: clienteUI.telefono || null,
      direccion: clienteUI.direccion || null,
      created_by: clienteUI.createdBy!,
      is_active: clienteUI.isActive ?? true
    }
  }

  // Buscar cliente por documento
  async buscarPorDocumento(tipoDocumento: string, numeroDocumento: string): Promise<{ data: ClienteUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('tipo_documento', tipoDocumento)
        .eq('numero_documento', numeroDocumento)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { data: null, error }
      }

      return { 
        data: data ? this.mapClienteFromDB(data) : null, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Buscar clientes por texto (número de documento o nombre)
  async buscarClientes(texto: string): Promise<{ data: ClienteUI[] | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('is_active', true)
        .or(`numero_documento.ilike.%${texto}%,nombre.ilike.%${texto}%`)
        .order('nombre')
        .limit(10)

      if (error) return { data: null, error }

      return { 
        data: data ? data.map(c => this.mapClienteFromDB(c)) : [], 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear cliente
  async crearCliente(cliente: Omit<ClienteUI, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: ClienteUI | null, error: any }> {
    try {
      const clienteData = this.mapClienteToDB(cliente)

      const { data, error } = await this.supabase
        .from('clientes')
        .insert(clienteData)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapClienteFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar cliente
  async actualizarCliente(id: string, updates: Partial<ClienteUI>): Promise<{ data: ClienteUI | null, error: any }> {
    try {
      const updateData: TablesUpdate<'clientes'> = {}
      
      if (updates.tipoDocumento !== undefined) updateData.tipo_documento = updates.tipoDocumento
      if (updates.numeroDocumento !== undefined) updateData.numero_documento = updates.numeroDocumento
      if (updates.nombre !== undefined) updateData.nombre = updates.nombre
      if (updates.telefono !== undefined) updateData.telefono = updates.telefono
      if (updates.direccion !== undefined) updateData.direccion = updates.direccion

      const { data, error } = await this.supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) return { data: null, error }

      return { data: this.mapClienteFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener cliente por ID
  async obtenerCliente(id: string): Promise<{ data: ClienteUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapClienteFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Desactivar cliente (soft delete)
  async desactivarCliente(id: string): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('clientes')
        .update({ is_active: false })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }
}

export const clienteService = new ClienteService()