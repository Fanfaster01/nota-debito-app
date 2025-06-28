// src/lib/services/cierresCajaService.ts
import { createClient } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { CajaUI } from '@/types/caja'
import { CierreCaja, CierrePuntoVenta } from '@/types/database'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'
import { validate, assertValid } from '@/utils/validators'

export interface CierreDetalladoUI {
  id: string // ID del cierre (puede ser del cierre_caja o de la caja si no hay cierre_caja)
  caja: CajaUI
  detallesEfectivo: CierreCaja | null
  detallesPuntoVenta: (CierrePuntoVenta & { banco: { nombre: string, codigo: string } })[]
  resumen: {
    totalEfectivoContado: number
    totalPuntoVenta: number
    totalSistemico: number
    discrepanciaReporteZ: number
    discrepanciaReporteZUsd: number
    discrepanciaTotal: number
  }
}

export interface FiltrosCierres {
  fechaDesde?: Date
  fechaHasta?: Date
  userId?: string
  companyId?: string
  conDiscrepancias?: boolean
  rangoMonto?: {
    min?: number
    max?: number
  }
}

export interface ResumenCierres {
  totalCierres: number
  cierresConDiscrepancias: number
  promedioDiscrepancia: number
  totalEfectivoContado: number
  totalSistemico: number
  totalPuntoVenta: number
  montoTotalCierres: number
  usuariosMasActivos: Array<{
    userId: string
    nombreUsuario: string
    cantidadCierres: number
    promedioDiscrepancia: number
  }>
}

export class CierresCajaService {
  private supabase = createClient()

  // Obtener cierres de caja con filtros y detalles completos
  async getCierresDetallados(filtros?: FiltrosCierres): Promise<{ data: CierreDetalladoUI[] | null, error: unknown }> {
    try {
      // Construir query base para cajas cerradas
      let query = this.supabase
        .from('cajas')
        .select(`
          *,
          companies:company_id (
            id,
            name,
            rif
          ),
          users:user_id (
            id,
            full_name,
            email
          ),
          cierres_caja (*),
          cierres_punto_venta (
            *,
            banco:banco_id (
              nombre,
              codigo
            )
          )
        `)
        .eq('estado', 'cerrada')
        .order('fecha', { ascending: false })
        .order('hora_cierre', { ascending: false })

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
      
      if (filtros?.companyId) {
        assertValid(validate.companyId(filtros.companyId))
        query = query.eq('company_id', filtros.companyId)
      }

      const { data: cajasData, error } = await query

      if (error) return { data: null, error }

      if (!cajasData || cajasData.length === 0) {
        return { data: [], error: null }
      }

      // Procesar los datos y calcular resúmenes
      const cierresDetallados: CierreDetalladoUI[] = []

      for (const cajaData of cajasData) {
        const caja: CajaUI = {
          id: cajaData.id,
          userId: cajaData.user_id,
          companyId: cajaData.company_id,
          fecha: new Date(cajaData.fecha),
          horaApertura: new Date(cajaData.hora_apertura),
          horaCierre: cajaData.hora_cierre ? new Date(cajaData.hora_cierre) : null,
          montoApertura: cajaData.monto_apertura,
          montoAperturaUsd: cajaData.monto_apertura_usd || 0,
          montoCierre: cajaData.monto_cierre,
          tasaDia: cajaData.tasa_dia || 0,
          tipoMoneda: cajaData.tipo_moneda || 'USD', // Add required field
          totalPagosMovil: cajaData.total_pagos_movil,
          cantidadPagosMovil: cajaData.cantidad_pagos_movil,
          totalZelleUsd: cajaData.total_zelle_usd || 0,
          totalZelleBs: cajaData.total_zelle_bs || 0,
          cantidadZelle: cajaData.cantidad_zelle || 0,
          totalNotasCredito: cajaData.total_notas_credito || 0,
          cantidadNotasCredito: cajaData.cantidad_notas_credito || 0,
          totalCreditosBs: cajaData.total_creditos_bs || 0,
          totalCreditosUsd: cajaData.total_creditos_usd || 0,
          cantidadCreditos: cajaData.cantidad_creditos || 0,
          estado: cajaData.estado,
          observaciones: cajaData.observaciones,
          usuario: cajaData.users,
          company: cajaData.companies
        }

        const detallesEfectivo = cajaData.cierres_caja?.[0] || null
        const detallesPuntoVenta = cajaData.cierres_punto_venta || []

        // Calcular resumen del cierre
        const totalEfectivoContado = (detallesEfectivo?.efectivo_dolares || 0) * caja.tasaDia +
                                     (detallesEfectivo?.efectivo_euros || 0) * caja.tasaDia * 1.1 + // Estimación EUR->USD
                                     (detallesEfectivo?.efectivo_bs || 0)

        const totalPuntoVenta = detallesPuntoVenta.reduce((sum: number, pv: unknown) => {
          const pvData = pv as { monto_bs?: number } // Type assertion for database object
          return sum + (pvData.monto_bs || 0)
        }, 0)

        const totalSistemico = caja.totalPagosMovil + caja.totalZelleBs + caja.totalNotasCredito + caja.totalCreditosBs

        // Discrepancia principal: diferencia entre sistema y reporte Z (convertir a USD para los rangos)
        const reporteZ = detallesEfectivo?.reporte_z || 0
        const discrepanciaReporteZ = reporteZ > 0 ? totalSistemico - reporteZ : 0
        const discrepanciaReporteZUsd = Math.abs(discrepanciaReporteZ) / caja.tasaDia
        
        // Discrepancia total (efectivo contado vs sistema) - para referencia
        const discrepanciaTotal = totalSistemico - (totalEfectivoContado + totalPuntoVenta)

        const resumen = {
          totalEfectivoContado,
          totalPuntoVenta,
          totalSistemico,
          discrepanciaReporteZ,
          discrepanciaReporteZUsd,
          discrepanciaTotal
        }

        // Aplicar filtro de discrepancias si está activo (usar discrepancia reporte Z)
        if (filtros?.conDiscrepancias && discrepanciaReporteZUsd < 1) {
          continue // Saltar cierres sin discrepancias significativas
        }

        // Aplicar filtro de rango de monto si está activo
        if (filtros?.rangoMonto) {
          if (filtros.rangoMonto.min && totalSistemico < filtros.rangoMonto.min) continue
          if (filtros.rangoMonto.max && totalSistemico > filtros.rangoMonto.max) continue
        }

        // Generar ID único para el cierre (usar ID del cierre_caja o ID de la caja como fallback)
        const cierreId = detallesEfectivo?.id || caja.id

        cierresDetallados.push({
          id: cierreId,
          caja,
          detallesEfectivo,
          detallesPuntoVenta,
          resumen
        })
      }

      return { data: cierresDetallados, error: null }
    } catch (err) {
      console.error('Error getting cierres detallados:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener cierres detallados') }
    }
  }

  // Obtener resumen estadístico de cierres
  async getResumenCierres(companyId?: string, dias: number = 30): Promise<{ data: ResumenCierres | null, error: unknown }> {
    try {
      const fechaInicio = new Date()
      fechaInicio.setDate(fechaInicio.getDate() - dias)

      const filtros: FiltrosCierres = {
        fechaDesde: fechaInicio,
        fechaHasta: new Date()
      }

      if (companyId) {
        assertValid(validate.companyId(companyId))
        filtros.companyId = companyId
      }

      const { data: cierres, error } = await this.getCierresDetallados(filtros)

      if (error || !cierres) {
        return { data: null, error }
      }

      const totalCierres = cierres.length
      // Usar discrepancia de reporte Z para contar discrepancias
      const cierresConDiscrepancias = cierres.filter(c => c.resumen.discrepanciaReporteZUsd >= 1).length
      
      const promedioDiscrepancia = totalCierres > 0 
        ? cierres.reduce((sum, c) => sum + c.resumen.discrepanciaReporteZUsd, 0) / totalCierres 
        : 0

      const totalEfectivoContado = cierres.reduce((sum, c) => sum + c.resumen.totalEfectivoContado, 0)
      const totalSistemico = cierres.reduce((sum, c) => sum + c.resumen.totalSistemico, 0)
      const totalPuntoVenta = cierres.reduce((sum, c) => sum + c.resumen.totalPuntoVenta, 0)
      const montoTotalCierres = cierres.reduce((sum, c) => sum + (c.caja.montoCierre || 0), 0)

      // Agrupar por usuario para estadísticas
      const usuarioStats = new Map()
      cierres.forEach(cierre => {
        const userId = cierre.caja.userId
        const nombreUsuario = cierre.caja.usuario?.full_name || 'Sin nombre'
        
        if (userId) {
          if (!usuarioStats.has(userId)) {
            usuarioStats.set(userId, {
              userId,
              nombreUsuario,
              cantidadCierres: 0,
              totalDiscrepancias: 0
            })
          }
          
          const stats = usuarioStats.get(userId)
          stats.cantidadCierres++
          stats.totalDiscrepancias += cierre.resumen.discrepanciaReporteZUsd
        }
      })

      const usuariosMasActivos = Array.from(usuarioStats.values())
        .map(stats => ({
          ...stats,
          promedioDiscrepancia: stats.cantidadCierres > 0 ? stats.totalDiscrepancias / stats.cantidadCierres : 0
        }))
        .sort((a, b) => b.cantidadCierres - a.cantidadCierres)
        .slice(0, 5)

      const resumen: ResumenCierres = {
        totalCierres,
        cierresConDiscrepancias,
        promedioDiscrepancia,
        totalEfectivoContado,
        totalSistemico,
        totalPuntoVenta,
        montoTotalCierres,
        usuariosMasActivos
      }

      return { data: resumen, error: null }
    } catch (err) {
      console.error('Error getting resumen cierres:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener resumen de cierres') }
    }
  }

  // Obtener usuarios cajeros de una compañía
  async getCajeros(companyId: string): Promise<{ data: Array<{id: string, full_name: string, email: string}> | null, error: unknown }> {
    try {
      const { data, error } = await this.supabase
        .from('users_view')
        .select('id, full_name, email')
        .eq('company_id', companyId)
        .in('role', ['user', 'admin']) // Usuarios que pueden manejar cajas
        .order('full_name')

      return { data, error }
    } catch (err) {
      console.error('Error getting cajeros:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener cajeros') }
    }
  }

  // Comparar dos cierres específicos
  async compararCierres(cierre1Id: string, cierre2Id: string): Promise<{ 
    data: { cierre1: CierreDetalladoUI, cierre2: CierreDetalladoUI, comparacion: unknown } | null, 
    error: unknown 
  }> {
    try {
      const { data: cierres, error } = await this.getCierresDetallados()
      
      if (error || !cierres) {
        return { data: null, error }
      }

      const cierre1 = cierres.find(c => c.caja.id === cierre1Id)
      const cierre2 = cierres.find(c => c.caja.id === cierre2Id)

      if (!cierre1 || !cierre2) {
        return { data: null, error: handleServiceError(new Error('Uno o ambos cierres no encontrados'), 'Cierres no encontrados') }
      }

      const comparacion = {
        diferenciaSistemico: cierre1.resumen.totalSistemico - cierre2.resumen.totalSistemico,
        diferenciaEfectivo: cierre1.resumen.totalEfectivoContado - cierre2.resumen.totalEfectivoContado,
        diferenciaPuntoVenta: cierre1.resumen.totalPuntoVenta - cierre2.resumen.totalPuntoVenta,
        diferenciaDiscrepancia: cierre1.resumen.discrepanciaTotal - cierre2.resumen.discrepanciaTotal,
        mejorPrecision: Math.abs(cierre1.resumen.discrepanciaTotal) < Math.abs(cierre2.resumen.discrepanciaTotal) ? 'cierre1' : 'cierre2'
      }

      return { data: { cierre1, cierre2, comparacion }, error: null }
    } catch (err) {
      console.error('Error comparing cierres:', err)
      return { data: null, error: handleServiceError(err, 'Error al comparar cierres') }
    }
  }

  // Obtener alertas de discrepancias usando nuevos rangos (0-5$ leve, 5-15$ media, 15+ alta)
  async getAlertasDiscrepancias(companyId?: string, umbral: number = 5): Promise<{ 
    data: Array<{
      cierre: CierreDetalladoUI,
      tipoAlerta: 'discrepancia_alta' | 'discrepancia_reporte_z' | 'sin_detalles',
      severidad: 'leve' | 'media' | 'alta',
      mensaje: string
    }> | null, 
    error: unknown 
  }> {
    try {
      const filtros: FiltrosCierres = {}
      if (companyId) {
        assertValid(validate.companyId(companyId))
        filtros.companyId = companyId
      }

      const { data: cierres, error } = await this.getCierresDetallados(filtros)

      if (error || !cierres) {
        return { data: null, error }
      }

      const alertas = []

      for (const cierre of cierres) {
        const discrepanciaUsd = cierre.resumen.discrepanciaReporteZUsd
        const cajeroNombre = cierre.caja.usuario?.full_name || 'Sin cajero'

        // Alerta por discrepancia sistema vs reporte Z
        if (discrepanciaUsd > 0) {
          let severidad: 'leve' | 'media' | 'alta'
          let mensaje: string

          if (discrepanciaUsd <= 5) {
            severidad = 'leve'
            mensaje = `Discrepancia leve de $${discrepanciaUsd.toFixed(2)} USD entre sistema y Reporte Z - Cajero: ${cajeroNombre}`
          } else if (discrepanciaUsd <= 15) {
            severidad = 'media'
            mensaje = `Discrepancia media de $${discrepanciaUsd.toFixed(2)} USD entre sistema y Reporte Z - Cajero: ${cajeroNombre}`
          } else {
            severidad = 'alta'
            mensaje = `Discrepancia alta de $${discrepanciaUsd.toFixed(2)} USD entre sistema y Reporte Z - Cajero: ${cajeroNombre}`
          }

          alertas.push({
            cierre,
            tipoAlerta: 'discrepancia_reporte_z' as const,
            severidad,
            mensaje
          })
        }

        // Alerta por falta de detalles de cierre
        if (!cierre.detallesEfectivo) {
          alertas.push({
            cierre,
            tipoAlerta: 'sin_detalles' as const,
            severidad: 'leve' as const,
            mensaje: `Cierre sin detalles de efectivo registrados - Cajero: ${cajeroNombre}`
          })
        }
      }

      // Ordenar por severidad
      alertas.sort((a, b) => {
        const severidadOrden = { alta: 3, media: 2, leve: 1 }
        return severidadOrden[b.severidad] - severidadOrden[a.severidad]
      })

      return { data: alertas, error: null }
    } catch (err) {
      console.error('Error getting alertas discrepancias:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener alertas de discrepancias') }
    }
  }
}

export const cierresCajaService = new CierresCajaService()