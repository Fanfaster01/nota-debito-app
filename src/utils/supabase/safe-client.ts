// src/utils/supabase/safe-client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Configuración de debugging
const DEBUG_MODE = process.env.NODE_ENV === 'development'
const MONITORED_TABLES: (keyof Database['public']['Tables'])[] = ['creditos_caja']

// Helper para logging condicional
const debugLog = (message: string, data?: unknown) => {
  if (DEBUG_MODE) {
    console.log(`[Supabase Safe Client] ${message}`, data || '')
  }
}

/**
 * Cliente Supabase con debugging y type safety mejorado
 * Monitorea tablas específicas para debugging en desarrollo
 */
export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Interceptar el método from para debugging en tablas monitoreadas
  const originalFrom = client.from.bind(client)
  
  // Type-safe override del método from
  client.from = function(table: keyof Database['public']['Tables']) {
    const tableClient = originalFrom(table)
    
    // Solo aplicar debugging a tablas monitoreadas
    if (MONITORED_TABLES.includes(table)) {
      debugLog(`Creating query for ${table} table`)
      
      // Interceptar el método select con logging básico
      const originalSelect = tableClient.select.bind(tableClient)
      tableClient.select = function(columns?: string, options?: Record<string, unknown>) {
        debugLog(`Select called on ${table}`, { columns, options })
        
        try {
          return originalSelect(columns, options)
        } catch (error) {
          debugLog(`Error in select for ${table}`, error)
          throw error
        }
      }
    }
    
    return tableClient
  }

  return client;
}