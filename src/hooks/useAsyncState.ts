// src/hooks/useAsyncState.ts

import { useState, useCallback } from 'react'
import { handleServiceError } from '@/utils/errorHandler'

/**
 * Estado unificado para operaciones asíncronas
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * Hook para manejar estados de loading, error y data de forma unificada
 */
export function useAsyncState<T>(initialData: T | null = null) {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false
  })

  /**
   * Ejecuta una operación asíncrona manejando automáticamente los estados
   */
  const execute = useCallback(async (
    operation: () => Promise<T>,
    errorMessage: string = 'Error en la operación'
  ): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }))

    try {
      const result = await operation()
      setState({
        data: result,
        loading: false,
        error: null,
        success: true
      })
      return result
    } catch (error) {
      const errorMsg = handleServiceError(error, errorMessage)
      setState({
        data: null,
        loading: false,
        error: errorMsg,
        success: false
      })
      return null
    }
  }, [])

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  /**
   * Establece los datos directamente (útil para actualizaciones inmediatas)
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      success: data !== null
    }))
  }, [])

  /**
   * Reinicia el estado completo
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false
    })
  }, [initialData])

  return {
    ...state,
    execute,
    clearError,
    setData,
    reset
  }
}

/**
 * Hook especializado para operaciones de carga/listado
 */
export function useAsyncList<T>(initialData: T[] = []) {
  const asyncState = useAsyncState<T[]>(initialData)

  /**
   * Agrega un elemento a la lista
   */
  const addItem = useCallback((item: T) => {
    if (asyncState.data) {
      asyncState.setData([...asyncState.data, item])
    } else {
      asyncState.setData([item])
    }
  }, [asyncState])

  /**
   * Actualiza un elemento en la lista
   */
  const updateItem = useCallback((index: number, item: T) => {
    if (asyncState.data) {
      const newData = [...asyncState.data]
      newData[index] = item
      asyncState.setData(newData)
    }
  }, [asyncState])

  /**
   * Elimina un elemento de la lista
   */
  const removeItem = useCallback((index: number) => {
    if (asyncState.data) {
      const newData = asyncState.data.filter((_, i) => i !== index)
      asyncState.setData(newData)
    }
  }, [asyncState])

  /**
   * Busca y actualiza un elemento por ID
   */
  const updateItemById = useCallback((id: string | number, item: T) => {
    if (asyncState.data) {
      const newData = asyncState.data.map(existing => 
        (existing as { id: string | number }).id === id ? item : existing
      )
      asyncState.setData(newData)
    }
  }, [asyncState])

  return {
    ...asyncState,
    addItem,
    updateItem,
    removeItem,
    updateItemById
  }
}

/**
 * Hook para operaciones de formulario con validación
 */
export function useAsyncForm<T>() {
  const asyncState = useAsyncState<T>()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const executeWithValidation = useCallback(async (
    operation: () => Promise<T>,
    errorMessage: string = 'Error en el formulario'
  ): Promise<T | null> => {
    setFieldErrors({})
    
    try {
      const result = await asyncState.execute(operation, errorMessage)
      return result
    } catch (error) {
      // Manejar errores de validación específicos del formulario
      if (error && typeof error === 'object' && 'validationErrors' in error) {
        setFieldErrors((error as { validationErrors: Record<string, string> }).validationErrors)
      }
      return null
    }
  }, [asyncState])

  const clearFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return {
    ...asyncState,
    fieldErrors,
    executeWithValidation,
    clearFieldErrors
  }
}