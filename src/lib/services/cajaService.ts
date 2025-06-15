// src/lib/services/cajaService.ts
import { createClient } from '@/utils/supabase/client'
import { Caja, PagoMovil, PagoZelle, NotaCreditoCaja, CreditoCaja, CierreCaja, CierrePuntoVenta, TablesInsert, TablesUpdate, User } from '@/types/database'
import { CajaUI, PagoMovilUI, PagoZelleUI, NotaCreditoCajaUI, CreditoCajaUI, FiltrosCaja, ReporteCaja, CierreCajaFormData } from '@/types/caja'
import { format } from 'date-fns'

export interface CajaWithRelations extends Caja {
  companies?: {
    id: string
    name: string
    rif: string
  }
  users_view?: {
    id: string
    full_name: string | null
    email: string
  }
  pagos_movil?: PagoMovil[]
  pagos_zelle?: PagoZelle[]
  notas_credito_caja?: NotaCreditoCaja[]
  creditos_caja?: CreditoCaja[]
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
      montoAperturaUsd: cajaDB.monto_apertura_usd || 0,
      montoCierre: cajaDB.monto_cierre,
      tasaDia: cajaDB.tasa_dia || 0,
      tipoMoneda: (cajaDB.tipo_moneda as 'USD' | 'EUR') || 'USD',
      totalPagosMovil: cajaDB.total_pagos_movil,
      cantidadPagosMovil: cajaDB.cantidad_pagos_movil,
      totalZelleUsd: cajaDB.total_zelle_usd || 0,
      totalZelleBs: cajaDB.total_zelle_bs || 0,
      cantidadZelle: cajaDB.cantidad_zelle || 0,
      totalNotasCredito: cajaDB.total_notas_credito || 0,
      cantidadNotasCredito: cajaDB.cantidad_notas_credito || 0,
      totalCreditosBs: cajaDB.total_creditos_bs || 0,
      totalCreditosUsd: cajaDB.total_creditos_usd || 0,
      cantidadCreditos: cajaDB.cantidad_creditos || 0,
      estado: cajaDB.estado,
      observaciones: cajaDB.observaciones,
      usuario: cajaDB.users_view ? {
        id: cajaDB.users_view.id,
        full_name: cajaDB.users_view.full_name,
        email: cajaDB.users_view.email
      } : undefined,
      company: cajaDB.companies,
      pagosMovil: cajaDB.pagos_movil?.map(pm => this.mapPagoMovilFromDB(pm)),
      pagosZelle: cajaDB.pagos_zelle?.map(pz => this.mapPagoZelleFromDB(pz)),
      notasCredito: cajaDB.notas_credito_caja?.map(nc => this.mapNotaCreditoCajaFromDB(nc)),
      creditos: cajaDB.creditos_caja?.map(c => this.mapCreditoCajaFromDB(c))
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

  // Mapear Pago Zelle de DB a UI
  private mapPagoZelleFromDB(pagoZelleDB: PagoZelle): PagoZelleUI {
    return {
      id: pagoZelleDB.id,
      cajaId: pagoZelleDB.caja_id,
      montoUsd: pagoZelleDB.monto_usd,
      tasa: pagoZelleDB.tasa,
      montoBs: pagoZelleDB.monto_bs,
      fechaHora: new Date(pagoZelleDB.fecha_hora),
      nombreCliente: pagoZelleDB.nombre_cliente,
      telefono: pagoZelleDB.telefono,
      userId: pagoZelleDB.user_id,
      companyId: pagoZelleDB.company_id
    }
  }

  // Mapear Nota de Crédito de Caja de DB a UI
  private mapNotaCreditoCajaFromDB(notaCreditoDB: NotaCreditoCaja): NotaCreditoCajaUI {
    return {
      id: notaCreditoDB.id,
      cajaId: notaCreditoDB.caja_id,
      numeroNotaCredito: notaCreditoDB.numero_nota_credito,
      facturaAfectada: notaCreditoDB.factura_afectada,
      montoBs: notaCreditoDB.monto_bs,
      nombreCliente: notaCreditoDB.nombre_cliente,
      explicacion: notaCreditoDB.explicacion,
      fechaHora: new Date(notaCreditoDB.fecha_hora),
      userId: notaCreditoDB.user_id,
      companyId: notaCreditoDB.company_id
    }
  }

  // Mapear Crédito de Caja de DB a UI
  private mapCreditoCajaFromDB(creditoDB: CreditoCaja & { cliente?: any }): CreditoCajaUI {
    return {
      id: creditoDB.id,
      cajaId: creditoDB.caja_id,
      clienteId: creditoDB.cliente_id,
      cliente: creditoDB.cliente ? {
        id: creditoDB.cliente.id,
        tipoDocumento: creditoDB.cliente.tipo_documento,
        numeroDocumento: creditoDB.cliente.numero_documento,
        nombre: creditoDB.cliente.nombre,
        telefono: creditoDB.cliente.telefono,
        direccion: creditoDB.cliente.direccion
      } : undefined,
      numeroFactura: creditoDB.numero_factura,
      nombreCliente: creditoDB.nombre_cliente,
      telefonoCliente: creditoDB.telefono_cliente,
      montoBs: creditoDB.monto_bs,
      montoUsd: creditoDB.monto_usd,
      tasa: creditoDB.tasa,
      estado: creditoDB.estado,
      fechaHora: new Date(creditoDB.fecha_hora),
      userId: creditoDB.user_id,
      companyId: creditoDB.company_id
    }
  }

  // Verificar si hay una caja abierta para el usuario (sin importar la fecha)
  async verificarCajaAbierta(userId: string): Promise<{ data: CajaUI | null, error: any }> {
    try {
      // Buscar cualquier caja abierta del usuario, sin importar la fecha
      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            rif
          ),
          users_view:user_id (
            id,
            full_name,
            email
          )
        `)
        .eq('user_id', userId)
        .eq('estado', 'abierta')
        .order('fecha', { ascending: false })
        .limit(1)
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

  // Verificar si ya existe una caja para una fecha específica
  async verificarCajaDelDia(userId: string, fecha: Date): Promise<{ data: CajaUI | null, error: any }> {
    try {
      const fechaString = format(fecha, 'yyyy-MM-dd')

      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          *,
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
  async abrirCaja(userId: string, companyId: string, montoApertura: number = 0, montoAperturaUsd: number = 0, tasaDia: number, tipoMoneda: 'USD' | 'EUR' = 'USD'): Promise<{ data: CajaUI | null, error: any }> {
    try {
      // Verificar si ya existe una caja abierta (sin importar la fecha)
      const { data: cajaAbierta } = await this.verificarCajaAbierta(userId)
      
      if (cajaAbierta) {
        return { 
          data: null, 
          error: new Error('Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva') 
        }
      }

      // Verificar si ya existe una caja para hoy (abierta o cerrada)
      const { data: cajaDelDia } = await this.verificarCajaDelDia(userId, new Date())
      
      if (cajaDelDia) {
        return { 
          data: null, 
          error: new Error('Ya existe una caja para el día de hoy') 
        }
      }

      const nuevaCaja: TablesInsert<'cajas'> = {
        user_id: userId,
        company_id: companyId,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        hora_apertura: new Date().toISOString(),
        monto_apertura: montoApertura,
        monto_apertura_usd: montoAperturaUsd,
        tasa_dia: tasaDia,
        tipo_moneda: tipoMoneda,
        total_pagos_movil: 0,
        cantidad_pagos_movil: 0,
        total_zelle_usd: 0,
        total_zelle_bs: 0,
        cantidad_zelle: 0,
        total_notas_credito: 0,
        cantidad_notas_credito: 0,
        total_creditos_bs: 0,
        total_creditos_usd: 0,
        cantidad_creditos: 0,
        estado: 'abierta'
      }

      const { data, error } = await this.supabase
        .from('cajas')
        .insert(nuevaCaja)
        .select(`
          *,
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
  async cerrarCaja(cajaId: string, montoCierre: number, observaciones?: string, datosCompletos?: CierreCajaFormData): Promise<{ data: CajaUI | null, error: any }> {
    try {
      // Iniciar transacción
      const updates: TablesUpdate<'cajas'> = {
        hora_cierre: new Date().toISOString(),
        monto_cierre: montoCierre,
        estado: 'cerrada',
        observaciones: observaciones || null
      }

      // Actualizar la caja
      const { data: cajaData, error: cajaError } = await this.supabase
        .from('cajas')
        .update(updates)
        .eq('id', cajaId)
        .eq('estado', 'abierta') // Solo cerrar si está abierta
        .select(`
          *,
          companies:company_id (
            id,
            name,
            rif
          )
        `)
        .single()

      if (cajaError) return { data: null, error: cajaError }

      // Si se proporcionaron datos completos, guardarlos
      if (datosCompletos) {
        // Guardar detalles del efectivo
        const cierreEfectivoData: TablesInsert<'cierres_caja'> = {
          caja_id: cajaId,
          efectivo_dolares: datosCompletos.efectivoDolares || 0,
          efectivo_euros: datosCompletos.efectivoEuros || 0,
          efectivo_bs: datosCompletos.efectivoBs || 0,
          reporte_z: datosCompletos.reporteZ || 0,
          fondo_caja_dolares: datosCompletos.fondoCajaDolares || 0,
          fondo_caja_bs: datosCompletos.fondoCajaBs || 0
        }

        const { error: efectivoError } = await this.supabase
          .from('cierres_caja')
          .insert(cierreEfectivoData)

        if (efectivoError) {
          console.error('Error guardando detalles de efectivo:', efectivoError)
        }

        // Guardar cierres de punto de venta
        if (datosCompletos.cierresPuntoVenta && datosCompletos.cierresPuntoVenta.length > 0) {
          const cierresPvData: TablesInsert<'cierres_punto_venta'>[] = datosCompletos.cierresPuntoVenta.map(cv => ({
            caja_id: cajaId,
            banco_id: cv.bancoId,
            monto_bs: cv.montoBs,
            monto_usd: cv.montoUsd,
            numero_lote: cv.numeroLote
          }))

          const { error: pvError } = await this.supabase
            .from('cierres_punto_venta')
            .insert(cierresPvData)

          if (pvError) {
            console.error('Error guardando cierres de punto de venta:', pvError)
          }
        }
      }

      return { data: this.mapCajaFromDB(cajaData as CajaWithRelations), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener detalles de cierre de una caja
  async getDetallesCierre(cajaId: string): Promise<{ 
    data: { 
      efectivo: CierreCaja | null, 
      puntoVenta: (CierrePuntoVenta & { banco: { nombre: string, codigo: string } })[] 
    } | null, 
    error: any 
  }> {
    try {
      // Obtener detalles del efectivo
      const { data: efectivoData, error: efectivoError } = await this.supabase
        .from('cierres_caja')
        .select('*')
        .eq('caja_id', cajaId)
        .single()

      if (efectivoError && efectivoError.code !== 'PGRST116') {
        return { data: null, error: efectivoError }
      }

      // Obtener cierres de punto de venta con información del banco
      const { data: pvData, error: pvError } = await this.supabase
        .from('cierres_punto_venta')
        .select(`
          *,
          banco:banco_id (
            nombre,
            codigo
          )
        `)
        .eq('caja_id', cajaId)

      if (pvError) {
        return { data: null, error: pvError }
      }

      return {
        data: {
          efectivo: efectivoData || null,
          puntoVenta: pvData || []
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener todas las cajas con sus detalles de cierre para reportes
  async getCajasConDetalles(companyId: string, filtros?: FiltrosCaja): Promise<{
    data: Array<{
      caja: CajaUI,
      detallesEfectivo: CierreCaja | null,
      detallesPuntoVenta: (CierrePuntoVenta & { banco: { nombre: string, codigo: string } })[]
    }> | null,
    error: any
  }> {
    try {
      // Primero obtener las cajas
      const { data: cajas, error: cajasError } = await this.getCajas(companyId, filtros)
      
      if (cajasError || !cajas) {
        return { data: null, error: cajasError }
      }

      // Para cada caja cerrada, obtener sus detalles de cierre
      const cajasConDetalles = await Promise.all(
        cajas.map(async (caja) => {
          if (caja.estado === 'cerrada') {
            const { data: detalles } = await this.getDetallesCierre(caja.id!)
            return {
              caja,
              detallesEfectivo: detalles?.efectivo || null,
              detallesPuntoVenta: detalles?.puntoVenta || []
            }
          } else {
            return {
              caja,
              detallesEfectivo: null,
              detallesPuntoVenta: []
            }
          }
        })
      )

      return { data: cajasConDetalles, error: null }
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

  // Obtener caja por ID con todos sus pagos
  async getCajaConPagos(cajaId: string): Promise<{ data: CajaUI | null, error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('cajas')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            rif
          ),
          users_view:user_id (
            id,
            full_name,
            email
          ),
          pagos_movil (*),
          pagos_zelle (*),
          notas_credito_caja (*),
          creditos_caja (
            *,
            cliente:cliente_id (
              id,
              tipo_documento,
              numero_documento,
              nombre,
              telefono,
              direccion
            )
          )
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

  // Agregar pago Zelle
  async agregarPagoZelle(pagoZelle: Omit<PagoZelleUI, 'id' | 'fechaHora' | 'montoBs'>): Promise<{ data: PagoZelleUI | null, error: any }> {
    try {
      // Verificar que la caja esté abierta y obtener la tasa del día
      const { data: caja, error: cajaError } = await this.supabase
        .from('cajas')
        .select('estado, tasa_dia, total_zelle_usd, total_zelle_bs, cantidad_zelle')
        .eq('id', pagoZelle.cajaId)
        .single()

      if (cajaError || !caja) {
        return { data: null, error: new Error('Caja no encontrada') }
      }

      if (caja.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Calcular el monto en bolívares
      const montoBs = pagoZelle.montoUsd * pagoZelle.tasa

      // Insertar el pago Zelle
      const nuevoPagoZelle: TablesInsert<'pagos_zelle'> = {
        caja_id: pagoZelle.cajaId,
        monto_usd: pagoZelle.montoUsd,
        tasa: pagoZelle.tasa,
        monto_bs: montoBs,
        nombre_cliente: pagoZelle.nombreCliente,
        telefono: pagoZelle.telefono,
        user_id: pagoZelle.userId,
        company_id: pagoZelle.companyId
      }

      const { data: pagoCreado, error: pagoError } = await this.supabase
        .from('pagos_zelle')
        .insert(nuevoPagoZelle)
        .select()
        .single()

      if (pagoError) return { data: null, error: pagoError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_zelle_usd: caja.total_zelle_usd + pagoZelle.montoUsd,
          total_zelle_bs: caja.total_zelle_bs + montoBs,
          cantidad_zelle: caja.cantidad_zelle + 1
        })
        .eq('id', pagoZelle.cajaId)

      if (updateError) {
        // Si falla la actualización, intentar eliminar el pago creado
        await this.supabase.from('pagos_zelle').delete().eq('id', pagoCreado.id)
        return { data: null, error: updateError }
      }

      return { data: this.mapPagoZelleFromDB(pagoCreado), error: null }
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

  // Actualizar pago Zelle
  async actualizarPagoZelle(pagoId: string, updates: Partial<Omit<PagoZelleUI, 'id' | 'fechaHora' | 'cajaId' | 'userId' | 'companyId' | 'montoBs'>>): Promise<{ data: PagoZelleUI | null, error: any }> {
    try {
      // Obtener el pago actual para calcular diferencia
      const { data: pagoActual, error: getError } = await this.supabase
        .from('pagos_zelle')
        .select('*, cajas!inner(estado, total_zelle_usd, total_zelle_bs)')
        .eq('id', pagoId)
        .single()

      if (getError || !pagoActual) {
        return { data: null, error: new Error('Pago no encontrado') }
      }

      if (pagoActual.cajas.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Preparar actualizaciones
      const dbUpdates: TablesUpdate<'pagos_zelle'> = {}
      let nuevoMontoBs = pagoActual.monto_bs

      if (updates.montoUsd !== undefined || updates.tasa !== undefined) {
        const montoUsd = updates.montoUsd ?? pagoActual.monto_usd
        const tasa = updates.tasa ?? pagoActual.tasa
        nuevoMontoBs = montoUsd * tasa
        
        if (updates.montoUsd !== undefined) dbUpdates.monto_usd = updates.montoUsd
        if (updates.tasa !== undefined) dbUpdates.tasa = updates.tasa
        dbUpdates.monto_bs = nuevoMontoBs
      }

      if (updates.nombreCliente !== undefined) dbUpdates.nombre_cliente = updates.nombreCliente
      if (updates.telefono !== undefined) dbUpdates.telefono = updates.telefono

      // Actualizar el pago
      const { data: pagoActualizado, error: updateError } = await this.supabase
        .from('pagos_zelle')
        .update(dbUpdates)
        .eq('id', pagoId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Si se actualizó el monto, actualizar totales en la caja
      if (updates.montoUsd !== undefined || updates.tasa !== undefined) {
        const diferenciaUsd = (updates.montoUsd ?? pagoActual.monto_usd) - pagoActual.monto_usd
        const diferenciaBs = nuevoMontoBs - pagoActual.monto_bs
        
        const { error: cajaUpdateError } = await this.supabase
          .from('cajas')
          .update({
            total_zelle_usd: pagoActual.cajas.total_zelle_usd + diferenciaUsd,
            total_zelle_bs: pagoActual.cajas.total_zelle_bs + diferenciaBs
          })
          .eq('id', pagoActual.caja_id)

        if (cajaUpdateError) {
          // Revertir el cambio en el pago
          await this.supabase
            .from('pagos_zelle')
            .update({ 
              monto_usd: pagoActual.monto_usd,
              tasa: pagoActual.tasa,
              monto_bs: pagoActual.monto_bs
            })
            .eq('id', pagoId)
          return { data: null, error: cajaUpdateError }
        }
      }

      return { data: this.mapPagoZelleFromDB(pagoActualizado), error: null }
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

  // Eliminar pago Zelle
  async eliminarPagoZelle(pagoId: string): Promise<{ error: any }> {
    try {
      // Obtener el pago para actualizar totales
      const { data: pago, error: getError } = await this.supabase
        .from('pagos_zelle')
        .select('*, cajas!inner(estado, total_zelle_usd, total_zelle_bs, cantidad_zelle)')
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
        .from('pagos_zelle')
        .delete()
        .eq('id', pagoId)

      if (deleteError) return { error: deleteError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_zelle_usd: pago.cajas.total_zelle_usd - pago.monto_usd,
          total_zelle_bs: pago.cajas.total_zelle_bs - pago.monto_bs,
          cantidad_zelle: pago.cajas.cantidad_zelle - 1
        })
        .eq('id', pago.caja_id)

      return { error: updateError }
    } catch (error) {
      return { error }
    }
  }

  // Actualizar tasa del día
  async actualizarTasaDia(cajaId: string, nuevaTasa: number): Promise<{ error: any }> {
    try {
      const { error } = await this.supabase
        .from('cajas')
        .update({ tasa_dia: nuevaTasa })
        .eq('id', cajaId)
        .eq('estado', 'abierta') // Solo actualizar si está abierta

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Agregar nota de crédito de caja
  async agregarNotaCreditoCaja(notaCredito: Omit<NotaCreditoCajaUI, 'id' | 'fechaHora'>): Promise<{ data: NotaCreditoCajaUI | null, error: any }> {
    try {
      // Verificar que la caja esté abierta
      const { data: caja, error: cajaError } = await this.supabase
        .from('cajas')
        .select('estado, total_notas_credito, cantidad_notas_credito')
        .eq('id', notaCredito.cajaId)
        .single()

      if (cajaError || !caja) {
        return { data: null, error: new Error('Caja no encontrada') }
      }

      if (caja.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar que el número de nota de crédito sea numérico
      if (!/^\d+$/.test(notaCredito.numeroNotaCredito)) {
        return { data: null, error: new Error('El número de nota de crédito debe contener solo números') }
      }

      // Validar que la factura afectada sea numérica
      if (!/^\d+$/.test(notaCredito.facturaAfectada)) {
        return { data: null, error: new Error('El número de factura afectada debe contener solo números') }
      }

      // Insertar la nota de crédito
      const nuevaNotaCredito: TablesInsert<'notas_credito_caja'> = {
        caja_id: notaCredito.cajaId,
        numero_nota_credito: notaCredito.numeroNotaCredito,
        factura_afectada: notaCredito.facturaAfectada,
        monto_bs: notaCredito.montoBs,
        nombre_cliente: notaCredito.nombreCliente,
        explicacion: notaCredito.explicacion,
        user_id: notaCredito.userId,
        company_id: notaCredito.companyId
      }

      const { data: notaCreada, error: notaError } = await this.supabase
        .from('notas_credito_caja')
        .insert(nuevaNotaCredito)
        .select()
        .single()

      if (notaError) return { data: null, error: notaError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_notas_credito: caja.total_notas_credito + notaCredito.montoBs,
          cantidad_notas_credito: caja.cantidad_notas_credito + 1
        })
        .eq('id', notaCredito.cajaId)

      if (updateError) {
        // Si falla la actualización, intentar eliminar la nota creada
        await this.supabase.from('notas_credito_caja').delete().eq('id', notaCreada.id)
        return { data: null, error: updateError }
      }

      return { data: this.mapNotaCreditoCajaFromDB(notaCreada), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar nota de crédito de caja
  async actualizarNotaCreditoCaja(notaId: string, updates: Partial<Omit<NotaCreditoCajaUI, 'id' | 'fechaHora' | 'cajaId' | 'userId' | 'companyId'>>): Promise<{ data: NotaCreditoCajaUI | null, error: any }> {
    try {
      // Obtener la nota actual para calcular diferencia
      const { data: notaActual, error: getError } = await this.supabase
        .from('notas_credito_caja')
        .select('*, cajas!inner(estado, total_notas_credito)')
        .eq('id', notaId)
        .single()

      if (getError || !notaActual) {
        return { data: null, error: new Error('Nota de crédito no encontrada') }
      }

      if (notaActual.cajas.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar números si se están actualizando
      if (updates.numeroNotaCredito && !/^\d+$/.test(updates.numeroNotaCredito)) {
        return { data: null, error: new Error('El número de nota de crédito debe contener solo números') }
      }
      
      if (updates.facturaAfectada && !/^\d+$/.test(updates.facturaAfectada)) {
        return { data: null, error: new Error('El número de factura afectada debe contener solo números') }
      }

      // Preparar actualizaciones
      const dbUpdates: TablesUpdate<'notas_credito_caja'> = {}
      if (updates.numeroNotaCredito !== undefined) dbUpdates.numero_nota_credito = updates.numeroNotaCredito
      if (updates.facturaAfectada !== undefined) dbUpdates.factura_afectada = updates.facturaAfectada
      if (updates.montoBs !== undefined) dbUpdates.monto_bs = updates.montoBs
      if (updates.nombreCliente !== undefined) dbUpdates.nombre_cliente = updates.nombreCliente
      if (updates.explicacion !== undefined) dbUpdates.explicacion = updates.explicacion

      // Actualizar la nota
      const { data: notaActualizada, error: updateError } = await this.supabase
        .from('notas_credito_caja')
        .update(dbUpdates)
        .eq('id', notaId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Si se actualizó el monto, actualizar totales en la caja
      if (updates.montoBs !== undefined && updates.montoBs !== notaActual.monto_bs) {
        const diferencia = updates.montoBs - notaActual.monto_bs
        
        const { error: cajaUpdateError } = await this.supabase
          .from('cajas')
          .update({
            total_notas_credito: notaActual.cajas.total_notas_credito + diferencia
          })
          .eq('id', notaActual.caja_id)

        if (cajaUpdateError) {
          // Revertir el cambio en la nota
          await this.supabase
            .from('notas_credito_caja')
            .update({ monto_bs: notaActual.monto_bs })
            .eq('id', notaId)
          return { data: null, error: cajaUpdateError }
        }
      }

      return { data: this.mapNotaCreditoCajaFromDB(notaActualizada), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Eliminar nota de crédito de caja
  async eliminarNotaCreditoCaja(notaId: string): Promise<{ error: any }> {
    try {
      // Obtener la nota para actualizar totales
      const { data: nota, error: getError } = await this.supabase
        .from('notas_credito_caja')
        .select('*, cajas!inner(estado, total_notas_credito, cantidad_notas_credito)')
        .eq('id', notaId)
        .single()

      if (getError || !nota) {
        return { error: new Error('Nota de crédito no encontrada') }
      }

      if (nota.cajas.estado !== 'abierta') {
        return { error: new Error('La caja está cerrada') }
      }

      // Eliminar la nota
      const { error: deleteError } = await this.supabase
        .from('notas_credito_caja')
        .delete()
        .eq('id', notaId)

      if (deleteError) return { error: deleteError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_notas_credito: nota.cajas.total_notas_credito - nota.monto_bs,
          cantidad_notas_credito: nota.cajas.cantidad_notas_credito - 1
        })
        .eq('id', nota.caja_id)

      return { error: updateError }
    } catch (error) {
      return { error }
    }
  }

  // Agregar crédito de caja
  async agregarCreditoCaja(credito: Omit<CreditoCajaUI, 'id' | 'fechaHora' | 'montoUsd' | 'tasa' | 'estado'>): Promise<{ data: CreditoCajaUI | null, error: any }> {
    try {
      // Verificar que la caja esté abierta y obtener la tasa
      const { data: caja, error: cajaError } = await this.supabase
        .from('cajas')
        .select('estado, tasa_dia, total_creditos_bs, total_creditos_usd, cantidad_creditos')
        .eq('id', credito.cajaId)
        .single()

      if (cajaError || !caja) {
        return { data: null, error: new Error('Caja no encontrada') }
      }

      if (caja.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar que el número de factura sea numérico
      if (!/^\d+$/.test(credito.numeroFactura)) {
        return { data: null, error: new Error('El número de factura debe contener solo números') }
      }

      // Verificar que no exista otra factura con el mismo número
      const { data: facturaExistente, error: verificarError } = await this.supabase
        .from('creditos_caja')
        .select('id')
        .eq('numero_factura', credito.numeroFactura)
        .eq('company_id', credito.companyId)
        .single()

      if (facturaExistente) {
        return { data: null, error: new Error('Ya existe una factura con ese número') }
      }

      // Calcular monto en USD usando la tasa del día
      const montoUsd = parseFloat((credito.montoBs / caja.tasa_dia).toFixed(2))

      // Insertar el crédito
      const nuevoCredito: TablesInsert<'creditos_caja'> = {
        caja_id: credito.cajaId,
        cliente_id: credito.clienteId || null,
        numero_factura: credito.numeroFactura,
        nombre_cliente: credito.nombreCliente,
        telefono_cliente: credito.telefonoCliente,
        monto_bs: credito.montoBs,
        monto_usd: montoUsd,
        tasa: caja.tasa_dia,
        estado: 'pendiente',
        user_id: credito.userId,
        company_id: credito.companyId
      }

      const { data: creditoCreado, error: creditoError } = await this.supabase
        .from('creditos_caja')
        .insert(nuevoCredito)
        .select(`
          *,
          cliente:cliente_id (
            id,
            tipo_documento,
            numero_documento,
            nombre,
            telefono,
            direccion
          )
        `)
        .single()

      if (creditoError) return { data: null, error: creditoError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_creditos_bs: caja.total_creditos_bs + credito.montoBs,
          total_creditos_usd: caja.total_creditos_usd + montoUsd,
          cantidad_creditos: caja.cantidad_creditos + 1
        })
        .eq('id', credito.cajaId)

      if (updateError) {
        // Si falla la actualización, intentar eliminar el crédito creado
        await this.supabase.from('creditos_caja').delete().eq('id', creditoCreado.id)
        return { data: null, error: updateError }
      }

      return { data: this.mapCreditoCajaFromDB(creditoCreado), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar crédito de caja
  async actualizarCreditoCaja(creditoId: string, updates: Partial<Omit<CreditoCajaUI, 'id' | 'fechaHora' | 'cajaId' | 'userId' | 'companyId' | 'montoUsd' | 'tasa' | 'estado'>>): Promise<{ data: CreditoCajaUI | null, error: any }> {
    try {
      // Obtener el crédito actual para calcular diferencia
      const { data: creditoActual, error: getError } = await this.supabase
        .from('creditos_caja')
        .select('*, cajas!inner(estado, total_creditos_bs, total_creditos_usd, tasa_dia)')
        .eq('id', creditoId)
        .single()

      if (getError || !creditoActual) {
        return { data: null, error: new Error('Crédito no encontrado') }
      }

      if (creditoActual.cajas.estado !== 'abierta') {
        return { data: null, error: new Error('La caja está cerrada') }
      }

      // Validar número de factura si se está actualizando
      if (updates.numeroFactura && !/^\d+$/.test(updates.numeroFactura)) {
        return { data: null, error: new Error('El número de factura debe contener solo números') }
      }

      // Si se actualiza el número de factura, verificar que no exista
      if (updates.numeroFactura && updates.numeroFactura !== creditoActual.numero_factura) {
        const { data: facturaExistente } = await this.supabase
          .from('creditos_caja')
          .select('id')
          .eq('numero_factura', updates.numeroFactura)
          .eq('company_id', creditoActual.company_id)
          .neq('id', creditoId)
          .single()

        if (facturaExistente) {
          return { data: null, error: new Error('Ya existe una factura con ese número') }
        }
      }

      // Preparar actualizaciones
      const dbUpdates: TablesUpdate<'creditos_caja'> = {}
      let nuevoMontoUsd = creditoActual.monto_usd

      if (updates.numeroFactura !== undefined) dbUpdates.numero_factura = updates.numeroFactura
      if (updates.nombreCliente !== undefined) dbUpdates.nombre_cliente = updates.nombreCliente
      if (updates.telefonoCliente !== undefined) dbUpdates.telefono_cliente = updates.telefonoCliente
      
      if (updates.montoBs !== undefined) {
        dbUpdates.monto_bs = updates.montoBs
        nuevoMontoUsd = parseFloat((updates.montoBs / creditoActual.cajas.tasa_dia).toFixed(2))
        dbUpdates.monto_usd = nuevoMontoUsd
      }

      // Actualizar el crédito
      const { data: creditoActualizado, error: updateError } = await this.supabase
        .from('creditos_caja')
        .update(dbUpdates)
        .eq('id', creditoId)
        .select()
        .single()

      if (updateError) return { data: null, error: updateError }

      // Si se actualizó el monto, actualizar totales en la caja
      if (updates.montoBs !== undefined && updates.montoBs !== creditoActual.monto_bs) {
        const diferenciaBs = updates.montoBs - creditoActual.monto_bs
        const diferenciaUsd = nuevoMontoUsd - creditoActual.monto_usd
        
        const { error: cajaUpdateError } = await this.supabase
          .from('cajas')
          .update({
            total_creditos_bs: creditoActual.cajas.total_creditos_bs + diferenciaBs,
            total_creditos_usd: creditoActual.cajas.total_creditos_usd + diferenciaUsd
          })
          .eq('id', creditoActual.caja_id)

        if (cajaUpdateError) {
          // Revertir el cambio en el crédito
          await this.supabase
            .from('creditos_caja')
            .update({ monto_bs: creditoActual.monto_bs, monto_usd: creditoActual.monto_usd })
            .eq('id', creditoId)
          return { data: null, error: cajaUpdateError }
        }
      }

      return { data: this.mapCreditoCajaFromDB(creditoActualizado), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Eliminar crédito de caja
  async eliminarCreditoCaja(creditoId: string): Promise<{ error: any }> {
    try {
      // Obtener el crédito para actualizar totales
      const { data: credito, error: getError } = await this.supabase
        .from('creditos_caja')
        .select('*, cajas!inner(estado, total_creditos_bs, total_creditos_usd, cantidad_creditos)')
        .eq('id', creditoId)
        .single()

      if (getError || !credito) {
        return { error: new Error('Crédito no encontrado') }
      }

      if (credito.cajas.estado !== 'abierta') {
        return { error: new Error('La caja está cerrada') }
      }

      // Eliminar el crédito
      const { error: deleteError } = await this.supabase
        .from('creditos_caja')
        .delete()
        .eq('id', creditoId)

      if (deleteError) return { error: deleteError }

      // Actualizar totales en la caja
      const { error: updateError } = await this.supabase
        .from('cajas')
        .update({
          total_creditos_bs: credito.cajas.total_creditos_bs - credito.monto_bs,
          total_creditos_usd: credito.cajas.total_creditos_usd - credito.monto_usd,
          cantidad_creditos: credito.cajas.cantidad_creditos - 1
        })
        .eq('id', credito.caja_id)

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
        pagosZelle: caja.pagosZelle || [],
        notasCredito: caja.notasCredito || [],
        creditos: caja.creditos || [],
        totales: {
          cantidadPagosMovil: caja.cantidadPagosMovil,
          montoTotalMovil: caja.totalPagosMovil,
          cantidadZelle: caja.cantidadZelle,
          montoTotalZelleUsd: caja.totalZelleUsd,
          montoTotalZelleBs: caja.totalZelleBs,
          cantidadNotasCredito: caja.cantidadNotasCredito,
          montoTotalNotasCredito: caja.totalNotasCredito,
          cantidadCreditos: caja.cantidadCreditos,
          montoTotalCreditosBs: caja.totalCreditosBs,
          montoTotalCreditosUsd: caja.totalCreditosUsd,
          montoTotalGeneral: caja.totalPagosMovil + caja.totalZelleBs + caja.totalNotasCredito + caja.totalCreditosBs,
          montoTotalGeneralUsd: caja.totalZelleUsd + caja.totalCreditosUsd
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
          total_zelle_usd,
          total_zelle_bs,
          cantidad_zelle,
          total_notas_credito,
          cantidad_notas_credito,
          total_creditos_bs,
          total_creditos_usd,
          cantidad_creditos
        `)
        .eq('company_id', companyId)
        .gte('fecha', format(fechaInicio, 'yyyy-MM-dd'))
        .order('fecha', { ascending: false })

      if (error) return { data: null, error }

      const resumen = {
        totalCajas: data?.length || 0,
        cajasAbiertas: data?.filter(c => c.estado === 'abierta').length || 0,
        totalPagosMovil: data?.reduce((sum, c) => sum + c.total_pagos_movil, 0) || 0,
        totalCantidadPagosMovil: data?.reduce((sum, c) => sum + c.cantidad_pagos_movil, 0) || 0,
        totalZelleUsd: data?.reduce((sum, c) => sum + c.total_zelle_usd, 0) || 0,
        totalZelleBs: data?.reduce((sum, c) => sum + c.total_zelle_bs, 0) || 0,
        totalCantidadZelle: data?.reduce((sum, c) => sum + c.cantidad_zelle, 0) || 0,
        totalNotasCredito: data?.reduce((sum, c) => sum + c.total_notas_credito, 0) || 0,
        totalCantidadNotasCredito: data?.reduce((sum, c) => sum + c.cantidad_notas_credito, 0) || 0,
        totalCreditosBs: data?.reduce((sum, c) => sum + c.total_creditos_bs, 0) || 0,
        totalCreditosUsd: data?.reduce((sum, c) => sum + c.total_creditos_usd, 0) || 0,
        totalCantidadCreditos: data?.reduce((sum, c) => sum + c.cantidad_creditos, 0) || 0,
        montoTotalGeneral: data?.reduce((sum, c) => sum + c.total_pagos_movil + c.total_zelle_bs + c.total_notas_credito + c.total_creditos_bs, 0) || 0,
        montoTotalGeneralUsd: data?.reduce((sum, c) => sum + c.total_zelle_usd + c.total_creditos_usd, 0) || 0,
        cajasPorDia: data || []
      }

      return { data: resumen, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }
}

export const cajaService = new CajaService()