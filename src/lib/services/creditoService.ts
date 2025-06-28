// src/lib/services/creditoService.ts
import { createClient } from '@/utils/supabase/client'
import { CreditoDetalladoUI, AbonoUI, FiltrosCredito, ResumenCreditos } from '@/types/creditos'
import { TablesInsert, Cliente } from '@/types/database'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

export class CreditoService {
  private supabase = createClient()

  // Mapear crédito de DB a UI
  private mapCreditoFromDB(creditoDB: Record<string, unknown>): CreditoDetalladoUI {
    const clienteData = creditoDB.cliente && typeof creditoDB.cliente === 'object' && creditoDB.cliente !== null 
      ? creditoDB.cliente as Record<string, unknown>
      : null

    return {
      id: typeof creditoDB.id === 'string' ? creditoDB.id : '',
      cajaId: typeof creditoDB.caja_id === 'string' ? creditoDB.caja_id : '',
      clienteId: typeof creditoDB.cliente_id === 'string' ? creditoDB.cliente_id : null,
      cliente: clienteData ? {
        id: typeof clienteData.id === 'string' ? clienteData.id : '',
        tipoDocumento: (typeof clienteData.tipo_documento === 'string' && ['V', 'E', 'J', 'G', 'P'].includes(clienteData.tipo_documento)) 
          ? clienteData.tipo_documento as 'V' | 'E' | 'J' | 'G' | 'P'
          : 'V',
        numeroDocumento: typeof clienteData.numero_documento === 'string' ? clienteData.numero_documento : '',
        nombre: typeof clienteData.nombre === 'string' ? clienteData.nombre : '',
        telefono: typeof clienteData.telefono === 'string' ? clienteData.telefono : null,
        direccion: typeof clienteData.direccion === 'string' ? clienteData.direccion : null
      } : undefined,
      numeroFactura: typeof creditoDB.numero_factura === 'string' ? creditoDB.numero_factura : '',
      nombreCliente: typeof creditoDB.nombre_cliente === 'string' ? creditoDB.nombre_cliente : '',
      telefonoCliente: typeof creditoDB.telefono_cliente === 'string' ? creditoDB.telefono_cliente : '',
      montoBs: typeof creditoDB.monto_bs === 'number' ? creditoDB.monto_bs : 0,
      montoUsd: typeof creditoDB.monto_usd === 'number' ? creditoDB.monto_usd : 0,
      tasa: typeof creditoDB.tasa === 'number' ? creditoDB.tasa : 1,
      estado: (typeof creditoDB.estado === 'string' && ['pendiente', 'pagado'].includes(creditoDB.estado))
        ? creditoDB.estado as 'pendiente' | 'pagado'
        : 'pendiente',
      fechaHora: creditoDB.fecha_hora ? new Date(creditoDB.fecha_hora as string | number | Date) : new Date(),
      fechaVencimiento: creditoDB.fecha_vencimiento ? new Date(creditoDB.fecha_vencimiento as string | number | Date) : null,
      montoAbonado: typeof creditoDB.monto_abonado === 'number' ? creditoDB.monto_abonado : 0,
      fechaUltimoPago: creditoDB.fecha_ultimo_pago ? new Date(creditoDB.fecha_ultimo_pago as string | number | Date) : null,
      observaciones: typeof creditoDB.observaciones === 'string' ? creditoDB.observaciones : null,
      userId: typeof creditoDB.user_id === 'string' ? creditoDB.user_id : '',
      companyId: typeof creditoDB.company_id === 'string' ? creditoDB.company_id : '',
      saldoPendiente: (typeof creditoDB.monto_bs === 'number' ? creditoDB.monto_bs : 0) - (typeof creditoDB.monto_abonado === 'number' ? creditoDB.monto_abonado : 0),
      estadoVencimiento: this.calcularEstadoVencimiento(creditoDB),
      cantidadAbonos: typeof creditoDB.cantidad_abonos === 'number' ? creditoDB.cantidad_abonos : 0,
      usuario: creditoDB.usuario as undefined,
      empresa: creditoDB.empresa as undefined,
      abonos: Array.isArray(creditoDB.abonos_credito) ? creditoDB.abonos_credito.map((a: unknown) => this.mapAbonoFromDB(a)) : []
    }
  }

  // Mapear abono de DB a UI
  private mapAbonoFromDB(abonoDB: unknown): AbonoUI {
    const abonoData = abonoDB as Record<string, unknown>
    const bancoData = abonoData.banco && typeof abonoData.banco === 'object' && abonoData.banco !== null 
      ? abonoData.banco as Record<string, unknown>
      : null

    return {
      id: typeof abonoData.id === 'string' ? abonoData.id : undefined,
      creditoId: typeof abonoData.credito_id === 'string' ? abonoData.credito_id : '',
      montoBs: typeof abonoData.monto_bs === 'number' ? abonoData.monto_bs : 0,
      montoUsd: typeof abonoData.monto_usd === 'number' ? abonoData.monto_usd : 0,
      tasa: typeof abonoData.tasa === 'number' ? abonoData.tasa : 1,
      metodoPago: (typeof abonoData.metodo_pago === 'string' && 
        ['efectivo', 'transferencia', 'pago_movil', 'zelle', 'punto_venta', 'deposito'].includes(abonoData.metodo_pago))
        ? abonoData.metodo_pago as 'efectivo' | 'transferencia' | 'pago_movil' | 'zelle' | 'punto_venta' | 'deposito'
        : 'efectivo',
      referencia: typeof abonoData.referencia === 'string' ? abonoData.referencia : null,
      bancoId: typeof abonoData.banco_id === 'string' ? abonoData.banco_id : null,
      banco: bancoData ? {
        id: typeof bancoData.id === 'string' ? bancoData.id : '',
        nombre: typeof bancoData.nombre === 'string' ? bancoData.nombre : '',
        codigo: typeof bancoData.codigo === 'string' ? bancoData.codigo : ''
      } : undefined,
      fechaPago: abonoData.fecha_pago ? new Date(abonoData.fecha_pago as string | number | Date) : new Date(),
      observaciones: typeof abonoData.observaciones === 'string' ? abonoData.observaciones : null,
      userId: typeof abonoData.user_id === 'string' ? abonoData.user_id : '',
      companyId: typeof abonoData.company_id === 'string' ? abonoData.company_id : '',
      usuario: undefined
    }
  }

  // Calcular estado de vencimiento
  private calcularEstadoVencimiento(credito: Record<string, unknown>): 'Pagado' | 'Vencido' | 'Por vencer' | 'Vigente' {
    if (credito.estado === 'pagado') return 'Pagado'
    if (!credito.fecha_vencimiento) return 'Vigente'
    
    const hoy = new Date()
    const vencimiento = new Date(credito.fecha_vencimiento as string | number | Date)
    const diasDiferencia = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasDiferencia < 0) return 'Vencido'
    if (diasDiferencia <= 7) return 'Por vencer'
    return 'Vigente'
  }

  // Obtener créditos con filtros
  async getCreditos(filtros?: FiltrosCredito): Promise<{ data: CreditoDetalladoUI[] | null, error: unknown }> {
    try {
      let query = this.supabase
        .from('creditos_caja')
        .select(`
          *,
          cliente:cliente_id (
            id,
            tipo_documento,
            numero_documento,
            nombre,
            telefono,
            direccion
          ),
          empresa:company_id (
            id,
            name,
            rif
          ),
          abonos_credito!credito_id (
            *,
            banco:banco_id (
              id,
              nombre,
              codigo
            )
          )
        `)
        .order('fecha_hora', { ascending: false })

      // Aplicar filtros
      if (filtros?.companyId) {
        query = query.eq('company_id', filtros.companyId)
      }

      if (filtros?.fechaDesde) {
        query = query.gte('fecha_hora', filtros.fechaDesde.toISOString())
      }

      if (filtros?.fechaHasta) {
        const fechaHasta = new Date(filtros.fechaHasta)
        fechaHasta.setHours(23, 59, 59, 999)
        query = query.lte('fecha_hora', fechaHasta.toISOString())
      }

      if (filtros?.clienteId) {
        query = query.eq('cliente_id', filtros.clienteId)
      }

      if (filtros?.estado && filtros.estado !== 'todos') {
        query = query.eq('estado', filtros.estado)
      }

      if (filtros?.numeroFactura) {
        query = query.ilike('numero_factura', `%${filtros.numeroFactura}%`)
      }

      const { data, error } = await query

      if (error) return { data: null, error }

      // Mapear y filtrar por estado de vencimiento si es necesario
      let creditos = data?.map(c => this.mapCreditoFromDB(c)) || []
      
      if (filtros?.estadoVencimiento && filtros.estadoVencimiento !== 'todos') {
        const estadoMap = {
          'vencido': 'Vencido',
          'por_vencer': 'Por vencer',
          'vigente': 'Vigente'
        }
        creditos = creditos.filter(c => c.estadoVencimiento === estadoMap[filtros.estadoVencimiento as keyof typeof estadoMap])
      }

      // Obtener información de usuarios para los créditos
      if (creditos.length > 0) {
        const userIds = [...new Set(creditos.map(c => c.userId))]
        const { data: usuarios, error: usersError } = await this.supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds)
        
        if (!usersError && usuarios) {
          const usersMap = new Map(usuarios.map(u => [u.id, u]))
          creditos = creditos.map(credito => ({
            ...credito,
            usuario: usersMap.get(credito.userId)
          }))
        }
      }

      return { data: creditos, error: null }
    } catch (err) {
      console.error('Error getting creditos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener créditos') }
    }
  }

  // Obtener un crédito por ID
  async getCredito(id: string): Promise<{ data: CreditoDetalladoUI | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('creditos_caja')
        .select(`
          *,
          cliente:cliente_id (
            id,
            tipo_documento,
            numero_documento,
            nombre,
            telefono,
            direccion
          ),
          empresa:company_id (
            id,
            name,
            rif
          ),
          abonos_credito!credito_id (
            *,
            banco:banco_id (
              id,
              nombre,
              codigo
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) return { data: null, error }

      // Obtener información del usuario
      const { data: usuario } = await this.supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', data.user_id)
        .single()

      const creditoMapped = this.mapCreditoFromDB(data)
      creditoMapped.usuario = usuario || undefined

      return { data: creditoMapped, error: null }
    } catch (err) {
      console.error('Error getting credito:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener crédito') }
    }
  }

  // Actualizar crédito
  async actualizarCredito(id: string, updates: {
    estado?: 'pendiente' | 'pagado'
    fechaVencimiento?: Date | null
    observaciones?: string
  }): Promise<{ data: CreditoDetalladoUI | null, error: unknown }> {
    try {
      const dbUpdates: Record<string, unknown> = {}
      
      if (updates.estado !== undefined) {
        dbUpdates.estado = updates.estado
      }
      
      if (updates.fechaVencimiento !== undefined) {
        dbUpdates.fecha_vencimiento = updates.fechaVencimiento ? updates.fechaVencimiento.toISOString() : null
      }
      
      if (updates.observaciones !== undefined) {
        dbUpdates.observaciones = updates.observaciones || null
      }

      const { error } = await this.supabase
        .from('creditos_caja')
        .update(dbUpdates)
        .eq('id', id)

      if (error) return { data: null, error }

      return await this.getCredito(id)
    } catch (err) {
      console.error('Error updating credito:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar crédito') }
    }
  }

  // Registrar abono
  async registrarAbono(abono: Omit<AbonoUI, 'id' | 'usuario'>): Promise<{ data: AbonoUI | null, error: unknown }> {
    try {
      const nuevoAbono: TablesInsert<'abonos_credito'> = {
        credito_id: abono.creditoId,
        monto_bs: abono.montoBs,
        monto_usd: abono.montoUsd,
        tasa: abono.tasa,
        metodo_pago: abono.metodoPago,
        referencia: abono.referencia || null,
        banco_id: abono.bancoId || null,
        observaciones: abono.observaciones || null,
        fecha_pago: abono.fechaPago.toISOString(),
        user_id: abono.userId,
        company_id: abono.companyId
      }

      const { data, error } = await this.supabase
        .from('abonos_credito')
        .insert(nuevoAbono)
        .select(`
          *,
          banco:banco_id (
            id,
            nombre,
            codigo
          ),
          usuario:user_id (
            id,
            full_name
          )
        `)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapAbonoFromDB(data), error: null }
    } catch (err) {
      console.error('Error registering abono:', err)
      return { data: null, error: handleServiceError(err, 'Error al registrar abono') }
    }
  }

  // Marcar crédito como pagado completamente
  async marcarComoPagado(id: string, observaciones?: string): Promise<{ error: unknown }> {
    try {
      const { data: credito, error: getError } = await this.supabase
        .from('creditos_caja')
        .select('monto_bs, monto_abonado')
        .eq('id', id)
        .single()

      if (getError) return { error: getError }

      const saldoPendiente = credito.monto_bs - (credito.monto_abonado || 0)
      
      if (saldoPendiente > 0) {
        return { error: handleServiceError(new Error('El crédito tiene saldo pendiente. Debe registrar el pago completo.'), 'Saldo pendiente') }
      }

      const { error } = await this.supabase
        .from('creditos_caja')
        .update({ 
          estado: 'pagado',
          observaciones: observaciones || null
        })
        .eq('id', id)

      return { error }
    } catch (err) {
      console.error('Error marking credito as paid:', err)
      return { error: handleServiceError(err, 'Error al marcar crédito como pagado') }
    }
  }

  // Obtener resumen de créditos
  async getResumenCreditos(companyId?: string): Promise<{ data: ResumenCreditos | null, error: unknown }> {
    try {
      let query = this.supabase
        .from('creditos_caja')
        .select('*')

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query

      if (error) return { data: null, error }

      const creditos = data || []
      const hoy = new Date()

      const resumen: ResumenCreditos = {
        totalCreditos: creditos.length,
        creditosPendientes: creditos.filter(c => c.estado === 'pendiente').length,
        creditosPagados: creditos.filter(c => c.estado === 'pagado').length,
        creditosVencidos: creditos.filter(c => {
          if (c.estado === 'pagado' || !c.fecha_vencimiento) return false
          return new Date(c.fecha_vencimiento) < hoy
        }).length,
        montoPendienteTotal: creditos
          .filter(c => c.estado === 'pendiente')
          .reduce((sum, c) => sum + (c.monto_bs - (c.monto_abonado || 0)), 0),
        montoAbonado: creditos.reduce((sum, c) => sum + (c.monto_abonado || 0), 0),
        clientesConCredito: new Set(creditos.map(c => c.cliente_id).filter(Boolean)).size
      }

      return { data: resumen, error: null }
    } catch (err) {
      console.error('Error getting resumen creditos:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener resumen de créditos') }
    }
  }

  // Obtener estado de cuenta de un cliente
  async getEstadoCuentaCliente(clienteId: string): Promise<{ 
    data: {
      cliente: Cliente,
      creditos: CreditoDetalladoUI[],
      totales: {
        totalCreditos: number,
        creditosPendientes: number,
        montoPendiente: number,
        montoAbonado: number
      }
    } | null, 
    error: unknown 
  }> {
    try {
      // Obtener datos del cliente
      const { data: cliente, error: clienteError } = await this.supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()

      if (clienteError) return { data: null, error: clienteError }

      // Obtener créditos del cliente
      const { data: creditos, error: creditosError } = await this.getCreditos({ clienteId })

      if (creditosError) return { data: null, error: creditosError }

      const creditosCliente = creditos || []
      const creditosPendientes = creditosCliente.filter(c => c.estado === 'pendiente')

      const totales = {
        totalCreditos: creditosCliente.length,
        creditosPendientes: creditosPendientes.length,
        montoPendiente: creditosPendientes.reduce((sum, c) => sum + c.saldoPendiente, 0),
        montoAbonado: creditosCliente.reduce((sum, c) => sum + c.montoAbonado, 0)
      }

      return {
        data: {
          cliente,
          creditos: creditosCliente,
          totales
        },
        error: null
      }
    } catch (err) {
      console.error('Error getting estado cuenta cliente:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener estado de cuenta del cliente') }
    }
  }
}

export const creditoService = new CreditoService()