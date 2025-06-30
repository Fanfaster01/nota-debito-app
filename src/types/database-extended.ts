// src/types/database-extended.ts

import type { Database } from './database'

// Extensión temporal del schema de database para las nuevas tablas
export interface DatabaseExtended extends Database {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      listas_precio: {
        Row: {
          id: string
          company_id: string
          proveedor_id: string | null
          proveedor_nombre: string
          fecha_lista: string
          fecha_carga: string
          moneda: 'USD' | 'BS'
          tasa_cambio: number | null
          archivo_original: string
          formato_archivo: 'xlsx' | 'xls' | 'csv'
          estado_procesamiento: 'pendiente' | 'procesando' | 'completado' | 'error'
          productos_extraidos: number
          configuracion_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          proveedor_id?: string | null
          proveedor_nombre: string
          fecha_lista: string
          fecha_carga?: string
          moneda: 'USD' | 'BS'
          tasa_cambio?: number | null
          archivo_original: string
          formato_archivo: 'xlsx' | 'xls' | 'csv'
          estado_procesamiento?: 'pendiente' | 'procesando' | 'completado' | 'error'
          productos_extraidos?: number
          configuracion_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          proveedor_id?: string | null
          proveedor_nombre?: string
          fecha_lista?: string
          fecha_carga?: string
          moneda?: 'USD' | 'BS'
          tasa_cambio?: number | null
          archivo_original?: string
          formato_archivo?: 'xlsx' | 'xls' | 'csv'
          estado_procesamiento?: 'pendiente' | 'procesando' | 'completado' | 'error'
          productos_extraidos?: number
          configuracion_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      productos_lista: {
        Row: {
          id: string
          lista_precio_id: string
          codigo_original: string | null
          nombre_original: string
          nombre_normalizado: string | null
          presentacion: string | null
          unidad_medida: string | null
          precio_unitario: number
          precio_moneda_original: number
          moneda: 'USD' | 'BS'
          categoria: string | null
          marca: string | null
          observaciones: string | null
          confianza_extraccion: number | null
          matching_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lista_precio_id: string
          codigo_original?: string | null
          nombre_original: string
          nombre_normalizado?: string | null
          presentacion?: string | null
          unidad_medida?: string | null
          precio_unitario: number
          precio_moneda_original: number
          moneda: 'USD' | 'BS'
          categoria?: string | null
          marca?: string | null
          observaciones?: string | null
          confianza_extraccion?: number | null
          matching_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lista_precio_id?: string
          codigo_original?: string | null
          nombre_original?: string
          nombre_normalizado?: string | null
          presentacion?: string | null
          unidad_medida?: string | null
          precio_unitario?: number
          precio_moneda_original?: number
          moneda?: 'USD' | 'BS'
          categoria?: string | null
          marca?: string | null
          observaciones?: string | null
          confianza_extraccion?: number | null
          matching_id?: string | null
          created_at?: string
        }
      }
      productos_maestro: {
        Row: {
          id: string
          company_id: string
          codigo: string
          nombre: string
          nombres_busqueda: string[]
          presentacion: string
          unidad_medida: string
          categoria: string
          marca: string | null
          activo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          codigo: string
          nombre: string
          nombres_busqueda?: string[]
          presentacion: string
          unidad_medida: string
          categoria: string
          marca?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          codigo?: string
          nombre?: string
          nombres_busqueda?: string[]
          presentacion?: string
          unidad_medida?: string
          categoria?: string
          marca?: string | null
          activo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comparaciones_precios: {
        Row: {
          id: string
          company_id: string
          fecha_comparacion: string
          listas_comparadas: string[]
          total_productos: number
          productos_matcheados: number
          tasa_matcheo: number
          estado_comparacion: 'pendiente' | 'procesando' | 'completado' | 'error'
          resultados_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          fecha_comparacion?: string
          listas_comparadas: string[]
          total_productos?: number
          productos_matcheados?: number
          tasa_matcheo?: number
          estado_comparacion?: 'pendiente' | 'procesando' | 'completado' | 'error'
          resultados_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          fecha_comparacion?: string
          listas_comparadas?: string[]
          total_productos?: number
          productos_matcheados?: number
          tasa_matcheo?: number
          estado_comparacion?: 'pendiente' | 'procesando' | 'completado' | 'error'
          resultados_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      resultados_comparacion: {
        Row: {
          id: string
          comparacion_id: string
          producto_maestro_id: string | null
          producto_nombre: string
          presentacion: string | null
          precios: unknown // JSON
          mejor_precio: unknown // JSON
          diferencia_porcentual: number | null
          alerta_precio: 'subida_anormal' | 'bajada_anormal' | null
          created_at: string
        }
        Insert: {
          id?: string
          comparacion_id: string
          producto_maestro_id?: string | null
          producto_nombre: string
          presentacion?: string | null
          precios: unknown // JSON
          mejor_precio: unknown // JSON
          diferencia_porcentual?: number | null
          alerta_precio?: 'subida_anormal' | 'bajada_anormal' | null
          created_at?: string
        }
        Update: {
          id?: string
          comparacion_id?: string
          producto_maestro_id?: string | null
          producto_nombre?: string
          presentacion?: string | null
          precios?: unknown // JSON
          mejor_precio?: unknown // JSON
          diferencia_porcentual?: number | null
          alerta_precio?: 'subida_anormal' | 'bajada_anormal' | null
          created_at?: string
        }
      }
      procesamiento_ia: {
        Row: {
          id: string
          lista_precio_id: string | null
          tipo_operacion: 'extraccion' | 'matching'
          modelo: string
          tokens_usados: number
          costo_estimado: number | null
          tiempo_procesamiento: number | null
          exitoso: boolean
          error: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lista_precio_id?: string | null
          tipo_operacion: 'extraccion' | 'matching'
          modelo: string
          tokens_usados: number
          costo_estimado?: number | null
          tiempo_procesamiento?: number | null
          exitoso?: boolean
          error?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lista_precio_id?: string | null
          tipo_operacion?: 'extraccion' | 'matching'
          modelo?: string
          tokens_usados?: number
          costo_estimado?: number | null
          tiempo_procesamiento?: number | null
          exitoso?: boolean
          error?: string | null
          created_at?: string
        }
      }
    }
  }
}