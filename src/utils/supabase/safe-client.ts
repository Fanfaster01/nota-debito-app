// src/utils/supabase/safe-client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Interceptar el método from para debugging
  const originalFrom = client.from.bind(client);
  
  (client as any).from = function(table: keyof Database['public']['Tables']) {
    const tableClient = originalFrom(table);
    
    if (table === 'creditos_caja') {
      console.log('[Supabase Safe Client] Creating query for creditos_caja table');
      
      // Interceptar el método select
      const originalSelect = tableClient.select.bind(tableClient);
      (tableClient as any).select = function(...args: any[]) {
        console.log('[Supabase Safe Client] Select called with:', args);
        const selectClient = originalSelect(...args);
        
        // Interceptar el método eq si existe
        const originalEq = selectClient.eq?.bind(selectClient);
        if (originalEq) {
          (selectClient as any).eq = function(column: string, value: any) {
            console.log('[Supabase Safe Client] .eq() called with:', { column, value });
            // Si alguien intenta usar .eq('estado', 'pendiente'), funciona normalmente
            return originalEq(column, value);
          };
        }
        
        return selectClient;
      };
    }
    
    return tableClient;
  };

  return client;
}