// src/utils/supabase/client-wrapper.ts
import { createClient as createSupabaseClient } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleServiceError } from '@/utils/errorHandler'

// Configuración de logging (solo en desarrollo)
const isDevMode = process.env.NODE_ENV === 'development'

/**
 * Wrapper para interceptar y corregir consultas malformadas de Supabase
 * Proporciona fallbacks seguros en caso de errores de consulta
 */
export function createClient(): SupabaseClient {
  const client = createSupabaseClient()
  
  // Interceptar el método from para corregir queries malformadas
  const originalFrom = client.from.bind(client)
  
  client.from = function(table: string) {
    const query = originalFrom(table)
    
    // Interceptar métodos que podrían estar causando problemas
    const originalSelect = query.select.bind(query)
    
    query.select = function(columns?: string, options?: Record<string, unknown>) {
      try {
        return originalSelect(columns, options)
      } catch (error) {
        if (isDevMode) {
          console.warn('[Supabase Wrapper] Error in select, trying fallback:', handleServiceError(error))
        }
        
        // Fallback seguro: intentar con selección básica
        try {
          return originalSelect('*')
        } catch (fallbackError) {
          if (isDevMode) {
            console.error('[Supabase Wrapper] Fallback also failed:', handleServiceError(fallbackError))
          }
          // Re-lanzar el error original si el fallback también falla
          throw error
        }
      }
    }
    
    return query
  }
  
  return client
}

// También exportamos el cliente original por si se necesita
export { createClient as createOriginalClient } from './client'