// src/utils/errorHandler.ts

/**
 * Utility para manejo consistente de errores en toda la aplicación
 */

/**
 * Extrae un mensaje de error legible de cualquier tipo de error
 * @param error - El error capturado (unknown type)
 * @param defaultMessage - Mensaje por defecto si no se puede extraer uno
 * @returns String con el mensaje de error
 */
export function handleServiceError(error: unknown, defaultMessage: string = 'Error desconocido'): string {
  // Error es una instancia de Error
  if (error instanceof Error) {
    return error.message
  }
  
  // Error es un string
  if (typeof error === 'string') {
    return error
  }
  
  // Error es un objeto con propiedad message
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }
  
  // Error de Supabase con estructura específica
  if (error && typeof error === 'object' && 'error' in error) {
    const supabaseError = (error as { error: unknown }).error
    if (supabaseError && typeof supabaseError === 'object' && 'message' in supabaseError) {
      const message = (supabaseError as { message: unknown }).message
      if (typeof message === 'string') {
        return message
      }
    }
  }
  
  // Fallback al mensaje por defecto
  return defaultMessage
}

/**
 * Wrapper para manejo de errores en funciones async con try-catch
 * @param operation - Función async a ejecutar
 * @param errorMessage - Mensaje base para el error
 * @returns Resultado de la operación o null en caso de error
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<{ data: T | null, error: string | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (err) {
    const error = handleServiceError(err, errorMessage)
    console.error(`${errorMessage}:`, err)
    return { data: null, error }
  }
}

/**
 * Maneja errores de validación de formularios
 * @param error - Error de validación
 * @returns Objeto con errores por campo
 */
export function handleValidationError(error: unknown): Record<string, string> {
  if (error && typeof error === 'object' && 'errors' in error) {
    const validationErrors = (error as { errors: unknown }).errors
    if (Array.isArray(validationErrors)) {
      const errorMap: Record<string, string> = {}
      validationErrors.forEach((err: any) => {
        if (err.path && err.message) {
          errorMap[err.path.join('.')] = err.message
        }
      })
      return errorMap
    }
  }
  
  return { general: handleServiceError(error, 'Error de validación') }
}

/**
 * Tipos para respuestas estándar de servicios
 */
export interface ServiceResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

/**
 * Crea una respuesta exitosa estándar
 */
export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    data,
    error: null,
    success: true
  }
}

/**
 * Crea una respuesta de error estándar
 */
export function createErrorResponse<T>(error: unknown, defaultMessage?: string): ServiceResponse<T> {
  return {
    data: null,
    error: handleServiceError(error, defaultMessage),
    success: false
  }
}