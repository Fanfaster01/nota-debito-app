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