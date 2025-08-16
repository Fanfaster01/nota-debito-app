'use client'

import { useState, useEffect, useRef } from 'react'

interface Product {
  codigo: string
  descripcion: string
  descripcion_corta?: string
  precio: number
  marca?: string
  presentacion?: string
  activo: number
  departamento: string
  grupo?: string
}

interface ProductSearchProps {
  department: string
  onResults: (results: Product[], error?: string | null, term?: string) => void
  placeholder?: string
  onClear?: () => void
}

export default function ProductSearch({ 
  department, 
  onResults, 
  placeholder = "Buscar productos...",
  onClear
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchSuggestions()
      } else {
        setSuggestions([])
        setShowSuggestions(false)
        // No interferir con la lógica de búsqueda cuando el término está vacío
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, department])

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/victoriana-department?department=${department}&search=${encodeURIComponent(searchTerm)}&limit=10`
      )
      const data = await response.json()
      
      if (response.ok) {
        setSuggestions(data.products)
        setShowSuggestions(true)
      } else {
        console.error('Error fetching suggestions:', data.error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    } catch (error: any) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (term = searchTerm) => {
    setShowSuggestions(false)
    setIsLoading(true)
    
    try {
      if (onResults) {
        // Solo pasar el término de búsqueda, no hacer la petición aquí
        onResults([], null, term.trim())
      }
    } catch (error: any) {
      console.error('Error searching products:', error)
      if (onResults) {
        onResults([], error.message || 'Error de conexión en la búsqueda')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (product: Product) => {
    setSearchTerm(product.descripcion)
    setShowSuggestions(false)
    handleSearch(product.descripcion)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSuggestions([])
    setShowSuggestions(false)
    // Notificar al componente padre para que limpie la búsqueda
    if (onClear) {
      onClear()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative mb-6">
      <div className="relative" ref={searchRef}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C8302E] focus:border-[#C8302E] text-sm text-gray-900 bg-white"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {isLoading && (
          <div className="absolute inset-y-0 right-8 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#C8302E]"></div>
          </div>
        )}
      </div>

      {/* Sugerencias */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((product) => (
            <button
              key={product.codigo}
              onClick={() => handleSuggestionClick(product)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.descripcion}
                  </p>
                  {product.marca && (
                    <p className="text-xs text-gray-500 mt-1">{product.marca}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-[#C8302E] ml-2">
                  {formatPrice(product.precio)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}