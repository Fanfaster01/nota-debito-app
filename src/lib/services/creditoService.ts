// src/lib/services/creditoService.ts
import { createClient } from '@/utils/supabase/client'
import { CreditoDetalladoUI, AbonoUI, FiltrosCredito, ResumenCreditos } from '@/types/creditos'
import { TablesInsert } from '@/types/database'

export class CreditoService {
  private supabase = createClient()

  // Mapear crédito de DB a UI
  private mapCreditoFromDB(creditoDB: any): CreditoDetalladoUI {
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
      fechaVencimiento: creditoDB.fecha_vencimiento ? new Date(creditoDB.fecha_vencimiento) : null,
      montoAbonado: creditoDB.monto_abonado || 0,
      fechaUltimoPago: creditoDB.fecha_ultimo_pago ? new Date(creditoDB.fecha_ultimo_pago) : null,
      observaciones: creditoDB.observaciones,
      userId: creditoDB.user_id,
      companyId: creditoDB.company_id,
      saldoPendiente: creditoDB.monto_bs - (creditoDB.monto_abonado || 0),
      estadoVencimiento: this.calcularEstadoVencimiento(creditoDB),
      cantidadAbonos: creditoDB.cantidad_abonos || 0,
      usuario: creditoDB.usuario,
      empresa: creditoDB.empresa,
      abonos: creditoDB.abonos?.map((a: any) => this.mapAbonoFromDB(a))
    }
  }

  // Mapear abono de DB a UI
  private mapAbonoFromDB(abonoDB: any): AbonoUI {
    return {
      id: abonoDB.id,
      creditoId: abonoDB.credito_id,
      montoBs: abonoDB.monto_bs,
      montoUsd: abonoDB.monto_usd,
      tasa: abonoDB.tasa,
      metodoPago: abonoDB.metodo_pago,
      referencia: abonoDB.referencia,
      bancoId: abonoDB.banco_id,
      banco: abonoDB.banco,
      fechaPago: new Date(abonoDB.fecha_pago),
      observaciones: abonoDB.observaciones,
      userId: abonoDB.user_id,
      companyId: abonoDB.company_id,
      usuario: abonoDB.usuario
    }
  }

  // Calcular estado de vencimiento
  private calcularEstadoVencimiento(credito: any): 'Pagado' | 'Vencido' | 'Por vencer' | 'Vigente' {
    if (credito.estado === 'pagado') return 'Pagado'
    if (!credito.fecha_vencimiento) return 'Vigente'
    
    const hoy = new Date()
    const vencimiento = new Date(credito.fecha_vencimiento)
    const diasDiferencia = Math.floor((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diasDiferencia < 0) return 'Vencido'
    if (diasDiferencia <= 7) return 'Por vencer'
    return 'Vigente'
  }

  // Obtener créditos con filtros
  async getCreditos(filtros?: FiltrosCredito): Promise<{ data: CreditoDetalladoUI[] | null, error: any }> {
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
          usuario:user_id (
            id,
            full_name,
            email
          ),
          empresa:company_id (
            id,
            name,
            rif
          ),
          abonos:abonos_credito!credito_id (
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

      return { data: creditos, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener un crédito por ID
  async getCredito(id: string): Promise<{ data: CreditoDetalladoUI | null, error: any }> {
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
          usuario:user_id (
            id,
            full_name,
            email
          ),
          empresa:company_id (
            id,
            name,
            rif
          ),
          abonos:abonos_credito!credito_id (
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
          )
        `)
        .eq('id', id)
        .single()

      if (error) return { data: null, error }

      return { data: this.mapCreditoFromDB(data), error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Actualizar crédito
  async actualizarCredito(id: string, updates: {
    estado?: 'pendiente' | 'pagado'
    fechaVencimiento?: Date | null
    observaciones?: string
  }): Promise<{ data: CreditoDetalladoUI | null, error: any }> {
    try {
      const dbUpdates: any = {}
      
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
    } catch (error) {
      return { data: null, error }
    }
  }

  // Registrar abono
  async registrarAbono(abono: Omit<AbonoUI, 'id' | 'usuario'>): Promise<{ data: AbonoUI | null, error: any }> {
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
    } catch (error) {
      return { data: null, error }
    }
  }

  // Marcar crédito como pagado completamente
  async marcarComoPagado(id: string, observaciones?: string): Promise<{ error: any }> {
    try {
      const { data: credito, error: getError } = await this.supabase
        .from('creditos_caja')
        .select('monto_bs, monto_abonado')
        .eq('id', id)
        .single()

      if (getError) return { error: getError }

      const saldoPendiente = credito.monto_bs - (credito.monto_abonado || 0)
      
      if (saldoPendiente > 0) {
        return { error: new Error('El crédito tiene saldo pendiente. Debe registrar el pago completo.') }
      }

      const { error } = await this.supabase
        .from('creditos_caja')
        .update({ 
          estado: 'pagado',
          observaciones: observaciones || null
        })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error }
    }
  }

  // Obtener resumen de créditos
  async getResumenCreditos(companyId?: string): Promise<{ data: ResumenCreditos | null, error: any }> {
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
    } catch (error) {
      return { data: null, error }
    }
  }

  // Obtener estado de cuenta de un cliente
  async getEstadoCuentaCliente(clienteId: string): Promise<{ 
    data: {
      cliente: any,
      creditos: CreditoDetalladoUI[],
      totales: {
        totalCreditos: number,
        creditosPendientes: number,
        montoPendiente: number,
        montoAbonado: number
      }
    } | null, 
    error: any 
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
    } catch (error) {
      return { data: null, error }
    }
  }
}

export const creditoService = new CreditoService()