// src/utils/supabase/error-interceptor.ts

export function setupSupabaseErrorInterceptor() {
  // Interceptor simplificado para errores críticos de Supabase
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const [resource] = args;
    const config = args[1];
    const url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.href : (resource as Request)?.url);
    
    // Si no hay URL válida, pasar al fetch original
    if (!url || typeof url !== 'string') {
      return originalFetch.apply(this, args);
    }
    
    try {
      const response = await originalFetch.apply(this, [resource, config]);
      
      // Solo loggear errores 400 críticos de Supabase
      if (!response.ok && url.includes('supabase.co/rest/v1/') && response.status === 400) {
        try {
          const errorData = await response.clone().json();
          console.error('[Supabase] Bad Request Error:', {
            url: url.split('?')[0], // Solo la ruta base para evitar logs largos
            status: response.status,
            error: errorData.message || 'Unknown error'
          });
        } catch {
          // No se pudo parsear el error
        }
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };
}