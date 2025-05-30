// src/lib/services/cajaService.ts
import { createClient } from '@/utils/supabase/client'
import { Caja, PagoMovil, TablesInsert, TablesUpdate, User } from '@/types/database'
import { CajaUI, PagoMovilUI, FiltrosCaja, ReporteCaja } from '@/types/caja'
import { format } from 'date-fns'

export interface CajaWithRelations extends Caja {
  users?: Pick<User, 'id' | 'full_name' | 'email'>
  companies?: {
    id: string
    name: string
    rif: string
  }
  pagos_movil?: PagoMovil[]
}

export class CajaService {
  private supabase = createClient()

  // Mapear de DB a UI
  private mapCajaFromDB(cajaDB: CajaWithRelations): CajaUI {
    return {
      id: cajaDB.id,
      userId: cajaDB.user_id,
      companyId: cajaDB.company_id,
      fecha: new Date(cajaDB.fecha),
      horaApertura: new Date(cajaDB.hora_apertura),
      horaCierre: cajaDB.hora_cierre ? new Date(cajaDB.hora_cierre) : null,
      montoApertura: cajaDB.monto_apertura,
      montoCierre: cajaDB.monto_cierre,
      totalPagosMovil: cajaDB.total_pagos_movil,
      cantidadPagosMovil: cajaDB.cantidad_pagos_movil,
      estado: cajaDB.estado,
      observaciones: cajaDB.observaciones,
      usuario: cajaDB.users ? {
        id: cajaDB.users.id,
        full_name: cajaDB.users.full_name,
        email: cajaDB.users.email
      } : undefined,
      company: cajaDB.companies,
      pagosMovil: cajaDB.pagos_movil?.map(pm => this.mapPagoMovilFromDB(pm))
    }
  }

  // Mapear Pago Móvil de DB a UI
  private mapPagoMovilFromDB(pagoMovilDB: PagoMovil): PagoMovilUI {
    return {
      id: pagoMovilDB.id,
      cajaId: pagoMovilDB.caja_id,
      monto: pagoMovilDB.monto,
      fechaHora: new Date(pagoMovilDB.fecha_hora),
      nombreCliente: pagoMovilDB.nombre_cliente,
      telefono: pagoMovilDB.telefono,
      numeroReferencia: pagoMovilDB.numero_referencia,
      userId: pagoMovilDB.user_id,
      companyId: pagoMovilDB.company_id
    }
  }

  // Verificar si hay una caja abierta para el usuario en la fecha actual
  async verificarCajaAbierta(userId: string, fecha?: Date): Promise<{ data: CajaUI | null, error: any }> {
    try {
      const fechaBusqueda = fecha || new Date()
      const fechaString = format(fechaBusqueda, 'yyyy-MM-dd')

      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          ),
          companies:company_id (
            id,
            name,
            rif
          )
        `)
        .eq('user_id', userId)
        .eq('fecha', fechaString)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { data: null, error }
      }

      return { 
        data: data ? this.mapCajaFromDB(data as CajaWithRelations) : null, 
        error: null 
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Abrir caja
  async abrirCaja(userId: string, companyId: string, montoApertura: number = 0): Promise<{ data: CajaUI | null, error: any }> {
    try {
      // Verificar si ya existe una caja abierta
      const { data: cajaExistente } = await this.verificarCajaAbierta(userId)
      
      if (cajaExistente) {
        return { 
          data: null, 
          error: new Error('Ya existe una caja abierta para el día de hoy') 
        }
      }

      const nuevaCaja: TablesInsert<'cajas'> = {
        user_id: userId,
        company_id: companyId,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora_apertura: new Date().toISOString(),
        monto_apertura: montoApertura,
        total_pagos_movil: 0,
        cantidad_pagos_movil: 0,
        estado: 'abierta'
      }

      const { data, error } = await this.supabase
        .from('cajas')
        .insert(nuevaCaja)
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          ),
          companies:company_id (
            id,
            name,
            rif
          )
        `)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapCajaFromDB(data as CajaWithRelations), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Cerrar caja
  async cerrarCaja(cajaId: string, montoCierre: number, observaciones?: string): Promise<{ data: CajaUI | null, error: any }> {
    try {
      const updates: TablesUpdate<'cajas'> = {
        hora_cierre: new Date().toISOString(),
        monto_cierre: montoCierre,
        estado: 'cerrada',
        observaciones: observaciones || null
      }

      const { data, error } = await this.supabase
        .from('cajas')
        .update(updates)
        .eq('id', cajaId)
        .eq('estado', 'abierta') // Solo cerrar si está abierta
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          ),
          companies:company_id (
            id,
            name,
            rif
          )
        `)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapCajaFromDB(data as CajaWithRelations), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener cajas con filtros
  async getCajas(companyId: string, filtros?: FiltrosCaja): Promise<{ data: CajaUI[] | null, error: any }> {
    try {
      let query = this.supabase
        .from('cajas')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          ),
          companies:company_id (
            id,
            name,
            rif
          )
        `)
        .eq('company_id', companyId)
        .order('fecha', { ascending: false })
        .order('hora_apertura', { ascending: false })

      // Aplicar filtros
      if (filtros?.fechaDesde) {
        query = query.gte('fecha', format(filtros.fechaDesde, 'yyyy-MM-dd'))
      }
      
      if (filtros?.fechaHasta) {
        query = query.lte('fecha', format(filtros.fechaHasta, 'yyyy-MM-dd'))
      }
      
      if (filtros?.userId) {
        query = query.eq('user_id', filtros.userId)
      }
      
      if (filtros?.estado && filtros.estado !== 'todas') {
        query = query.eq('estado', filtros.estado)
      }

      const { data, error } = await query

      if (error) return { data: null, error }

      const cajas = data?.map(caja => this.mapCajaFromDB(caja as CajaWithRelations)) || []
      return { data: cajas, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener caja por ID con todos sus pagos móviles
  async getCajaConPagos(cajaId: string): Promise<{ data: CajaUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          *,
          users:user_id (
            id,
            full_name,
            email
          ),
          companies:company_id (
            id,
            name,
            rif
          ),
          pagos_movil (*)
        `)
        .eq('id', cajaId)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapCajaFromDB(data as CajaWithRelations), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Agregar pago móvil
  async agregarPagoMovil(pagoMovil: Omit<PagoMovilUI, 'id' | 'fechaHora'>): Promise<{ data: PagoMovilUI | null, error: any }> {
    try {
      // Verificar que la caja esté abierta
      const { data: caja, error: cajaError } = await this.supabase
        .from('cajas')
        .select('estado, total_pagos_movil, cantidad_pagos_movil')
        .eq('id', pagoMovil.cajaId)
        .single()

      if (cajaError || !caja) {
        return { data: null, error: new Error('Caja no encontrada') }
      }

      if (caja.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar que el número de referencia sea numérico
      if (!/^\d+$/.test(pagoMovil.numeroReferencia)) {
        return { data: null, error: new Error('El número de referencia debe contener solo números') }
      }

      // Insertar el pago móvil
      const nuevoPagoMovil: TablesInsert<'pagos_movil'> = {
        caja_id: pagoMovil.cajaId,
        monto: pagoMovil.monto,
        nombre_cliente: pagoMovil.nombreCliente,
        telefono: pagoMovil.telefono,
        numero_referencia: pagoMovil.numeroReferencia,
        user_id: pagoMovil.userId,
        company_id: pagoMovil.companyId
      }

      const { data: pagoCreado, error: pagoError } = await this.supabase
        .from('pagos_movil')
        .insert(nuevoPagoMovil)
        .select()
        .single()

      if (pagoError) return { data: null, error: pagoError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_pagos_movil: caja.total_pagos_movil + pagoMovil.monto,
          cantidad_pagos_movil: caja.cantidad_pagos_movil + 1
        })
        .eq('id', pagoMovil.cajaId)

      if (updateError) {
        // Si falla la actualización, intentar eliminar el pago creado
        await this.supabase.from('pagos_movil').delete().eq('id', pagoCreado.id)
        return { data: null, error: updateError }
      }

      return { data: this.mapPagoMovilFromDB(pagoCreado), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar pago móvil
  async actualizarPagoMovil(pagoId: string, updates: Partial<Omit<PagoMovilUI, 'id' | 'fechaHora' | 'cajaId' | 'userId' | 'companyId'>>): Promise<{ data: PagoMovilUI | null, error: any }> {
    try {
      // Obtener el pago actual para calcular diferencia
      const { data: pagoActual, error: getError } = await this.supabase
        .from('pagos_movil')
        .select('*, cajas!inner(estado, total_pagos_movil)')
        .eq('id', pagoId)
        .single()

      if (getError || !pagoActual) {
        return { data: null, error: new Error('Pago no encontrado') }
      }

      if (pagoActual.cajas.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar número de referencia si se está actualizando
      if (updates.numeroReferencia && !/^\d+$/.test(updates.numeroReferencia)) {
        return { data: null, error: new Error('El número de referencia debe contener solo números') }
      }

      // Preparar actualizaciones
      const dbUpdates: TablesUpdate<'pagos_movil'> = {}
      if (updates.monto !== undefined) dbUpdates.monto = updates.monto
      if (updates.nombreCliente !== undefined) dbUpdates.nombre_cliente = updates.nombreCliente
      if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono
      if (updates.numeroReferencia !== undefined) dbUpdates.numero_referencia = updates.numeroReferencia

      // Actualizar el pago
      const { data: pagoActualizado, error: updateError } = await this.supabase
        .from('pagos_movil')
        .update(dbUpdates)
        .eq('id', pagoId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Si se actualizó el monto, actualizar totales en la caja
      if (updates.monto !== undefined && updates.monto !== pagoActual.monto) {
        const diferencia = updates.monto - pagoActual.monto
        
        const { error: cajaUpdateError } = await this.supabase
          .from('cajas')
          .update({
            total_pagos_movil: pagoActual.cajas.total_pagos_movil + diferencia
          })
          .eq('id', pagoActual.caja_id)

        if (cajaUpdateError) {
          // Revertir el cambio en el pago
          await this.supabase
            .from('pagos_movil')
            .update({ monto: pagoActual.monto })
            .eq('id', pagoId)
          return { data: null, error: cajaUpdateError }
        }
      }

      return { data: this.mapPagoMovilFromDB(pagoActualizado), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Eliminar pago móvil
  async eliminarPagoMovil(pagoId: string): Promise<{ error: any }> {
    try {
      // Obtener el pago para actualizar totales
      const { data: pago, error: getError } = await this.supabase
        .from('pagos_movil')
        .select('*, cajas!inner(estado, total_pagos_movil, cantidad_pagos_movil)')
        .eq('id', pagoId)
        .single()

      if (getError || !pago) {
        return { error: new Error('Pago no encontrado') }
      }

      if (pago.cajas.estado !== 'abierta') {
        return { error: new Error('La caja está cerrada') }
      }

      // Eliminar el pago
      const { error: deleteError } = await this.supabase
        .from('pagos_movil')
        .delete()
        .eq('id', pagoId)

      if (deleteError) return { error: deleteError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_pagos_movil: pago.cajas.total_pagos_movil - pago.monto,
          cantidad_pagos_movil: pago.cajas.cantidad_pagos_movil - 1
        })
        .eq('id', pago.caja_id)

      return { error: updateError }
    } catch (error) {
      return { error }
    }
  }

  // Generar reporte de caja
  async generarReporteCaja(cajaId: string): Promise<{ data: ReporteCaja | null, error: any }> {
    try {
      const { data: caja, error: cajaError } = await this.getCajaConPagos(cajaId)
      
      if (cajaError || !caja) {
        return { data: null, error: cajaError || new Error('Caja no encontrada') }
      }

      const reporte: ReporteCaja = {
        caja,
        pagosMovil: caja.pagosMovil || [],
        totales: {
          cantidadPagos: caja.cantidadPagosMovil,
          montoTotal: caja.totalPagosMovil
        }
      }

      return { data: reporte, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener resumen de cajas para dashboard
  async getResumenCajas(companyId: string, dias: number = 7): Promise<{ data: any, error: any }> {
    try {
      const fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - dias)

      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          fecha,
          estado,
          total_pagos_movil,
          cantidad_pagos_movil,
          users:user_id (
            full_name
          )
        `)
        .eq('company_id', companyId)
        .gte('fecha', format(fechaInicio, 'yyyy-MM-dd'))
        .order('fecha', { ascending: false })

      if (error) return { data: null, error }

      const resumen = {
        totalCajas: data?.length || 0,
        cajasAbiertas: data?.filter(c => c.estado === 'abierta').length || 0,
        totalPagosMovil: data?.reduce((sum, c) => sum + c.total_pagos_movil, 0) || 0,
        totalCantidadPagos: data?.reduce((sum, c) => sum + c.cantidad_pagos_movil, 0) || 0,
        cajasPorDia: data || []
      }

      return { data: resumen, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

export const cajaService = new CajaService()