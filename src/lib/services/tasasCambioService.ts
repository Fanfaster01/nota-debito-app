// Servicio para consultar tasas de cambio de APIs públicas
import type { TasaCambio, TasaCambioManual } from '@/types/cuentasPorPagar'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'

class TasasCambioService {
  // API principal más confiable
  private readonly PRIMARY_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD'
  // API de respaldo
  private readonly BACKUP_API_URL = 'https://api.fixer.io/latest?access_key=YOUR_API_KEY&base=USD&symbols=VES'
  // API gratuita adicional
  private readonly FREE_API_URL = 'https://open.er-api.com/v6/latest/USD'

  // Cache simple para evitar requests duplicados
  private cacheRequests: Map<string, Promise<{ data: TasaCambio | null; error: string | null }>> = new Map()
  private ultimaTasaCache: { tasa: TasaCambio | null; timestamp: number } | null = null

  /**
   * Obtener tasa de cambio USD por fecha específica
   * Si no se proporciona fecha o no está disponible, devuelve la tasa actual
   */
  async getTasaUSDPorFecha(fecha?: string): Promise<{ data: TasaCambio | null; error: string | null }> {
    // Por ahora, las APIs públicas no tienen histórico, así que devolvemos la tasa actual
    // En el futuro se podría implementar una tabla de tasas históricas en Supabase
    
    // Verificar cache (válido por 5 minutos)
    const ahora = Date.now()
    if (this.ultimaTasaCache && (ahora - this.ultimaTasaCache.timestamp) < 5 * 60 * 1000) {
      console.log('Usando tasa USD desde cache')
      return { data: this.ultimaTasaCache.tasa, error: null }
    }
    
    return this.getTasaUSD()
  }

  /**
   * Obtener tasa de cambio USD desde APIs públicas
   */
  async getTasaUSD(): Promise<{ data: TasaCambio | null; error: string | null }> {
    // Lista de APIs para intentar en orden
    const apis = [
      {
        url: this.PRIMARY_API_URL,
        nombre: 'ExchangeRate-API',
        procesarRespuesta: (data: any) => {
          if (data.rates && data.rates.VES) {
            return {
              moneda: 'USD' as const,
              tasa: parseFloat(data.rates.VES),
              fecha: data.date || new Date().toISOString().split('T')[0],
              fuente: 'ExchangeRate-API'
            }
          }
          return null
        }
      },
      {
        url: this.FREE_API_URL,
        nombre: 'Open Exchange Rates',
        procesarRespuesta: (data: any) => {
          if (data.rates && data.rates.VES) {
            return {
              moneda: 'USD' as const,
              tasa: parseFloat(data.rates.VES),
              fecha: data.time_last_update_utc ? new Date(data.time_last_update_utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              fuente: 'Open Exchange Rates'
            }
          }
          return null
        }
      }
    ]

    for (const api of apis) {
      try {
        console.log(`Intentando obtener tasa USD desde ${api.nombre}...`)
        
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}`)
        }

        const data = await response.json()
        const tasa = api.procesarRespuesta(data)
        
        if (tasa) {
          console.log(`Tasa USD obtenida exitosamente desde ${api.nombre}: ${tasa.tasa}`)
          // Guardar en cache
          this.ultimaTasaCache = { tasa, timestamp: Date.now() }
          return { data: tasa, error: null }
        }

        throw new Error('Formato de respuesta inválido')
      } catch (error) {
        console.warn(`Error con ${api.nombre}:`, error)
        continue
      }
    }

    // Si ninguna API funcionó, devolver tasa por defecto
    console.warn('No se pudo obtener tasa USD de ninguna API, usando tasa por defecto')
    const tasaDefecto: TasaCambio = {
      moneda: 'USD',
      tasa: 36.50, // Tasa por defecto aproximada
      fecha: new Date().toISOString().split('T')[0],
      fuente: 'Valor por defecto'
    }
    
    return { 
      data: tasaDefecto, 
      error: 'No se pudo obtener la tasa USD actual. Se está usando una tasa por defecto.' 
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
      console.error('Error al obtener tasa EUR:', handleServiceError(error, 'Error al obtener tasa EUR'))
      
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
        console.error('Error al calcular EUR:', handleServiceError(calcError, 'Error al calcular EUR'))
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
      console.error('Error al obtener todas las tasas:', handleServiceError(error, 'Error al obtener todas las tasas'))
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
      console.error('Error al crear tasa manual:', handleServiceError(error, 'Error al crear tasa manual'))
      return { 
        data: null, 
        error: handleServiceError(error, 'Error al crear la tasa manual') 
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
      console.error('Error al obtener tasa según tipo:', handleServiceError(error, 'Error al obtener tasa según tipo'))
      return { 
        data: null, 
        error: handleServiceError(error, 'Error al obtener la tasa') 
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