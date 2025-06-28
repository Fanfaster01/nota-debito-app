// src/utils/validators.ts

/**
 * Utilities para validaciones comunes en toda la aplicación
 */

/**
 * Resultado de validación estándar
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Valida que un company ID sea válido
 */
export function validateCompanyId(companyId: unknown): ValidationResult {
  if (!companyId) {
    return {
      isValid: false,
      error: 'companyId es requerido'
    }
  }

  if (typeof companyId !== 'string') {
    return {
      isValid: false,
      error: 'companyId debe ser una string válida'
    }
  }

  if (!companyId.trim()) {
    return {
      isValid: false,
      error: 'companyId no puede estar vacío'
    }
  }

  // Validar formato UUID básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(companyId)) {
    return {
      isValid: false,
      error: 'companyId debe tener formato UUID válido'
    }
  }

  return { isValid: true }
}

/**
 * Valida que un user ID sea válido
 */
export function validateUserId(userId: unknown): ValidationResult {
  if (!userId) {
    return {
      isValid: false,
      error: 'userId es requerido'
    }
  }

  if (typeof userId !== 'string') {
    return {
      isValid: false,
      error: 'userId debe ser una string válida'
    }
  }

  if (!userId.trim()) {
    return {
      isValid: false,
      error: 'userId no puede estar vacío'
    }
  }

  // Validar formato UUID básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    return {
      isValid: false,
      error: 'userId debe tener formato UUID válido'
    }
  }

  return { isValid: true }
}

/**
 * Valida parámetros de paginación
 */
export function validatePagination(page?: number, limit?: number): ValidationResult & { 
  page: number, 
  limit: number 
} {
  const defaultPage = 1
  const defaultLimit = 10
  const maxLimit = 100

  const finalPage = Math.max(1, Math.floor(page || defaultPage))
  const finalLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit || defaultLimit)))

  return {
    isValid: true,
    page: finalPage,
    limit: finalLimit
  }
}

/**
 * Valida un RIF venezolano
 */
export function validateRIF(rif: unknown): ValidationResult {
  if (!rif) {
    return {
      isValid: false,
      error: 'RIF es requerido'
    }
  }

  if (typeof rif !== 'string') {
    return {
      isValid: false,
      error: 'RIF debe ser una string'
    }
  }

  const rifRegex = /^[JGV]-\d+(-\d)?$/i
  if (!rifRegex.test(rif)) {
    return {
      isValid: false,
      error: 'Formato de RIF inválido (debe ser J-XXXXXXXX-X, G-XXXXXXXX-X o V-XXXXXXXX-X)'
    }
  }

  return { isValid: true }
}

/**
 * Valida un email
 */
export function validateEmail(email: unknown): ValidationResult {
  if (!email) {
    return {
      isValid: false,
      error: 'Email es requerido'
    }
  }

  if (typeof email !== 'string') {
    return {
      isValid: false,
      error: 'Email debe ser una string'
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Formato de email inválido'
    }
  }

  return { isValid: true }
}

/**
 * Valida un número de teléfono venezolano
 */
export function validatePhone(phone: unknown): ValidationResult {
  if (!phone) {
    return { isValid: true } // Teléfono es opcional
  }

  if (typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Teléfono debe ser una string'
    }
  }

  // Formatos válidos: 0212-1234567, +58-212-1234567, etc.
  const phoneRegex = /^(\+58-?)?0?\d{3}-?\d{7}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return {
      isValid: false,
      error: 'Formato de teléfono inválido (ejemplo: 0212-1234567)'
    }
  }

  return { isValid: true }
}

/**
 * Valida un rango de fechas
 */
export function validateDateRange(startDate?: Date | string, endDate?: Date | string): ValidationResult {
  if (!startDate || !endDate) {
    return { isValid: true } // Fechas opcionales
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    return {
      isValid: false,
      error: 'Fecha de inicio inválida'
    }
  }

  if (isNaN(end.getTime())) {
    return {
      isValid: false,
      error: 'Fecha de fin inválida'
    }
  }

  if (start > end) {
    return {
      isValid: false,
      error: 'La fecha de inicio debe ser anterior a la fecha de fin'
    }
  }

  return { isValid: true }
}

/**
 * Valida múltiples parámetros y retorna todos los errores
 */
export function validateMultiple(validations: Array<() => ValidationResult>): ValidationResult & {
  errors: string[]
} {
  const errors: string[] = []
  
  for (const validation of validations) {
    const result = validation()
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    errors
  }
}

/**
 * Helper para crear validaciones rápidas
 */
export const validate = {
  companyId: validateCompanyId,
  userId: validateUserId,
  pagination: validatePagination,
  rif: validateRIF,
  email: validateEmail,
  phone: validatePhone,
  dateRange: validateDateRange,
  multiple: validateMultiple
}

/**
 * Utility para lanzar error si la validación falla
 */
export function assertValid(validation: ValidationResult, context?: string): void {
  if (!validation.isValid) {
    const message = context ? `${context}: ${validation.error}` : validation.error
    throw new Error(message || 'Validación fallida')
  }
}

/**
 * Decorator para validar parámetros de métodos automáticamente
 */
export function validateParams<T extends any[], R>(
  validators: Array<(param: any) => ValidationResult>,
  originalMethod: (...args: T) => R
) {
  return function(this: any, ...args: T): R {
    for (let i = 0; i < validators.length && i < args.length; i++) {
      const validation = validators[i](args[i])
      assertValid(validation, `Parámetro ${i + 1}`)
    }
    
    return originalMethod.apply(this, args)
  }
}