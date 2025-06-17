// Servicio para consultar tasas de cambio de APIs públicas
import type { TasaCambio, TasaCambioManual } from '@/types/cuentasPorPagar'

class TasasCambioService {
  private readonly BCV_API_URL = 'https://bcv-api.deno.dev/v2/rates'
  private readonly BACKUP_API_URL = 'https://api.exchangerate-api.com/v4/latest/VES'

  /**
   * Obtener tasa de cambio USD por fecha específica
   * Si no se proporciona fecha o no está disponible, devuelve la tasa actual
   */
  async getTasaUSDPorFecha(fecha?: string): Promise<{ data: TasaCambio | null; error: string | null }> {
    // Por ahora, las APIs públicas no tienen histórico, así que devolvemos la tasa actual
    // En el futuro se podría implementar una tabla de tasas históricas en Supabase
    return this.getTasaUSD()
  }

  /**
   * Obtener tasa de cambio USD desde el BCV
   */
  async getTasaUSD(): Promise<{ data: TasaCambio | null; error: string | null }> {
    try {
      // Intentar con API del BCV primero
      const response = await fetch(this.BCV_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error del BCV API: ${response.status}`)
      }

      const data = await response.json()
      
      // La API del BCV retorna algo como: { "usd": { "rate": 36.50, "date": "2024-01-15" } }
      if (data.usd && data.usd.rate) {
        const tasa: TasaCambio = {
          moneda: 'USD',
          tasa: parseFloat(data.usd.rate),
          fecha: data.usd.date || new Date().toISOString().split('T')[0],
          fuente: 'BCV'
        }
        return { data: tasa, error: null }
      }

      throw new Error('Formato de respuesta inválido del BCV')
    } catch (error) {
      console.warn('Error con API del BCV, intentando con API de respaldo:', error)
      
      // Intentar con API de respaldo
      try {
        const backupResponse = await fetch(this.BACKUP_API_URL)
        if (!backupResponse.ok) {
          throw new Error(`Error del API de respaldo: ${backupResponse.status}`)
        }

        const backupData = await backupResponse.json()
        
        // Esta API retorna: { "rates": { "USD": 0.027 }, "date": "2024-01-15" }
        // Necesitamos invertir la tasa (VES/USD -> USD/VES)
        if (backupData.rates && backupData.rates.USD) {
          const tasaInvertida = 1 / backupData.rates.USD
          const tasa: TasaCambio = {
            moneda: 'USD',
            tasa: parseFloat(tasaInvertida.toFixed(2)),
            fecha: backupData.date || new Date().toISOString().split('T')[0],
            fuente: 'ExchangeRate-API'
          }
          return { data: tasa, error: null }
        }

        throw new Error('Formato de respuesta inválido del API de respaldo')
      } catch (backupError) {
        console.error('Error con API de respaldo:', backupError)
        return { 
          data: null, 
          error: 'No se pudo obtener la tasa de cambio USD. Verifique su conexión a internet.' 
        }
      }
    }
  }

  /**
   * Obtener tasa de cambio EUR
   */
  async getTasaEUR(): Promise<{ data: TasaCambio | null; error: string | null }> {
    try {
      // Para EUR, usamos una API que nos dé EUR/VES
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Error de API EUR: ${response.status}`)
      }

      const data = await response.json()

      // Esta API retorna: { "rates": { "VES": 39.85 }, "date": "2024-01-15" }
      if (data.rates && data.rates.VES) {
        const tasa: TasaCambio = {
          moneda: 'EUR',
          tasa: parseFloat(data.rates.VES),
          fecha: data.date || new Date().toISOString().split('T')[0],
          fuente: 'ExchangeRate-API'
        }
        return { data: tasa, error: null }
      }

      throw new Error('No se encontró la tasa EUR/VES')
    } catch (error) {
      console.error('Error al obtener tasa EUR:', error)
      
      // Intentar calcular EUR basado en USD
      try {
        const usdResult = await this.getTasaUSD()
        if (usdResult.data) {
          // Obtener EUR/USD y calcular EUR/VES
          const eurUsdResponse = await fetch('https://api.exchangerate-api.com/v4/latest/EUR')
          const eurUsdData = await eurUsdResponse.json()
          
          if (eurUsdData.rates && eurUsdData.rates.USD) {
            const eurToUsd = eurUsdData.rates.USD
            const tasaEurVes = usdResult.data.tasa * eurToUsd
            
            const tasa: TasaCambio = {
              moneda: 'EUR',
              tasa: parseFloat(tasaEurVes.toFixed(2)),
              fecha: new Date().toISOString().split('T')[0],
              fuente: 'Calculado (USD*EUR/USD)'
            }
            return { data: tasa, error: null }
          }
        }
      } catch (calcError) {
        console.error('Error al calcular EUR:', calcError)
      }

      return { 
        data: null, 
        error: 'No se pudo obtener la tasa de cambio EUR. Verifique su conexión a internet.' 
      }
    }
  }

  /**
   * Obtener ambas tasas de cambio (USD y EUR)
   */
  async getTodasLasTasas(): Promise<{ 
    data: { usd: TasaCambio | null; eur: TasaCambio | null } | null; 
    error: string | null 
  }> {
    try {
      const [usdResult, eurResult] = await Promise.allSettled([
        this.getTasaUSD(),
        this.getTasaEUR()
      ])

      const tasas = {
        usd: usdResult.status === 'fulfilled' && usdResult.value.data ? usdResult.value.data : null,
        eur: eurResult.status === 'fulfilled' && eurResult.value.data ? eurResult.value.data : null
      }

      const errores = []
      if (usdResult.status === 'rejected' || !tasas.usd) {
        errores.push('Error USD: ' + (usdResult.status === 'fulfilled' ? usdResult.value.error : 'Rejected'))
      }
      if (eurResult.status === 'rejected' || !tasas.eur) {
        errores.push('Error EUR: ' + (eurResult.status === 'fulfilled' ? eurResult.value.error : 'Rejected'))
      }

      return { 
        data: tasas, 
        error: errores.length > 0 ? errores.join('; ') : null 
      }
    } catch (error) {
      console.error('Error al obtener todas las tasas:', error)
      return { 
        data: null, 
        error: 'Error general al obtener las tasas de cambio' 
      }
    }
  }

  /**
   * Validar y crear tasa manual para PAR (paralelo)
   */
  async crearTasaManual(
    tasa: number,
    usuario: string,
    notas?: string
  ): Promise<{ data: TasaCambioManual | null; error: string | null }> {
    try {
      if (!tasa || tasa <= 0) {
        throw new Error('La tasa debe ser un número positivo')
      }

      if (tasa < 10 || tasa > 200) {
        throw new Error('La tasa parece estar fuera del rango esperado (10-200 Bs/USD)')
      }

      const tasaManual: TasaCambioManual = {
        moneda: 'PAR',
        tasa: parseFloat(tasa.toFixed(2)),
        fecha: new Date().toISOString().split('T')[0],
        usuario,
        notas
      }

      return { data: tasaManual, error: null }
    } catch (error) {
      console.error('Error al crear tasa manual:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Error al crear la tasa manual' 
      }
    }
  }

  /**
   * Obtener tasa según el tipo de cambio del proveedor
   */
  async getTasaSegunTipo(
    tipoCambio: 'USD' | 'EUR' | 'PAR',
    tasaManual?: number,
    usuario?: string
  ): Promise<{ data: TasaCambio | TasaCambioManual | null; error: string | null }> {
    try {
      switch (tipoCambio) {
        case 'USD':
          return await this.getTasaUSD()
        
        case 'EUR':
          return await this.getTasaEUR()
        
        case 'PAR':
          if (!tasaManual || !usuario) {
            throw new Error('Para tipo PAR se requiere tasa manual y usuario')
          }
          return await this.crearTasaManual(tasaManual, usuario)
        
        default:
          throw new Error(`Tipo de cambio no válido: ${tipoCambio}`)
      }
    } catch (error) {
      console.error('Error al obtener tasa según tipo:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Error al obtener la tasa' 
      }
    }
  }

  /**
   * Verificar si las tasas están actualizadas (menos de 24 horas)
   */
  esTasaActualizada(fecha: string): boolean {
    const fechaTasa = new Date(fecha)
    const ahora = new Date()
    const diferencia = ahora.getTime() - fechaTasa.getTime()
    const horas24 = 24 * 60 * 60 * 1000

    return diferencia < horas24
  }

  /**
   * Formatear tasa para mostrar
   */
  formatearTasa(tasa: number, moneda: 'USD' | 'EUR' | 'PAR'): string {
    const simbolo = moneda === 'EUR' ? '€' : '$'
    return `Bs. ${tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${simbolo}1`
  }

  /**
   * Obtener historial de tasas (cache local)
   */
  private historialTasas: Map<string, TasaCambio | TasaCambioManual> = new Map()

  guardarTasaEnCache(tasa: TasaCambio | TasaCambioManual): void {
    const clave = `${tasa.moneda}_${tasa.fecha}`
    this.historialTasas.set(clave, tasa)
  }

  obtenerTasaDelCache(moneda: 'USD' | 'EUR' | 'PAR', fecha: string): TasaCambio | TasaCambioManual | null {
    const clave = `${moneda}_${fecha}`
    return this.historialTasas.get(clave) || null
  }

  limpiarCache(): void {
    this.historialTasas.clear()
  }
}

export const tasasCambioService = new TasasCambioService()