// src/utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Custom fetch implementation to bypass Chrome extension interference
const createBypassFetch = () => {
  const originalFetch = globalThis.fetch
  
  return async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    try {
      // First, try the original fetch
      return await originalFetch(url, options)
    } catch (error) {
      // If it fails and we detect it's a Chrome extension issue, use XMLHttpRequest fallback
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('[Supabase Client] Chrome extension detected interfering with fetch, using XMLHttpRequest fallback')
        
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          const method = options?.method || 'GET'
          
          xhr.open(method, url.toString())
          
          // Set headers
          if (options?.headers) {
            if (options.headers instanceof Headers) {
              options.headers.forEach((value, key) => {
                xhr.setRequestHeader(key, value)
              })
            } else if (Array.isArray(options.headers)) {
              options.headers.forEach(([key, value]) => {
                xhr.setRequestHeader(key, value)
              })
            } else {
              Object.entries(options.headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                  xhr.setRequestHeader(key, value)
                }
              })
            }
          }
          
          // Handle response
          xhr.onload = () => {
            const headers = new Headers()
            xhr.getAllResponseHeaders().split('\r\n').forEach(line => {
              const [key, value] = line.split(': ')
              if (key && value) {
                headers.append(key.trim(), value.trim())
              }
            })
            
            const response = new Response(xhr.responseText, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers
            })
            resolve(response)
          }
          
          xhr.onerror = () => {
            console.error('[Supabase Client] XMLHttpRequest also failed')
            reject(new Error('Network Error - Both fetch and XMLHttpRequest failed'))
          }
          
          xhr.ontimeout = () => reject(new Error('Request Timeout'))
          xhr.timeout = 30000 // 30 second timeout
          
          // Send request
          if (options?.body) {
            xhr.send(options.body as string)
          } else {
            xhr.send()
          }
        })
      }
      
      // Re-throw other errors
      throw error
    }
  }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: createBypassFetch()
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  )
}