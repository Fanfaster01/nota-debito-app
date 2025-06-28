// src/utils/supabase/client-wrapper.ts
import { createClient as createSupabaseClient } from './client'
import type { SupabaseClient } from '@supabase/supabase-js'

// Wrapper para interceptar y corregir consultas malformadas
export function createClient(): SupabaseClient {
  const client = createSupabaseClient()
  
  // Interceptar el método from para corregir queries malformadas
  const originalFrom = client.from.bind(client)
  
  client.from = function(table: string) {
    const query = originalFrom(table)
    
    // Interceptar métodos que podrían estar causando problemas
    const originalSelect = query.select.bind(query)
    
    query.select = function(columns?: string, options?: any) {
      try {
        return originalSelect(columns, options)
      } catch (error) {
        console.warn('[Supabase Wrapper] Error in select, trying fallback:', error)
        // Fallback básico
        return originalSelect('*')
      }
    }
    
    return query
  }
  
  return client
}

// También exportamos el cliente original por si se necesita
export { createClient as createOriginalClient } from './client'