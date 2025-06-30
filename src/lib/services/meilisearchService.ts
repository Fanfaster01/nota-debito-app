// src/lib/services/meilisearchService.ts

import { MeiliSearch, type SearchResponse } from 'meilisearch'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'
import { validate, assertValid } from '@/utils/validators'
import type { ProductoMaestro, ProductoLista } from '@/types/comparadorPrecios'

interface ProductoIndexado {
  id: string
  companyId: string
  codigo: string
  nombre: string
  nombreNormalizado: string
  nombresBusqueda: string[]
  presentacion: string
  unidadMedida: string
  categoria: string
  marca?: string
  activo: boolean
}

interface ResultadoMatch {
  producto: ProductoMaestro
  score: number
  matches: string[]
}

type MeilisearchHit = ProductoIndexado & {
  _rankingScore?: number
  _formatted?: Record<string, unknown>
}

interface MeilisearchStats {
  numberOfDocuments: number
  isIndexing: boolean
  fieldDistribution: Record<string, number>
}

export class MeilisearchService {
  private client: MeiliSearch
  private readonly indexName = 'productos_maestro'

  constructor() {
    const host = process.env.NEXT_PUBLIC_MEILISEARCH_URL
    const apiKey = process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_API_KEY
    const adminKey = process.env.NEXT_PUBLIC_MEILISEARCH_ADMIN_API_KEY

    if (!host) {
      throw new Error('MEILISEARCH_URL no está configurada')
    }

    // Usar admin key para operaciones de indexación, search key para búsquedas
    this.client = new MeiliSearch({
      host,
      apiKey: adminKey || apiKey
    })
  }

  // ====== CONFIGURACIÓN DE ÍNDICE ======

  async configurarIndice(): Promise<{ data: null, error: unknown }> {
    try {
      const index = this.client.index(this.indexName)
      
      // Configurar atributos de búsqueda
      await index.updateSearchableAttributes([
        'nombre',
        'nombreNormalizado', 
        'nombresBusqueda',
        'codigo',
        'marca',
        'categoria'
      ])

      // Configurar atributos para filtros
      await index.updateFilterableAttributes([
        'companyId',
        'activo',
        'categoria',
        'marca'
      ])

      // Configurar atributos para ordenamiento
      await index.updateSortableAttributes([
        'nombre',
        'codigo',
        'categoria'
      ])

      // Configurar configuración de búsqueda
      await index.updateSettings({
        // Tolerancia a errores tipográficos (perfecto para español)
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 3,
            twoTypos: 5
          }
        },
        // Configuración de proximidad
        proximityPrecision: 'byWord',
        // Separadores de palabras (incluir caracteres españoles)
        separatorTokens: ['-', '_', '.', '/', '\\', '@', '#', '&'],
        // Palabras vacías en español
        stopWords: ['de', 'del', 'la', 'el', 'en', 'con', 'por', 'para', 'y', 'o']
      })

      return createSuccessResponse(null)
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al configurar índice de Meilisearch'))
    }
  }

  // ====== INDEXACIÓN DE PRODUCTOS ======

  async indexarProductos(
    companyId: string, 
    productos: ProductoMaestro[]
  ): Promise<{ data: { taskUid: number } | null, error: unknown }> {
    try {
      assertValid(validate.companyId(companyId), 'Company ID')

      const index = this.client.index(this.indexName)
      
      // Convertir productos al formato de índice
      const productosIndexados: ProductoIndexado[] = productos.map(producto => ({
        id: producto.id,
        companyId: producto.companyId,
        codigo: producto.codigo,
        nombre: producto.nombre,
        nombreNormalizado: this.normalizarTexto(producto.nombre),
        nombresBusqueda: producto.nombresBusqueda.map(nombre => this.normalizarTexto(nombre)),
        presentacion: producto.presentacion,
        unidadMedida: producto.unidadMedida,
        categoria: producto.categoria,
        marca: producto.marca || undefined,
        activo: producto.activo
      }))

      // Indexar productos
      const task = await index.addDocuments(productosIndexados, {
        primaryKey: 'id'
      })

      return createSuccessResponse({ taskUid: task.taskUid })
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al indexar productos'))
    }
  }

  async actualizarProducto(producto: ProductoMaestro): Promise<{ data: { taskUid: number } | null, error: unknown }> {
    try {
      const index = this.client.index(this.indexName)
      
      const productoIndexado: ProductoIndexado = {
        id: producto.id,
        companyId: producto.companyId,
        codigo: producto.codigo,
        nombre: producto.nombre,
        nombreNormalizado: this.normalizarTexto(producto.nombre),
        nombresBusqueda: producto.nombresBusqueda.map(nombre => this.normalizarTexto(nombre)),
        presentacion: producto.presentacion,
        unidadMedida: producto.unidadMedida,
        categoria: producto.categoria,
        marca: producto.marca || undefined,
        activo: producto.activo
      }

      const task = await index.updateDocuments([productoIndexado])
      return createSuccessResponse({ taskUid: task.taskUid })
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al actualizar producto'))
    }
  }

  async eliminarProducto(productoId: string): Promise<{ data: { taskUid: number } | null, error: unknown }> {
    try {
      const index = this.client.index(this.indexName)
      const task = await index.deleteDocument(productoId)
      return createSuccessResponse({ taskUid: task.taskUid })
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al eliminar producto'))
    }
  }

  // ====== BÚSQUEDA Y MATCHING ======

  async buscarProducto(
    companyId: string,
    consulta: string,
    limite: number = 5,
    umbralScore: number = 0.7
  ): Promise<{ data: ResultadoMatch[] | null, error: unknown }> {
    try {
      assertValid(validate.companyId(companyId), 'Company ID')

      const index = this.client.index(this.indexName)
      
      // Normalizar consulta
      const consultaNormalizada = this.normalizarTexto(consulta)
      
      // Realizar búsqueda con filtros
      const results = await index.search(consultaNormalizada, {
        filter: [`companyId = "${companyId}"`, 'activo = true'],
        limit: limite,
        attributesToHighlight: ['nombre', 'nombresBusqueda', 'codigo', 'marca'],
        showMatchesPosition: true,
        showRankingScore: true
      })

      // Procesar resultados y aplicar umbral
      const matches: ResultadoMatch[] = (results.hits as MeilisearchHit[])
        .filter((hit) => (hit._rankingScore || 0) >= umbralScore)
        .map((hit) => ({
          producto: {
            id: hit.id,
            companyId: hit.companyId,
            codigo: hit.codigo,
            nombre: hit.nombre,
            nombresBusqueda: hit.nombresBusqueda || [],
            presentacion: hit.presentacion,
            unidadMedida: hit.unidadMedida,
            categoria: hit.categoria,
            marca: hit.marca,
            activo: hit.activo,
            createdAt: new Date(), // Se debe obtener de BD si es necesario
            updatedAt: new Date()
          },
          score: hit._rankingScore || 0,
          matches: this.extraerMatches(hit._formatted || {})
        }))

      return createSuccessResponse(matches)
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error en búsqueda de productos'))
    }
  }

  async encontrarMejorMatch(
    companyId: string,
    productoLista: ProductoLista,
    umbralMinimo: number = 0.7
  ): Promise<{ data: ProductoMaestro | null, error: unknown }> {
    try {
      const nombreBusqueda = productoLista.nombreOriginal
      
      // Intentar múltiples estrategias de búsqueda
      const estrategias = [
        // 1. Búsqueda por código si existe
        productoLista.codigoOriginal ? { 
          query: productoLista.codigoOriginal, 
          boost: 0.3,
          attributesToSearchOn: ['codigo']
        } : null,
        
        // 2. Búsqueda por nombre completo
        { 
          query: nombreBusqueda, 
          boost: 0.5,
          attributesToSearchOn: ['nombre', 'nombreNormalizado', 'nombresBusqueda']
        },
        
        // 3. Búsqueda con marca si existe
        productoLista.marca ? {
          query: `${nombreBusqueda} ${productoLista.marca}`,
          boost: 0.2,
          attributesToSearchOn: ['nombre', 'nombresBusqueda', 'marca']
        } : null
      ].filter(Boolean)

      let mejorMatch: ResultadoMatch | null = null
      let mejorScore = 0

      for (const estrategia of estrategias) {
        if (!estrategia) continue

        const { data: resultados, error } = await this.buscarProducto(
          companyId,
          estrategia.query,
          3, // Pocos resultados por estrategia
          umbralMinimo * 0.8 // Umbral más bajo para permitir combinación
        )

        if (error || !resultados) continue

        for (const resultado of resultados) {
          // Aplicar boost de estrategia
          const scoreAjustado = resultado.score + estrategia.boost

          // Bonus adicionales
          let bonusTotal = 0

          // Bonus por código exacto
          if (productoLista.codigoOriginal && resultado.producto.codigo &&
              productoLista.codigoOriginal.toLowerCase() === resultado.producto.codigo.toLowerCase()) {
            bonusTotal += 0.25
          }

          // Bonus por marca exacta
          if (productoLista.marca && resultado.producto.marca &&
              productoLista.marca.toLowerCase() === resultado.producto.marca.toLowerCase()) {
            bonusTotal += 0.15
          }

          const scoreFinal = Math.min(1.0, scoreAjustado + bonusTotal)

          if (scoreFinal > mejorScore && scoreFinal >= umbralMinimo) {
            mejorScore = scoreFinal
            mejorMatch = { ...resultado, score: scoreFinal }
          }
        }
      }

      return createSuccessResponse(mejorMatch?.producto || null)
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al encontrar mejor match'))
    }
  }

  // ====== MÉTODOS AUXILIARES ======

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD') // Descomponer caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
  }

  private extraerMatches(formatted: Record<string, unknown>): string[] {
    const matches: string[] = []
    
    Object.values(formatted).forEach(value => {
      if (typeof value === 'string' && value.includes('<em>')) {
        // Extraer texto resaltado entre <em> tags
        const highlighted = value.match(/<em>(.*?)<\/em>/g) || []
        highlighted.forEach(match => {
          const text = match.replace(/<\/?em>/g, '')
          if (text && !matches.includes(text)) {
            matches.push(text)
          }
        })
      }
    })

    return matches
  }

  // ====== MÉTODOS DE GESTIÓN ======

  async verificarEstado(): Promise<{ data: { healthy: boolean, stats?: MeilisearchStats } | null, error: unknown }> {
    try {
      const health = await this.client.health()
      const index = this.client.index(this.indexName)
      const stats = await index.getStats()
      
      return createSuccessResponse({
        healthy: health.status === 'available',
        stats
      })
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al verificar estado de Meilisearch'))
    }
  }

  async limpiarIndice(companyId: string): Promise<{ data: { taskUid: number } | null, error: unknown }> {
    try {
      assertValid(validate.companyId(companyId), 'Company ID')

      const index = this.client.index(this.indexName)
      
      // Eliminar todos los documentos de una compañía específica
      const task = await index.deleteDocuments({
        filter: `companyId = "${companyId}"`
      })

      return createSuccessResponse({ taskUid: task.taskUid })
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al limpiar índice'))
    }
  }
}

export const meilisearchService = new MeilisearchService()