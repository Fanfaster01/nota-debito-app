// Servicio para el módulo de Cuentas por Pagar
import { createClient } from '@/utils/supabase/client-wrapper'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'
import { validate, assertValid } from '@/utils/validators'

const supabase = createClient()
import type {
  FacturaCuentaPorPagar,
  MetricasCuentasPorPagar,
  FiltrosCuentasPorPagar,
  PaginacionFacturas,
  ReciboPago,
  NotaDebitoGenerada,
  FormatoTxtBancario,
  ProveedorConBanco,
  TasaCambio,
  TasaCambioManual,
  GenerarReciboRequest,
  GenerarReciboResponse,
  DatosGraficoCuentasPorPagar,
  FormDataFactura,
  ValidacionPagoFacturas,
  EstadoPago,
  TipoPago
} from '@/types/cuentasPorPagar'

class CuentasPorPagarService {
  // ============================================================================
  // UTILIDADES INTERNAS PARA MANEJO DE ERRORES
  // ============================================================================

  /**
   * Validar companyId de manera consistente
   */
  private validateCompanyId(companyId: string): void {
    assertValid(validate.companyId(companyId))
  }

  /**
   * Manejar errores de Supabase de manera consistente
   */
  private handleSupabaseError(error: unknown, context: string): string {
    console.error(`Error en ${context}:`, error)
    return handleServiceError(error, `Error inesperado en ${context}`)
  }

  /**
   * Wrapper para operaciones async con manejo de errores consistente
   */
  private async safeExecute<T>(
    operation: () => Promise<T>,
    context: string,
    defaultValue: T
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const result = await operation()
      return { data: result, error: null }
    } catch (error) {
      const errorMessage = this.handleSupabaseError(error, context)
      return { data: defaultValue, error: errorMessage }
    }
  }

  // ============================================================================
  // GESTIÓN DE FACTURAS
  // ============================================================================

  /**
   * Obtener facturas con filtros y paginación
   */
  async getFacturas(
    companyId: string,
    filtros: FiltrosCuentasPorPagar = {},
    page = 1,
    limit = 20
  ): Promise<{ data: PaginacionFacturas | null; error: string | null }> {
    return this.safeExecute(async () => {
      this.validateCompanyId(companyId)
      
      const cleanCompanyId = companyId.trim()
      // DEBUG: console.log('Intentando consulta de facturas para company:', cleanCompanyId)
      
      // Intentar consulta con columnas extendidas
      let queryResult = await supabase
        .from('facturas')
        .select(`
          id,
          numero,
          numero_control,
          fecha,
          fecha_vencimiento,
          estado_pago,
          fecha_pago,
          notas_pago,
          tipo_pago,
          proveedor_nombre,
          proveedor_rif,
          proveedor_direccion,
          cliente_nombre,
          cliente_rif,
          cliente_direccion,
          sub_total,
          monto_exento,
          base_imponible,
          alicuota_iva,
          iva,
          total,
          tasa_cambio,
          monto_usd,
          porcentaje_retencion,
          retencion_iva,
          company_id,
          created_by,
          created_at,
          updated_at
        `, { count: 'exact' })
        .eq('company_id', cleanCompanyId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        // DEBUG: console.log('Columnas extendidas no disponibles, usando consulta básica')
        
        queryResult = await supabase
          .from('facturas')
          .select(`
            id,
            numero,
            numero_control,
            fecha,
            fecha_vencimiento,
            estado_pago,
            fecha_pago,
            notas_pago,
            tipo_pago,
            proveedor_nombre,
            proveedor_rif,
            proveedor_direccion,
            cliente_nombre,
            cliente_rif,
            cliente_direccion,
            sub_total,
            monto_exento,
            base_imponible,
            alicuota_iva,
            iva,
            total,
            tasa_cambio,
            monto_usd,
            porcentaje_retencion,
            retencion_iva,
            company_id,
            created_by,
            created_at,
            updated_at
          `, { count: 'exact' })
          .eq('company_id', cleanCompanyId)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)
      }
      
      const { data, error, count } = queryResult

      if (error) {
        throw error // El wrapper se encargará del manejo
      }

      const facturas: FacturaCuentaPorPagar[] = data?.map(this.mapToFacturaCuentaPorPagar) || []
      
      // Calcular días de vencimiento y monto final de forma simple
      const facturasConCalculos = facturas.map(factura => ({
        ...factura,
        diasVencimiento: factura.fechaVencimiento ? this.calcularDiasVencimiento(factura.fechaVencimiento) : undefined,
        montoFinalPagar: factura.total // Por ahora usar el total directamente
      }))

      const paginacion: PaginacionFacturas = {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        facturas: facturasConCalculos
      }

      // DEBUG: console.log('Facturas obtenidas:', paginacion.facturas.length)
      return paginacion
    }, 'getFacturas', null)
  }

  /**
   * Obtener múltiples facturas por IDs
   */
  async getFacturasByIds(ids: string[]): Promise<{ data: FacturaCuentaPorPagar[] | null; error: string | null }> {
    return this.safeExecute(async () => {
      if (!ids?.length) {
        throw new Error('Se requiere al menos un ID de factura')
      }
      
      // Validar cada ID
      ids.forEach(id => assertValid(validate.companyId(id), 'ID de factura'))

      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .in('id', ids)

      if (error) throw error

      return data?.map(this.mapToFacturaCuentaPorPagar) || []
    }, 'getFacturasByIds', null)
  }

  /**
   * Obtener una factura por ID
   */
  async getFacturaById(id: string): Promise<{ data: FacturaCuentaPorPagar | null; error: string | null }> {
    return this.safeExecute(async () => {
      assertValid(validate.companyId(id), 'ID de factura')

      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('id', id.trim())
        .single()

      if (error) throw error

      const factura = this.mapToFacturaCuentaPorPagar(data)
      factura.diasVencimiento = this.calcularDiasVencimiento(factura.fechaVencimiento)
      factura.montoFinalPagar = await this.calcularMontoFinalPagar(factura)

      return factura
    }, 'getFacturaById', null)
  }

  /**
   * Crear nueva factura
   */
  async createFactura(
    companyId: string,
    userId: string,
    datosFactura: FormDataFactura
  ): Promise<{ data: FacturaCuentaPorPagar | null; error: string | null }> {
    try {
      const facturaData = {
        numero: datosFactura.numero,
        numero_control: datosFactura.numeroControl,
        fecha: datosFactura.fecha,
        fecha_vencimiento: datosFactura.fechaVencimiento,
        proveedor_nombre: datosFactura.proveedorNombre,
        proveedor_rif: datosFactura.proveedorRif,
        proveedor_direccion: datosFactura.proveedorDireccion,
        cliente_nombre: datosFactura.clienteNombre,
        cliente_rif: datosFactura.clienteRif,
        cliente_direccion: datosFactura.clienteDireccion,
        sub_total: datosFactura.subTotal,
        monto_exento: datosFactura.montoExento,
        base_imponible: datosFactura.baseImponible,
        alicuota_iva: datosFactura.alicuotaIVA,
        iva: datosFactura.iva,
        total: datosFactura.total,
        tasa_cambio: datosFactura.tasaCambio,
        monto_usd: datosFactura.montoUSD,
        porcentaje_retencion: datosFactura.porcentajeRetencion,
        retencion_iva: datosFactura.retencionIVA,
        estado_pago: 'pendiente' as EstadoPago,
        tipo_pago: 'deposito' as TipoPago,
        company_id: companyId,
        created_by: userId
      }

      const { data, error } = await supabase
        .from('facturas')
        .insert(facturaData)
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      return { data: this.mapToFacturaCuentaPorPagar(data), error: null }
    } catch (err: unknown) {
      console.error('Error al crear factura:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear la factura') }
    }
  }

  /**
   * Actualizar factura
   */
  async updateFactura(
    id: string,
    updates: Partial<FormDataFactura>
  ): Promise<{ data: FacturaCuentaPorPagar | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: this.mapToFacturaCuentaPorPagar(data), error: null }
    } catch (err) {
      console.error('Error al actualizar factura:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar la factura') }
    }
  }

  /**
   * Actualizar estado de pago de una factura
   */
  async updateEstadoPago(
    id: string,
    estadoPago: EstadoPago,
    notas?: string
  ): Promise<{ data: boolean; error: string | null }> {
    try {
      const updates: Record<string, unknown> = {
        estado_pago: estadoPago,
        updated_at: new Date().toISOString()
      }

      if (estadoPago === 'pagada') {
        updates.fecha_pago = new Date().toISOString().split('T')[0]
      }

      if (notas) {
        updates.notas_pago = notas
      }

      const { error } = await supabase
        .from('facturas')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      return { data: true, error: null }
    } catch (err) {
      console.error('Error al actualizar estado de pago:', err)
      return { data: false, error: handleServiceError(err, 'Error al actualizar el estado de pago') }
    }
  }

  // ============================================================================
  // MÉTRICAS Y DASHBOARD
  // ============================================================================

  /**
   * Obtener métricas del dashboard
   */
  async getMetricas(companyId: string): Promise<{ data: MetricasCuentasPorPagar | null; error: string | null }> {
    return this.safeExecute(async () => {
      this.validateCompanyId(companyId)
      
      const cleanCompanyId = companyId.trim()
      
      // Intentar consulta con columnas extendidas
      let queryResult = await supabase
        .from('facturas')
        .select(`
          id,
          total,
          fecha,
          fecha_vencimiento,
          estado_pago,
          created_at
        `)
        .eq('company_id', cleanCompanyId)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        // DEBUG: console.log('Columnas extendidas no disponibles en métricas, usando consulta básica')
        
        queryResult = await supabase
          .from('facturas')
          .select(`
            id,
            total,
            fecha,
            fecha_vencimiento,
            estado_pago,
            created_at
          `)
          .eq('company_id', cleanCompanyId)
      }
      
      const { data: facturas, error } = queryResult

      if (error) {
        throw error // El wrapper se encargará del manejo
      }

      const hoy = new Date()
      const proximos7Dias = new Date()
      proximos7Dias.setDate(hoy.getDate() + 7)

      const metricas: MetricasCuentasPorPagar = {
        totalFacturas: facturas.length,
        totalMontoPendiente: 0,
        facturasVencidas: 0,
        montoVencido: 0,
        facturasPorVencer: 0,
        montoPorVencer: 0,
        facturasPagadas: 0,
        montoPagado: 0,
        facturasPendientesAprobacion: 0,
        montoPendienteAprobacion: 0
      }

      for (const factura of facturas) {
        const montoFinal = factura.total || 0
        const estadoPago = factura.estado_pago || 'pendiente'
        const fechaVencimiento = factura.fecha_vencimiento ? new Date(factura.fecha_vencimiento) : null
        
        switch (estadoPago) {
          case 'pendiente':
            metricas.totalMontoPendiente += montoFinal
            if (fechaVencimiento) {
              if (fechaVencimiento < hoy) {
                metricas.facturasVencidas++
                metricas.montoVencido += montoFinal
              } else if (fechaVencimiento <= proximos7Dias) {
                metricas.facturasPorVencer++
                metricas.montoPorVencer += montoFinal
              }
            }
            break
          case 'pagada':
            metricas.facturasPagadas++
            metricas.montoPagado += montoFinal
            break
          case 'pendiente_aprobacion':
            metricas.facturasPendientesAprobacion++
            metricas.montoPendienteAprobacion += montoFinal
            break
          case 'vencida':
            metricas.facturasVencidas++
            metricas.montoVencido += montoFinal
            metricas.totalMontoPendiente += montoFinal
            break
        }
      }

      return metricas
    }, 'getMetricas', null)
  }

  /**
   * Obtener datos para gráficos
   */
  async getDatosGraficos(companyId: string): Promise<{ data: DatosGraficoCuentasPorPagar | null; error: string | null }> {
    return this.safeExecute(async () => {
      this.validateCompanyId(companyId)
      
      const cleanCompanyId = companyId.trim()
      
      // Intentar consulta con columnas extendidas
      let queryResult = await supabase
        .from('facturas')
        .select(`
          id,
          total,
          fecha,
          fecha_vencimiento,
          estado_pago,
          proveedor_nombre,
          created_at
        `)
        .eq('company_id', cleanCompanyId)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        // DEBUG: console.log('Columnas extendidas no disponibles en gráficos, usando consulta básica')
        
        queryResult = await supabase
          .from('facturas')
          .select(`
            id,
            total,
            fecha,
            fecha_vencimiento,
            estado_pago,
            proveedor_nombre,
            created_at
          `)
          .eq('company_id', cleanCompanyId)
      }
      
      const { data: facturas, error } = queryResult

      if (error) throw error

      // Facturas por estado
      const facturasPorEstado = new Map()
      const vencimientosPorMes = new Map()
      const proveedoresDeuda = new Map()

      for (const factura of facturas) {
        const estado = factura.estado_pago || 'pendiente'
        const montoFinal = factura.total || 0

        // Por estado
        if (!facturasPorEstado.has(estado)) {
          facturasPorEstado.set(estado, { estado, cantidad: 0, monto: 0 })
        }
        const estadoData = facturasPorEstado.get(estado)
        estadoData.cantidad++
        estadoData.monto += montoFinal

        // Por mes - usar fecha_vencimiento si existe, sino fecha de creación
        const fechaParaMes = factura.fecha_vencimiento || factura.fecha
        if (fechaParaMes) {
          const mes = new Date(fechaParaMes).toISOString().substring(0, 7)
          if (!vencimientosPorMes.has(mes)) {
            vencimientosPorMes.set(mes, { mes, cantidad: 0, monto: 0 })
          }
          const mesData = vencimientosPorMes.get(mes)
          mesData.cantidad++
          mesData.monto += montoFinal
        }

        // Top proveedores con deuda
        if (estado === 'pendiente' || estado === 'vencida') {
          const proveedor = factura.proveedor_nombre
          if (!proveedoresDeuda.has(proveedor)) {
            proveedoresDeuda.set(proveedor, { proveedor, cantidad: 0, monto: 0 })
          }
          const proveedorData = proveedoresDeuda.get(proveedor)
          proveedorData.cantidad++
          proveedorData.monto += montoFinal
        }
      }

      const datos: DatosGraficoCuentasPorPagar = {
        facturasPorEstado: Array.from(facturasPorEstado.values()),
        vencimientosPorMes: Array.from(vencimientosPorMes.values()).slice(0, 12),
        topProveedoresDeuda: Array.from(proveedoresDeuda.values())
          .sort((a, b) => b.monto - a.monto)
          .slice(0, 10)
      }

      return datos
    }, 'getDatosGraficos', null)
  }

  // ============================================================================
  // GESTIÓN DE RECIBOS Y PAGOS
  // ============================================================================

  /**
   * Validar facturas para pago
   */
  async validarCuentasBancarias(facturasIds: string[]): Promise<{ 
    proveedoresSinCuenta: { rif: string; nombre: string }[], 
    error: string | null 
  }> {
    try {
      // Obtener facturas
      const { data: facturas, error } = await this.getFacturasByIds(facturasIds)
      if (error || !facturas) {
        return { proveedoresSinCuenta: [], error: 'Error obteniendo facturas' }
      }

      // Obtener proveedores únicos
      const rifsProveedores = Array.from(new Set(facturas.map((f: FacturaCuentaPorPagar) => f.proveedorRif)))
      const proveedoresSinCuenta: { rif: string; nombre: string }[] = []

      for (const rif of rifsProveedores) {
        // Obtener proveedor
        const { proveedorService } = await import('./proveedorService')
        const { data: proveedor } = await proveedorService.getProveedorByRif(rif)
        
        if (!proveedor) {
          proveedoresSinCuenta.push({ rif, nombre: 'Proveedor no encontrado' })
          continue
        }

        // Verificar cuenta favorita
        const { proveedorCuentasBancariasService } = await import('./proveedorCuentasBancariasService')
        const { data: cuentaFavorita } = await proveedorCuentasBancariasService.getCuentaFavorita(proveedor.id)
        
        if (!cuentaFavorita) {
          proveedoresSinCuenta.push({ rif, nombre: proveedor.nombre })
        }
      }

      return { proveedoresSinCuenta, error: null }
    } catch (err) {
      console.error('Error validando cuentas bancarias:', err)
      return { proveedoresSinCuenta: [], error: handleServiceError(err, 'Error validando cuentas bancarias') }
    }
  }

  async validarFacturasParaPago(facturasIds: string[]): Promise<{ data: ValidacionPagoFacturas | null; error: string | null }> {
    try {
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('*')
        .in('id', facturasIds)

      if (error) throw error

      const validacion: ValidacionPagoFacturas = {
        validas: [],
        invalidas: [],
        tiposPagoMezclados: false,
        proveedoresDiferentes: false,
        montoTotal: 0,
        requiereNotasDebito: false
      }

      const tiposPago = new Set<TipoPago>()
      const proveedores = new Set<string>()

      for (const facturaData of facturas) {
        const factura = this.mapToFacturaCuentaPorPagar(facturaData)

        // Validar estado
        if (factura.estadoPago === 'pagada') {
          validacion.invalidas.push({
            factura,
            motivo: 'La factura ya está pagada'
          })
          continue
        }

        // Verificar tipos de pago y proveedores
        tiposPago.add(factura.tipoPago)
        proveedores.add(factura.proveedorRif)

        validacion.validas.push(factura)
        validacion.montoTotal += await this.calcularMontoFinalPagar(factura)
      }

      validacion.tiposPagoMezclados = tiposPago.size > 1
      validacion.proveedoresDiferentes = proveedores.size > 1
      validacion.requiereNotasDebito = validacion.validas.some(f => f.tipoPago === 'deposito')

      return { data: validacion, error: null }
    } catch (err) {
      console.error('Error al validar facturas:', err)
      return { data: null, error: handleServiceError(err, 'Error al validar las facturas') }
    }
  }

  /**
   * Generar recibo de pago
   */
  async generarRecibo(
    companyId: string,
    userId: string,
    request: GenerarReciboRequest
  ): Promise<{ data: GenerarReciboResponse | null; error: string | null }> {
    try {
      // DEBUG: console.log('🚀 Iniciando generación de recibo:', { companyId, userId, request })
      
      // 1. Validar facturas
      // DEBUG: console.log('📋 Paso 1: Validando facturas...')
      const validacionResult = await this.validarFacturasParaPago(request.facturasIds)
      if (validacionResult.error || !validacionResult.data) {
        console.error('❌ Error en validación:', validacionResult.error)
        throw new Error(validacionResult.error || 'Error en validación')
      }

      const validacion = validacionResult.data
      if (validacion.invalidas.length > 0) {
        console.error('❌ Facturas inválidas:', validacion.invalidas)
        throw new Error(`Facturas inválidas: ${validacion.invalidas.map(i => i.motivo).join(', ')}`)
      }
      // DEBUG: console.log('✅ Validación exitosa, facturas válidas:', validacion.validas.length)

      // 2. Generar número de recibo
      // DEBUG: console.log('🔢 Paso 2: Generando número de recibo...')
      let numeroRecibo: string
      try {
        const { data, error } = await supabase
          .rpc('generate_numero_recibo', { p_company_id: companyId })

        if (error) {
          console.warn('⚠️ RPC function not available, generating number manually:', error)
          // Fallback: generar número manualmente
          const { data: maxRecibo, error: errorQuery } = await supabase
            .from('recibos_pago')
            .select('numero_recibo')
            .eq('company_id', companyId)
            .like('numero_recibo', 'REC-%')
            .order('numero_recibo', { ascending: false })
            .limit(1)
            .single()

          if (errorQuery && errorQuery.code !== 'PGRST116') { // PGRST116 is "no rows returned"
            console.error('❌ Error consultando recibos existentes:', errorQuery)
            throw new Error(`Error consultando recibos: ${errorQuery.message}`)
          }

          let nextNumber = 1
          if (maxRecibo?.numero_recibo) {
            const match = maxRecibo.numero_recibo.match(/REC-(\d+)/)
            if (match) {
              nextNumber = parseInt(match[1]) + 1
            }
          }
          numeroRecibo = `REC-${nextNumber.toString().padStart(5, '0')}`
          // DEBUG: console.log('✅ Número generado manualmente:', numeroRecibo)
        } else {
          numeroRecibo = data
          // DEBUG: console.log('✅ Número generado por RPC:', numeroRecibo)
        }
      } catch (err) {
        console.error('❌ Error generando número de recibo:', err)
        throw new Error('Error al generar número de recibo')
      }

      // 3. Generar notas de débito si es necesario
      // DEBUG: console.log('📄 Paso 3: Generando notas de débito...')
      const notasDebito: NotaDebitoGenerada[] = []
      if (request.tipoPago === 'deposito') {
        // DEBUG: console.log('💰 Tipo de pago es depósito, generando notas de débito...')
        for (const factura of validacion.validas) {
          try {
            const notaDebito = await this.generarNotaDebitoPorDiferencial(factura, userId)
            if (notaDebito) {
              notasDebito.push(notaDebito)
              // DEBUG: console.log('✅ Nota de débito generada para factura:', factura.numero)
            }
          } catch (error) {
            console.error('❌ Error generando nota de débito para factura:', factura.numero, error)
            throw new Error(`Error generando nota de débito para factura ${factura.numero}`)
          }
        }
      }
      // DEBUG: console.log('✅ Notas de débito generadas:', notasDebito.length)

      // 4. Crear recibo de pago
      // DEBUG: console.log('📝 Paso 4: Creando recibo de pago...')
      const reciboData = {
        numero_recibo: numeroRecibo,
        company_id: companyId,
        tipo_recibo: request.facturasIds.length > 1 ? 'lote' : 'individual',
        tipo_pago: request.tipoPago,
        facturas_ids: JSON.stringify(request.facturasIds),
        monto_total_bs: validacion.montoTotal,
        monto_total_usd: request.tipoPago === 'efectivo' ? validacion.validas.reduce((sum, f) => sum + f.montoUSD, 0) : null,
        banco_destino: request.bancoDestino,
        formato_txt_id: request.formatoTxtId,
        notas: request.notas,
        created_by: userId
      }

      // DEBUG: console.log('💾 Insertando recibo en la base de datos:', reciboData)
      
      // Validate user ID format
      assertValid(validate.userId(userId), 'Usuario ID')
      
      // Test table access
      try {
        const { data: testAccess, error: accessError } = await supabase
          .from('recibos_pago')
          .select('id')
          .limit(1)
        
        if (accessError) {
          console.error('❌ No se puede acceder a la tabla recibos_pago:', accessError)
          throw new Error(`Error de acceso a tabla: ${accessError.message}`)
        }
        // DEBUG: console.log('✅ Tabla recibos_pago es accesible')
      } catch (err) {
        console.error('❌ Error verificando acceso a tabla:', err)
        throw err
      }
      
      const { data: recibo, error: errorRecibo } = await supabase
        .from('recibos_pago')
        .insert(reciboData)
        .select()
        .single()

      if (errorRecibo) {
        console.error('❌ Error insertando recibo:', {
          error: errorRecibo,
          message: errorRecibo?.message,
          details: errorRecibo?.details,
          hint: errorRecibo?.hint,
          code: errorRecibo?.code
        })
        throw new Error(`Error insertando recibo: ${errorRecibo?.message || errorRecibo?.code || 'Unknown error'}`)
      }
      // DEBUG: console.log('✅ Recibo creado exitosamente:', recibo.id)

      // 5. Actualizar estado de facturas
      // DEBUG: console.log('🔄 Paso 5: Actualizando estado de facturas...')
      const nuevoEstado = request.tipoPago === 'efectivo' ? 'pagada' : 'pendiente_aprobacion'
      for (const facturaId of request.facturasIds) {
        try {
          await this.updateEstadoPago(facturaId, nuevoEstado)
          // DEBUG: console.log('✅ Factura actualizada:', facturaId, 'a estado:', nuevoEstado)
        } catch (error) {
          console.error('❌ Error actualizando factura:', facturaId, error)
          throw error
        }
      }

      // 6. Generar archivos PDF y TXT
      // DEBUG: console.log('📎 Paso 6: Preparando respuesta...')
      const response: GenerarReciboResponse = {
        recibo: this.mapToReciboPago(recibo),
        notasDebito,
        pdfRecibo: '', // Se generará en el componente
        pdfNotasDebito: [] // Se generarán en el componente
      }

      if (request.formatoTxtId && request.tipoPago === 'deposito') {
        // DEBUG: console.log('📄 Generando archivo TXT...')
        try {
          response.archivoTxt = await this.generarArchivoTxt(validacion.validas, request.formatoTxtId)
          // DEBUG: console.log('✅ Archivo TXT generado')
        } catch (error) {
          console.error('❌ Error generando archivo TXT:', error)
          throw error
        }
      }

      // DEBUG: console.log('🎉 Recibo generado exitosamente!')
      return { data: response, error: null }
    } catch (err) {
      console.error('Error al generar recibo:', err)
      return { data: null, error: handleServiceError(err, 'Error al generar el recibo') }
    }
  }

  // ============================================================================
  // UTILIDADES Y HELPERS PRIVADOS
  // ============================================================================

  private mapToFacturaCuentaPorPagar(data: unknown): FacturaCuentaPorPagar {
    const factura = data as Record<string, unknown> // Type assertion for complex database object
    return {
      id: typeof factura.id === 'string' ? factura.id : '',
      numero: typeof factura.numero === 'string' ? factura.numero : '',
      numeroControl: typeof factura.numero_control === 'string' ? factura.numero_control : '',
      fecha: typeof factura.fecha === 'string' ? factura.fecha : '',
      fechaVencimiento: typeof factura.fecha_vencimiento === 'string' ? factura.fecha_vencimiento : undefined,
      estadoPago: (typeof factura.estado_pago === 'string' && ['pendiente', 'pagada', 'pendiente_aprobacion', 'vencida'].includes(factura.estado_pago)) 
        ? factura.estado_pago as 'pendiente' | 'pagada' | 'pendiente_aprobacion' | 'vencida'
        : 'pendiente',
      fechaPago: typeof factura.fecha_pago === 'string' ? factura.fecha_pago : undefined,
      notasPago: typeof factura.notas_pago === 'string' ? factura.notas_pago : undefined,
      tipoPago: (typeof factura.tipo_pago === 'string' && ['efectivo', 'deposito'].includes(factura.tipo_pago))
        ? factura.tipo_pago as 'efectivo' | 'deposito'
        : 'deposito',
      proveedorNombre: typeof factura.proveedor_nombre === 'string' ? factura.proveedor_nombre : '',
      proveedorRif: typeof factura.proveedor_rif === 'string' ? factura.proveedor_rif : '',
      proveedorDireccion: typeof factura.proveedor_direccion === 'string' ? factura.proveedor_direccion : '',
      clienteNombre: typeof factura.cliente_nombre === 'string' ? factura.cliente_nombre : '',
      clienteRif: typeof factura.cliente_rif === 'string' ? factura.cliente_rif : '',
      clienteDireccion: typeof factura.cliente_direccion === 'string' ? factura.cliente_direccion : '',
      subTotal: typeof factura.sub_total === 'number' ? factura.sub_total : 0,
      montoExento: typeof factura.monto_exento === 'number' ? factura.monto_exento : 0,
      baseImponible: typeof factura.base_imponible === 'number' ? factura.base_imponible : 0,
      alicuotaIVA: typeof factura.alicuota_iva === 'number' ? factura.alicuota_iva : 0,
      iva: typeof factura.iva === 'number' ? factura.iva : 0,
      total: typeof factura.total === 'number' ? factura.total : 0,
      tasaCambio: typeof factura.tasa_cambio === 'number' ? factura.tasa_cambio : 1,
      montoUSD: typeof factura.monto_usd === 'number' ? factura.monto_usd : 0,
      porcentajeRetencion: typeof factura.porcentaje_retencion === 'number' ? factura.porcentaje_retencion : 0,
      retencionIVA: typeof factura.retencion_iva === 'number' ? factura.retencion_iva : 0,
      companyId: typeof factura.company_id === 'string' ? factura.company_id : '',
      createdBy: typeof factura.created_by === 'string' ? factura.created_by : '',
      createdAt: typeof factura.created_at === 'string' ? factura.created_at : '',
      updatedAt: typeof factura.updated_at === 'string' ? factura.updated_at : ''
    }
  }

  private mapToReciboPago(data: unknown): ReciboPago {
    const recibo = data as Record<string, unknown> // Type assertion for complex database object
    return {
      id: typeof recibo.id === 'string' ? recibo.id : '',
      numeroRecibo: typeof recibo.numero_recibo === 'string' ? recibo.numero_recibo : '',
      companyId: typeof recibo.company_id === 'string' ? recibo.company_id : '',
      tipoRecibo: (typeof recibo.tipo_recibo === 'string' && ['individual', 'lote'].includes(recibo.tipo_recibo))
        ? recibo.tipo_recibo as 'individual' | 'lote'
        : 'individual',
      tipoPago: recibo.tipo_pago as 'efectivo' | 'deposito',
      facturasIds: JSON.parse(typeof recibo.facturas_ids === 'string' ? recibo.facturas_ids : '[]'),
      montoTotalBs: typeof recibo.monto_total_bs === 'number' ? recibo.monto_total_bs : 0,
      montoTotalUsd: typeof recibo.monto_total_usd === 'number' ? recibo.monto_total_usd : undefined,
      bancoDestino: typeof recibo.banco_destino === 'string' ? recibo.banco_destino : undefined,
      formatoTxtId: typeof recibo.formato_txt_id === 'string' ? recibo.formato_txt_id : undefined,
      archivoTxtGenerado: typeof recibo.archivo_txt_generado === 'boolean' ? recibo.archivo_txt_generado : false,
      notas: typeof recibo.notas === 'string' ? recibo.notas : undefined,
      createdBy: typeof recibo.created_by === 'string' ? recibo.created_by : '',
      createdAt: typeof recibo.created_at === 'string' ? recibo.created_at : '',
      updatedAt: typeof recibo.updated_at === 'string' ? recibo.updated_at : ''
    }
  }

  private calcularDiasVencimiento(fechaVencimiento?: string): number | undefined {
    if (!fechaVencimiento) return undefined
    
    const hoy = new Date()
    const vencimiento = new Date(fechaVencimiento)
    const diferencia = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    return diferencia
  }

  private async calcularMontoFinalPagar(factura: FacturaCuentaPorPagar): Promise<number> {
    // Por ahora retornamos el total, pero aquí se calculará con notas de débito
    // TODO: Implementar cálculo con notas de débito por diferencial cambiario
    return factura.total
  }

  private async generarNotaDebitoPorDiferencial(
    factura: FacturaCuentaPorPagar,
    userId: string
  ): Promise<NotaDebitoGenerada | null> {
    try {
      // DEBUG: console.log('🔄 Verificando diferencial cambiario para factura:', factura.numero)
      
      // Importar el servicio de notas de débito automáticas
      const { notasDebitoAutomaticasService } = await import('./notasDebitoAutomaticasService')
      
      // TODO: Importar el servicio de tasas de cambio para obtener la tasa actual
      const { tasasCambioService } = await import('./tasasCambioService')
      const tasaActualResult = await tasasCambioService.getTasaUSD()
      
      if (tasaActualResult.error || !tasaActualResult.data) {
        console.warn('⚠️ No se pudo obtener tasa actual para factura:', factura.numero)
        return null
      }
      
      const tasaActual = tasaActualResult.data.tasa
      const diferencial = Math.abs(tasaActual - factura.tasaCambio) * factura.montoUSD
      
      if (diferencial <= 0.01) { // Umbral mínimo
        // DEBUG: console.log('ℹ️ No hay diferencial cambiario significativo para factura:', factura.numero, 'Diferencial:', diferencial)
        return null
      }
      
      // DEBUG: console.log('💱 Diferencial encontrado:', diferencial, 'para factura:', factura.numero)
      
      // Generar la nota de débito automática
      const notaDebitoResult = await notasDebitoAutomaticasService.generarNotaDebitoAutomatica(
        factura,
        tasaActual,
        factura.companyId,
        userId
      )
      
      if (notaDebitoResult.error || !notaDebitoResult.data) {
        console.error('❌ Error generando nota de débito automática:', notaDebitoResult.error)
        return null
      }
      
      // DEBUG: console.log('✅ Nota de débito automática generada:', notaDebitoResult.data.id)
      return notaDebitoResult.data
      
    } catch (error) {
      console.error('❌ Error en generarNotaDebitoPorDiferencial:', error)
      return null
    }
  }

  private async generarArchivoTxt(facturas: FacturaCuentaPorPagar[], formatoTxtId: string): Promise<string> {
    try {
      // Obtener proveedores únicos de las facturas
      const rifsProveedores = Array.from(new Set(facturas.map(f => f.proveedorRif)))
      const proveedoresConCuentas = await this.obtenerProveedoresConCuentasFavoritas(rifsProveedores)
      
      // Usar el servicio de formatos TXT
      const { formatosTxtService } = await import('./formatosTxtService')
      const { data, error } = await formatosTxtService.generarArchivoTxt(
        formatoTxtId,
        facturas,
        proveedoresConCuentas
      )
      
      if (error) {
        console.error('Error generando archivo TXT:', error)
        return ''
      }
      
      return data || ''
    } catch (error) {
      console.error('Error en generarArchivoTxt:', error)
      return ''
    }
  }

  private async obtenerProveedoresConCuentasFavoritas(rifs: string[]): Promise<import('@/types/cuentasPorPagar').ProveedorConBanco[]> {
    try {
      const { proveedorService } = await import('./proveedorService')
      const { proveedorCuentasBancariasService } = await import('./proveedorCuentasBancariasService')
      
      const proveedoresConCuentas: import('@/types/cuentasPorPagar').ProveedorConBanco[] = []
      
      for (const rif of rifs) {
        // Obtener proveedor por RIF
        const { data: proveedor, error } = await proveedorService.getProveedorByRif(rif)
        
        if (error || !proveedor) {
          console.warn(`Proveedor con RIF ${rif} no encontrado`)
          continue
        }
        
        // Obtener cuenta favorita
        const { data: cuentaFavorita } = await proveedorCuentasBancariasService.getCuentaFavorita(proveedor.id)
        
        if (!cuentaFavorita) {
          console.warn(`Proveedor ${rif} no tiene cuenta bancaria favorita`)
          continue
        }
        
        // Mapear a la estructura esperada
        const proveedorConBanco: import('@/types/cuentasPorPagar').ProveedorConBanco = {
          id: proveedor.id,
          nombre: proveedor.nombre,
          rif: proveedor.rif,
          direccion: proveedor.direccion,
          contacto: proveedor.contacto || undefined,
          telefono: proveedor.telefono || undefined,
          email: proveedor.email || undefined,
          porcentajeRetencion: proveedor.porcentaje_retencion,
          tipoCambio: proveedor.tipo_cambio as import('@/types/cuentasPorPagar').TipoCambio,
          companyId: proveedor.company_id || '',
          createdAt: proveedor.created_at,
          updatedAt: proveedor.updated_at,
          bancoFavorito: {
            id: cuentaFavorita.id!,
            proveedorId: cuentaFavorita.proveedor_id,
            bancoNombre: cuentaFavorita.banco_nombre || '',
            numeroCuenta: cuentaFavorita.numero_cuenta,
            titularCuenta: cuentaFavorita.titular_cuenta || '',
            esFavorita: cuentaFavorita.es_favorita,
            banco: {
              id: '',
              nombre: cuentaFavorita.banco_nombre || '',
              codigo: ''
            }
          }
        }
        
        proveedoresConCuentas.push(proveedorConBanco)
      }
      
      return proveedoresConCuentas
    } catch (error) {
      console.error('Error obteniendo proveedores con cuentas favoritas:', error)
      return []
    }
  }

  /**
   * Obtener todas las notas de débito automáticas generadas para una compañía
   */
  async getNotasDebitoAutomaticas(
    companyId: string,
    filtros?: {
      fechaDesde?: string
      fechaHasta?: string
      proveedor?: string
      numeroNota?: string
      numeroFactura?: string
    },
    page: number = 1,
    limit: number = 10
  ): Promise<{
    success: boolean
    data?: {
      notasDebito: import('@/types/cuentasPorPagar').NotaDebitoGenerada[]
      total: number
    }
    error?: string
  }> {
    // Validar que companyId sea una string válida
    try {
      assertValid(validate.companyId(companyId))
    } catch (error) {
      return {
        success: false,
        error: handleServiceError(error, 'companyId inválido')
      }
    }
    
    try {
      let query = supabase
        .from('notas_debito')
        .select(`
          *,
          facturas!inner (
            numero,
            proveedor_nombre,
            proveedor_rif,
            total,
            monto_usd,
            tasa_cambio
          )
        `)
        .eq('company_id', companyId.trim())
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filtros?.fechaDesde) {
        query = query.gte('fecha', filtros.fechaDesde)
      }
      if (filtros?.fechaHasta) {
        query = query.lte('fecha', filtros.fechaHasta)
      }
      if (filtros?.numeroNota) {
        query = query.ilike('numero', `%${filtros.numeroNota}%`)
      }
      if (filtros?.numeroFactura) {
        query = query.ilike('facturas.numero', `%${filtros.numeroFactura}%`)
      }

      const { data, error, count } = await query.range(
        (page - 1) * limit,
        page * limit - 1
      )

      if (error) {
        console.error('Error obteniendo notas de débito automáticas:', handleServiceError(error, 'Error al obtener notas de débito automáticas'))
        return { success: false, error: 'Error al obtener las notas de débito' }
      }

      // Filtrar por proveedor si se especifica
      let filteredData = data || []
      if (filtros?.proveedor) {
        filteredData = (data || []).filter(nd => 
          nd.facturas.proveedor_nombre.toLowerCase().includes(filtros.proveedor!.toLowerCase()) ||
          nd.facturas.proveedor_rif.toLowerCase().includes(filtros.proveedor!.toLowerCase())
        )
      }

      // Mapear a tipo NotaDebitoGenerada
      const notasDebito: import('@/types/cuentasPorPagar').NotaDebitoGenerada[] = filteredData.map(nd => ({
        id: nd.id,
        numero: nd.numero,
        facturaId: nd.factura_id,
        fecha: nd.fecha,
        tasaCambioOriginal: nd.tasa_cambio_original,
        tasaCambioPago: nd.tasa_cambio_pago,
        montoUSDNeto: nd.monto_usd_neto,
        diferencialCambiarioConIVA: nd.diferencial_cambiario_con_iva,
        baseImponibleDiferencial: nd.base_imponible_diferencial,
        ivaDiferencial: nd.iva_diferencial,
        retencionIVADiferencial: nd.retencion_iva_diferencial,
        montoNetoPagarNotaDebito: nd.monto_neto_pagar_nota_debito,
        companyId: nd.company_id,
        createdBy: nd.created_by,
        createdAt: nd.created_at,
        factura: {
          id: nd.facturas.id || nd.factura_id,
          numero: nd.facturas.numero,
          numeroControl: '',
          fecha: nd.fecha,
          fechaVencimiento: '',
          estadoPago: 'pagada' as const,
          tipoPago: 'deposito' as const,
          proveedorNombre: nd.facturas.proveedor_nombre,
          proveedorRif: nd.facturas.proveedor_rif,
          proveedorDireccion: '',
          clienteNombre: '',
          clienteRif: '',
          clienteDireccion: '',
          subTotal: 0,
          montoExento: 0,
          baseImponible: 0,
          alicuotaIVA: 16,
          iva: 0,
          total: nd.facturas.total,
          tasaCambio: nd.facturas.tasa_cambio,
          montoUSD: nd.facturas.monto_usd,
          porcentajeRetencion: 75,
          retencionIVA: 0,
          companyId: nd.company_id,
          createdBy: nd.created_by,
          createdAt: nd.created_at,
          updatedAt: nd.updated_at || nd.created_at
        }
      }))

      return {
        success: true,
        data: {
          notasDebito,
          total: count || filteredData.length
        }
      }
    } catch (error) {
      console.error('Error en getNotasDebitoAutomaticas:', handleServiceError(error, 'Error al obtener notas de débito automáticas'))
      return {
        success: false,
        error: 'Error al obtener las notas de débito automáticas'
      }
    }
  }
}

export const cuentasPorPagarService = new CuentasPorPagarService()