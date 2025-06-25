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
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `)
        .eq('proveedor_id', proveedorId)
        .eq('activo', true)
        .order('es_favorita', { ascending: false })
        .order('created_at', { ascending: true })

      // Transformar los datos para incluir el nombre del banco
      const transformedData = data?.map((cuenta: any) => ({
        ...cuenta,
        banco_nombre: cuenta.bancos?.nombre || cuenta.banco_nombre || 'Banco no encontrado'
      })) || null

      return { data: transformedData, error }
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
        .select(`
          *,
          bancos (
            id,
            nombre,
            codigo
          )
        `)
        .eq('proveedor_id', proveedorId)
        .eq('es_favorita', true)
        .eq('activo', true)
        .single()

      // Transformar los datos para incluir el nombre del banco
      const transformedData = data ? {
        ...data,
        banco_nombre: data.bancos?.nombre || data.banco_nombre || 'Banco no encontrado'
      } : null

      return { data: transformedData, error }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Crear múltiples cuentas bancarias para un proveedor
  async createMultipleCuentas(cuentas: Omit<ProveedorCuentaBancaria, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ data: ProveedorCuentaBancaria[] | null, error: any }> {
    try {
      // Preparar las cuentas para inserción, manejando compatibilidad entre banco_id y banco_nombre
      const cuentasParaInsertar = await Promise.all(cuentas.map(async (cuenta) => {
        const cuentaData: any = {
          proveedor_id: cuenta.proveedor_id,
          numero_cuenta: cuenta.numero_cuenta,
          titular_cuenta: cuenta.titular_cuenta,
          es_favorita: cuenta.es_favorita,
          activo: cuenta.activo
        }

        // Si tenemos banco_id, usamos ese y obtenemos el nombre del banco
        if (cuenta.banco_id) {
          cuentaData.banco_id = cuenta.banco_id
          
          // Intentar obtener el nombre del banco para compatibilidad (banco_nombre es NOT NULL)
          try {
            const { data: bancoData } = await this.supabase
              .from('bancos')
              .select('nombre')
              .eq('id', cuenta.banco_id)
              .single()
            
            if (bancoData) {
              cuentaData.banco_nombre = bancoData.nombre
            } else {
              cuentaData.banco_nombre = cuenta.banco_nombre || 'Banco no encontrado'
            }
          } catch (bancoError) {
            // banco_nombre es requerido, usar fallback
            cuentaData.banco_nombre = cuenta.banco_nombre || 'Banco no especificado'
          }
        } else if (cuenta.banco_nombre) {
          // Fallback para compatibilidad con estructura anterior
          cuentaData.banco_nombre = cuenta.banco_nombre
        } else {
          // Si no hay ni banco_id ni banco_nombre, usar valor por defecto
          cuentaData.banco_nombre = 'Banco no especificado'
        }

        return cuentaData
      }))

      const { data, error } = await this.supabase
        .from('proveedores_cuentas_bancarias')
        .insert(cuentasParaInsertar)
        .select()

      if (error) {
        console.error('Error detallado en createMultipleCuentas:', error)
      }

      return { data, error }
    } catch (error) {
      console.error('Error catch en createMultipleCuentas:', error)
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