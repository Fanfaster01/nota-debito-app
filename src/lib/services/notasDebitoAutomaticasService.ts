// Servicio para generación automática de notas de débito por diferencial cambiario
import { createClient } from '@/utils/supabase/client'
import { handleServiceError } from '@/utils/errorHandler'

const supabase = createClient()
import { tasasCambioService } from './tasasCambioService'
import { proveedorService } from './proveedorService'
import type { 
  FacturaCuentaPorPagar, 
  NotaDebitoGenerada, 
  TipoCambio
} from '@/types/cuentasPorPagar'

interface CalculoNotaDebito {
  facturaId: string
  tasaCambioOriginal: number
  tasaCambioPago: number
  montoUSDNeto: number
  diferencialCambiarioConIVA: number
  baseImponibleDiferencial: number
  ivaDiferencial: number
  retencionIVADiferencial: number
  montoNetoPagarNotaDebito: number
}

interface NotaDebitoData {
  numero: string
  fecha: string
  facturaId: string
  tasaCambioOriginal: number
  tasaCambioPago: number
  montoUSDNeto: number
  diferencialCambiarioConIVA: number
  baseImponibleDiferencial: number
  ivaDiferencial: number
  retencionIVADiferencial: number
  montoNetoPagarNotaDebito: number
  companyId: string
  createdBy: string
  notas: string
}

class NotasDebitoAutomaticasService {
  /**
   * Generar nota de débito automática para una factura
   */
  async generarNotaDebitoAutomatica(
    factura: FacturaCuentaPorPagar,
    tasaPago: number,
    companyId: string,
    userId: string,
    notas?: string
  ): Promise<{ data: NotaDebitoGenerada | null; error: string | null }> {
    try {
      // Calcular diferencial cambiario
      const calculo = await this.calcularDiferencialCambiario(
        factura,
        factura.tasaCambio,
        tasaPago
      )

      // Si no hay diferencial significativo, no generar nota
      if (calculo.diferencialCambiarioConIVA < 0.01) {
        return { 
          data: null, 
          error: 'No hay diferencial cambiario significativo para generar nota de débito' 
        }
      }

      // Obtener siguiente número de nota de débito
      const numeroResult = await this.obtenerSiguienteNumero(companyId)
      if (numeroResult.error) {
        return { data: null, error: numeroResult.error }
      }

      // Crear nota de débito
      const notaDebitoData = {
        numero: numeroResult.data!,
        fecha: new Date().toISOString().split('T')[0],
        facturaId: factura.id,
        tasaCambioOriginal: calculo.tasaCambioOriginal,
        tasaCambioPago: calculo.tasaCambioPago,
        montoUSDNeto: calculo.montoUSDNeto,
        diferencialCambiarioConIVA: calculo.diferencialCambiarioConIVA,
        baseImponibleDiferencial: calculo.baseImponibleDiferencial,
        ivaDiferencial: calculo.ivaDiferencial,
        retencionIVADiferencial: calculo.retencionIVADiferencial,
        montoNetoPagarNotaDebito: calculo.montoNetoPagarNotaDebito,
        companyId,
        createdBy: userId,
        notas: notas || `Nota de débito automática por diferencial cambiario. Tasa original: ${calculo.tasaCambioOriginal}, Tasa pago: ${calculo.tasaCambioPago}`
      }

      // Guardar en base de datos
      const result = await this.guardarNotaDebito(notaDebitoData)
      if (result.error) {
        return { data: null, error: result.error }
      }

      // Mapear a tipo de respuesta
      const dbResult = result.data as { id: string; created_at: string }
      const notaDebitoGenerada: NotaDebitoGenerada = {
        ...notaDebitoData,
        id: dbResult.id,
        createdAt: dbResult.created_at,
        factura
      }

      return { data: notaDebitoGenerada, error: null }
    } catch (err) {
      console.error('Error generando nota de débito automática:', err)
      return { 
        data: null, 
        error: handleServiceError(err, 'Error al generar la nota de débito automática') 
      }
    }
  }

  /**
   * Generar múltiples notas de débito para un lote de facturas
   */
  async generarNotasDebitoLote(
    facturas: FacturaCuentaPorPagar[],
    companyId: string,
    userId: string,
    tasasPersonalizadas?: Map<string, number> // Para proveedores con tipo PAR
  ): Promise<{ 
    data: NotaDebitoGenerada[] | null
    errores: string[]
    exitosas: number
  }> {
    const notasGeneradas: NotaDebitoGenerada[] = []
    const errores: string[] = []

    for (const factura of facturas) {
      try {
        // Obtener tasa de pago según el tipo de cambio del proveedor
        const tasaPagoResult = await this.obtenerTasaPago(
          factura,
          tasasPersonalizadas?.get(factura.proveedorRif)
        )

        if (tasaPagoResult.error) {
          errores.push(`Factura ${factura.numero}: ${tasaPagoResult.error}`)
          continue
        }

        const tasaPago = tasaPagoResult.data!

        // Generar nota de débito
        const result = await this.generarNotaDebitoAutomatica(
          factura,
          tasaPago,
          companyId,
          userId
        )

        if (result.error) {
          errores.push(`Factura ${factura.numero}: ${result.error}`)
        } else if (result.data) {
          notasGeneradas.push(result.data)
        }
      } catch (err) {
        const errorMsg = handleServiceError(err, `Error procesando factura ${factura.numero}`)
        errores.push(`Factura ${factura.numero}: ${errorMsg}`)
        console.error(`Error procesando factura ${factura.numero}:`, err)
      }
    }

    return {
      data: notasGeneradas.length > 0 ? notasGeneradas : null,
      errores,
      exitosas: notasGeneradas.length
    }
  }

  /**
   * Calcular diferencial cambiario considerando notas de crédito asociadas
   */
  private async calcularDiferencialCambiario(
    factura: FacturaCuentaPorPagar,
    tasaOriginal: number,
    tasaPago: number
  ): Promise<CalculoNotaDebito> {
    // Obtener notas de crédito asociadas a la factura
    const notasCredito = await this.obtenerNotasCreditoAsociadas(factura.id)
    
    // Calcular monto USD neto después de descontar las notas de crédito
    const montoUSDFactura = factura.montoUSD
    const totalUSDNotasCredito = notasCredito.reduce((total, nc) => {
      return total + (nc.monto_usd || nc.total / nc.tasa_cambio)
    }, 0)
    
    // Monto USD neto (factura menos notas de crédito)
    const montoUSDNeto = Math.max(0, montoUSDFactura - totalUSDNotasCredito)

    // Diferencial cambiario bruto
    const diferencialBruto = montoUSDNeto * (tasaPago - tasaOriginal)

    // Si no hay diferencial positivo, retornar ceros
    if (diferencialBruto <= 0) {
      return {
        facturaId: factura.id,
        tasaCambioOriginal: tasaOriginal,
        tasaCambioPago: tasaPago,
        montoUSDNeto,
        diferencialCambiarioConIVA: 0,
        baseImponibleDiferencial: 0,
        ivaDiferencial: 0,
        retencionIVADiferencial: 0,
        montoNetoPagarNotaDebito: 0
      }
    }

    // Base imponible del diferencial (sin IVA)
    const baseImponibleDiferencial = diferencialBruto / (1 + (factura.alicuotaIVA / 100))

    // IVA del diferencial
    const ivaDiferencial = baseImponibleDiferencial * (factura.alicuotaIVA / 100)

    // Diferencial total con IVA
    const diferencialCambiarioConIVA = baseImponibleDiferencial + ivaDiferencial

    // Retención IVA del diferencial
    const retencionIVADiferencial = ivaDiferencial * (factura.porcentajeRetencion / 100)

    // Monto neto a pagar (diferencial con IVA menos retención)
    const montoNetoPagarNotaDebito = diferencialCambiarioConIVA - retencionIVADiferencial

    return {
      facturaId: factura.id,
      tasaCambioOriginal: tasaOriginal,
      tasaCambioPago: tasaPago,
      montoUSDNeto,
      diferencialCambiarioConIVA: parseFloat(diferencialCambiarioConIVA.toFixed(2)),
      baseImponibleDiferencial: parseFloat(baseImponibleDiferencial.toFixed(2)),
      ivaDiferencial: parseFloat(ivaDiferencial.toFixed(2)),
      retencionIVADiferencial: parseFloat(retencionIVADiferencial.toFixed(2)),
      montoNetoPagarNotaDebito: parseFloat(montoNetoPagarNotaDebito.toFixed(2))
    }
  }

  /**
   * Obtener tasa de pago según el tipo de cambio del proveedor
   */
  private async obtenerTasaPago(
    factura: FacturaCuentaPorPagar,
    tasaManual?: number
  ): Promise<{ data: number | null; error: string | null }> {
    try {
      // Obtener el proveedor por RIF para acceder a su tipo_cambio
      const { data: proveedor, error: proveedorError } = await proveedorService.getProveedorByRif(factura.proveedorRif)
      
      if (proveedorError || !proveedor) {
        console.error('Error obteniendo proveedor:', proveedorError)
        return { data: null, error: 'No se pudo obtener la información del proveedor' }
      }

      const tipoMoneda: TipoCambio = proveedor.tipo_cambio as TipoCambio

      switch (tipoMoneda) {
        case 'USD':
          const usdResult = await tasasCambioService.getTasaUSD()
          if (usdResult.error || !usdResult.data) {
            return { data: null, error: 'No se pudo obtener la tasa USD actual' }
          }
          return { data: usdResult.data.tasa, error: null }

        case 'EUR':
          const eurResult = await tasasCambioService.getTasaEUR()
          if (eurResult.error || !eurResult.data) {
            return { data: null, error: 'No se pudo obtener la tasa EUR actual' }
          }
          return { data: eurResult.data.tasa, error: null }

        case 'PAR':
          if (!tasaManual) {
            return { data: null, error: 'Tasa manual requerida para proveedor con tipo PAR' }
          }
          return { data: tasaManual, error: null }

        default:
          return { data: null, error: `Tipo de moneda no soportado: ${tipoMoneda}` }
      }
    } catch (err) {
      console.error('Error obteniendo tasa de pago:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener la tasa de pago') }
    }
  }

  /**
   * Obtener siguiente número de nota de débito
   */
  private async obtenerSiguienteNumero(companyId: string): Promise<{ data: string | null; error: string | null }> {
    try {
      // Usar el servicio existente de notas de débito si existe
      // Por ahora generamos un número simple
      const { data, error } = await supabase
        .from('notas_debito')
        .select('numero')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      let siguienteNumero = 1
      if (data && data.length > 0) {
        const ultimoNumero = data[0].numero
        const match = ultimoNumero.match(/\d+$/)
        if (match) {
          siguienteNumero = parseInt(match[0]) + 1
        }
      }

      const numeroFormateado = `ND-${siguienteNumero.toString().padStart(6, '0')}`
      return { data: numeroFormateado, error: null }
    } catch (err) {
      console.error('Error obteniendo siguiente número:', err)
      return { data: null, error: handleServiceError(err, 'Error al generar número de nota de débito') }
    }
  }

  /**
   * Guardar nota de débito en base de datos
   */
  private async guardarNotaDebito(notaData: NotaDebitoData): Promise<{ data: unknown | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('notas_debito')
        .insert({
          numero: notaData.numero,
          fecha: notaData.fecha,
          factura_id: notaData.facturaId,
          tasa_cambio_original: notaData.tasaCambioOriginal,
          tasa_cambio_pago: notaData.tasaCambioPago,
          monto_usd_neto: notaData.montoUSDNeto,
          diferencial_cambiario_con_iva: notaData.diferencialCambiarioConIVA,
          base_imponible_diferencial: notaData.baseImponibleDiferencial,
          iva_diferencial: notaData.ivaDiferencial,
          retencion_iva_diferencial: notaData.retencionIVADiferencial,
          monto_neto_pagar_nota_debito: notaData.montoNetoPagarNotaDebito,
          company_id: notaData.companyId,
          created_by: notaData.createdBy,
          notas: notaData.notas,
          origen: 'automatica' // Marcar como generada automáticamente
        })
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Error guardando nota de débito:', err)
      return { data: null, error: handleServiceError(err, 'Error al guardar la nota de débito') }
    }
  }

  /**
   * Validar si es necesario generar nota de débito
   */
  validarNecesidadNotaDebito(
    factura: FacturaCuentaPorPagar,
    tasaOriginal: number,
    tasaPago: number,
    umbralMinimo: number = 0.01
  ): { necesaria: boolean; motivo: string; diferencial: number } {
    const diferencial = Math.abs(tasaPago - tasaOriginal)
    const montoUSD = factura.montoUSD
    const impactoBs = diferencial * montoUSD

    if (tasaPago <= tasaOriginal) {
      return {
        necesaria: false,
        motivo: 'La tasa de pago es menor o igual a la tasa original',
        diferencial: 0
      }
    }

    if (impactoBs < umbralMinimo) {
      return {
        necesaria: false,
        motivo: `El impacto del diferencial (Bs. ${impactoBs.toFixed(2)}) es menor al umbral mínimo`,
        diferencial: impactoBs
      }
    }

    return {
      necesaria: true,
      motivo: `Diferencial significativo: Bs. ${impactoBs.toFixed(2)}`,
      diferencial: impactoBs
    }
  }

  /**
   * Obtener notas de crédito asociadas a una factura
   */
  private async obtenerNotasCreditoAsociadas(facturaId: string): Promise<{
    id: string
    total: number
    monto_usd: number
    tasa_cambio: number
  }[]> {
    try {
      const { data, error } = await supabase
        .from('notas_credito')
        .select('id, total, monto_usd, tasa_cambio')
        .eq('factura_id', facturaId)

      if (error) {
        console.error('Error obteniendo notas de crédito:', handleServiceError(error, 'Error al obtener notas de crédito'))
        return []
      }

      return data || []
    } catch (err) {
      console.error('Error en obtenerNotasCreditoAsociadas:', handleServiceError(err, 'Error al obtener notas de crédito asociadas'))
      return []
    }
  }

  /**
   * Obtener resumen de notas de débito generadas
   */
  async obtenerResumenNotasDebito(
    companyId: string,
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<{
    data: {
      totalNotas: number
      montoTotalDiferencial: number
      montoTotalPagar: number
      promedioTasaOriginal: number
      promedioTasaPago: number
    } | null
    error: string | null
  }> {
    try {
      let query = supabase
        .from('notas_debito')
        .select('*')
        .eq('company_id', companyId)

      if (fechaDesde) {
        query = query.gte('fecha', fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte('fecha', fechaHasta)
      }

      const { data, error } = await query

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          data: {
            totalNotas: 0,
            montoTotalDiferencial: 0,
            montoTotalPagar: 0,
            promedioTasaOriginal: 0,
            promedioTasaPago: 0
          },
          error: null
        }
      }

      const resumen = {
        totalNotas: data.length,
        montoTotalDiferencial: data.reduce((sum, nota) => {
          const notaData = nota as Record<string, unknown>
          return sum + (notaData.diferencial_cambiario_con_iva as number)
        }, 0),
        montoTotalPagar: data.reduce((sum, nota) => {
          const notaData = nota as Record<string, unknown>
          return sum + (notaData.monto_neto_pagar_nota_debito as number)
        }, 0),
        promedioTasaOriginal: data.reduce((sum, nota) => {
          const notaData = nota as Record<string, unknown>
          return sum + (notaData.tasa_cambio_original as number)
        }, 0) / data.length,
        promedioTasaPago: data.reduce((sum, nota) => {
          const notaData = nota as Record<string, unknown>
          return sum + (notaData.tasa_cambio_pago as number)
        }, 0) / data.length
      }

      return { data: resumen, error: null }
    } catch (err) {
      console.error('Error obteniendo resumen:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener el resumen de notas de débito') }
    }
  }
}

export const notasDebitoAutomaticasService = new NotasDebitoAutomaticasService()