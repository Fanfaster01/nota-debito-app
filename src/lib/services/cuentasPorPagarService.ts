// Servicio para el módulo de Cuentas por Pagar
import { createClient } from '@/utils/supabase/client'

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
    try {
      console.log('Intentando consulta de facturas para company:', companyId)
      
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
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        console.log('Columnas extendidas no disponibles, usando consulta básica')
        
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
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)
      }
      
      const { data, error, count } = queryResult

      if (error) {
        console.error('Supabase query error:', error)
        throw new Error(`Error en consulta: ${error.message || JSON.stringify(error)}`)
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

      console.log('Facturas obtenidas:', paginacion.facturas.length)
      return { data: paginacion, error: null }
    } catch (error) {
      console.error('Error al obtener facturas:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener las facturas'
      return { data: null, error: errorMessage }
    }
  }

  /**
   * Obtener múltiples facturas por IDs
   */
  async getFacturasByIds(ids: string[]): Promise<{ data: FacturaCuentaPorPagar[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .in('id', ids)

      if (error) throw error

      const facturas = data?.map(this.mapToFacturaCuentaPorPagar) || []
      return { data: facturas, error: null }
    } catch (error) {
      console.error('Error al obtener facturas:', error)
      return { data: null, error: 'Error al obtener las facturas' }
    }
  }

  /**
   * Obtener una factura por ID
   */
  async getFacturaById(id: string): Promise<{ data: FacturaCuentaPorPagar | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      const factura = this.mapToFacturaCuentaPorPagar(data)
      factura.diasVencimiento = this.calcularDiasVencimiento(factura.fechaVencimiento)
      factura.montoFinalPagar = await this.calcularMontoFinalPagar(factura)

      return { data: factura, error: null }
    } catch (error) {
      console.error('Error al obtener factura:', error)
      return { data: null, error: 'Error al obtener la factura' }
    }
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
    } catch (error: unknown) {
      console.error('Error al crear factura:', error)
      const errorMessage = error?.message || error?.details || 'Error al crear la factura'
      return { data: null, error: errorMessage }
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
    } catch (error) {
      console.error('Error al actualizar factura:', error)
      return { data: null, error: 'Error al actualizar la factura' }
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
    } catch (error) {
      console.error('Error al actualizar estado de pago:', error)
      return { data: false, error: 'Error al actualizar el estado de pago' }
    }
  }

  // ============================================================================
  // MÉTRICAS Y DASHBOARD
  // ============================================================================

  /**
   * Obtener métricas del dashboard
   */
  async getMetricas(companyId: string): Promise<{ data: MetricasCuentasPorPagar | null; error: string | null }> {
    try {
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
        .eq('company_id', companyId)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        console.log('Columnas extendidas no disponibles en métricas, usando consulta básica')
        
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
          .eq('company_id', companyId)
      }
      
      const { data: facturas, error } = queryResult

      if (error) {
        console.error('Error en getMetricas:', error)
        throw new Error(`Error en métricas: ${error.message || JSON.stringify(error)}`)
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

      return { data: metricas, error: null }
    } catch (error) {
      console.error('Error al obtener métricas:', error)
      return { data: null, error: 'Error al obtener las métricas' }
    }
  }

  /**
   * Obtener datos para gráficos
   */
  async getDatosGraficos(companyId: string): Promise<{ data: DatosGraficoCuentasPorPagar | null; error: string | null }> {
    try {
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
        .eq('company_id', companyId)
      
      // Si hay error, intentar consulta básica
      if (queryResult.error && queryResult.error.message?.includes('does not exist')) {
        console.log('Columnas extendidas no disponibles en gráficos, usando consulta básica')
        
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
          .eq('company_id', companyId)
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

      return { data: datos, error: null }
    } catch (error) {
      console.error('Error al obtener datos de gráficos:', error)
      return { data: null, error: 'Error al obtener los datos de gráficos' }
    }
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
    } catch (error) {
      console.error('Error validando cuentas bancarias:', error)
      return { proveedoresSinCuenta: [], error: 'Error validando cuentas bancarias' }
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
    } catch (error) {
      console.error('Error al validar facturas:', error)
      return { data: null, error: 'Error al validar las facturas' }
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
      console.log('🚀 Iniciando generación de recibo:', { companyId, userId, request })
      
      // 1. Validar facturas
      console.log('📋 Paso 1: Validando facturas...')
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
      console.log('✅ Validación exitosa, facturas válidas:', validacion.validas.length)

      // 2. Generar número de recibo
      console.log('🔢 Paso 2: Generando número de recibo...')
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
          console.log('✅ Número generado manualmente:', numeroRecibo)
        } else {
          numeroRecibo = data
          console.log('✅ Número generado por RPC:', numeroRecibo)
        }
      } catch (err) {
        console.error('❌ Error generando número de recibo:', err)
        throw new Error('Error al generar número de recibo')
      }

      // 3. Generar notas de débito si es necesario
      console.log('📄 Paso 3: Generando notas de débito...')
      const notasDebito: NotaDebitoGenerada[] = []
      if (request.tipoPago === 'deposito') {
        console.log('💰 Tipo de pago es depósito, generando notas de débito...')
        for (const factura of validacion.validas) {
          try {
            const notaDebito = await this.generarNotaDebitoPorDiferencial(factura, userId)
            if (notaDebito) {
              notasDebito.push(notaDebito)
              console.log('✅ Nota de débito generada para factura:', factura.numero)
            }
          } catch (error) {
            console.error('❌ Error generando nota de débito para factura:', factura.numero, error)
            throw new Error(`Error generando nota de débito para factura ${factura.numero}`)
          }
        }
      }
      console.log('✅ Notas de débito generadas:', notasDebito.length)

      // 4. Crear recibo de pago
      console.log('📝 Paso 4: Creando recibo de pago...')
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

      console.log('💾 Insertando recibo en la base de datos:', reciboData)
      
      // Validate user ID format
      if (!userId || userId === 'user-id' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('❌ Usuario ID inválido:', userId)
        throw new Error(`ID de usuario inválido: ${userId}`)
      }
      
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
        console.log('✅ Tabla recibos_pago es accesible')
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
      console.log('✅ Recibo creado exitosamente:', recibo.id)

      // 5. Actualizar estado de facturas
      console.log('🔄 Paso 5: Actualizando estado de facturas...')
      const nuevoEstado = request.tipoPago === 'efectivo' ? 'pagada' : 'pendiente_aprobacion'
      for (const facturaId of request.facturasIds) {
        try {
          await this.updateEstadoPago(facturaId, nuevoEstado)
          console.log('✅ Factura actualizada:', facturaId, 'a estado:', nuevoEstado)
        } catch (error) {
          console.error('❌ Error actualizando factura:', facturaId, error)
          throw error
        }
      }

      // 6. Generar archivos PDF y TXT
      console.log('📎 Paso 6: Preparando respuesta...')
      const response: GenerarReciboResponse = {
        recibo: this.mapToReciboPago(recibo),
        notasDebito,
        pdfRecibo: '', // Se generará en el componente
        pdfNotasDebito: [] // Se generarán en el componente
      }

      if (request.formatoTxtId && request.tipoPago === 'deposito') {
        console.log('📄 Generando archivo TXT...')
        try {
          response.archivoTxt = await this.generarArchivoTxt(validacion.validas, request.formatoTxtId)
          console.log('✅ Archivo TXT generado')
        } catch (error) {
          console.error('❌ Error generando archivo TXT:', error)
          throw error
        }
      }

      console.log('🎉 Recibo generado exitosamente!')
      return { data: response, error: null }
    } catch (error) {
      console.error('Error al generar recibo:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Error al generar el recibo' }
    }
  }

  // ============================================================================
  // UTILIDADES Y HELPERS PRIVADOS
  // ============================================================================

  private mapToFacturaCuentaPorPagar(data: unknown): FacturaCuentaPorPagar {
    const factura = data as any // Type assertion for complex database object
    return {
      id: factura.id,
      numero: factura.numero,
      numeroControl: factura.numero_control,
      fecha: factura.fecha,
      fechaVencimiento: factura.fecha_vencimiento || undefined,
      estadoPago: factura.estado_pago || 'pendiente', // Valor por defecto
      fechaPago: factura.fecha_pago || undefined,
      notasPago: factura.notas_pago || undefined,
      tipoPago: factura.tipo_pago || 'deposito', // Valor por defecto
      proveedorNombre: factura.proveedor_nombre,
      proveedorRif: factura.proveedor_rif,
      proveedorDireccion: factura.proveedor_direccion,
      clienteNombre: factura.cliente_nombre,
      clienteRif: factura.cliente_rif,
      clienteDireccion: factura.cliente_direccion,
      subTotal: factura.sub_total,
      montoExento: factura.monto_exento,
      baseImponible: factura.base_imponible,
      alicuotaIVA: factura.alicuota_iva,
      iva: factura.iva,
      total: factura.total,
      tasaCambio: factura.tasa_cambio,
      montoUSD: factura.monto_usd,
      porcentajeRetencion: factura.porcentaje_retencion,
      retencionIVA: factura.retencion_iva,
      companyId: factura.company_id,
      createdBy: factura.created_by,
      createdAt: factura.created_at,
      updatedAt: factura.updated_at
    }
  }

  private mapToReciboPago(data: unknown): ReciboPago {
    const recibo = data as any // Type assertion for complex database object
    return {
      id: recibo.id,
      numeroRecibo: recibo.numero_recibo,
      companyId: recibo.company_id,
      tipoRecibo: recibo.tipo_recibo,
      tipoPago: recibo.tipo_pago,
      facturasIds: JSON.parse(recibo.facturas_ids),
      montoTotalBs: recibo.monto_total_bs,
      montoTotalUsd: recibo.monto_total_usd,
      bancoDestino: recibo.banco_destino,
      formatoTxtId: recibo.formato_txt_id,
      archivoTxtGenerado: recibo.archivo_txt_generado,
      notas: recibo.notas,
      createdBy: recibo.created_by,
      createdAt: recibo.created_at,
      updatedAt: recibo.updated_at
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
      console.log('🔄 Verificando diferencial cambiario para factura:', factura.numero)
      
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
        console.log('ℹ️ No hay diferencial cambiario significativo para factura:', factura.numero, 'Diferencial:', diferencial)
        return null
      }
      
      console.log('💱 Diferencial encontrado:', diferencial, 'para factura:', factura.numero)
      
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
      
      console.log('✅ Nota de débito automática generada:', notaDebitoResult.data.id)
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
}

export const cuentasPorPagarService = new CuentasPorPagarService()