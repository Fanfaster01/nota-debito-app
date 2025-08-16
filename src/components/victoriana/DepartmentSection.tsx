'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from './ProductCard'
import ProductSearch from './ProductSearch'

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

interface Department {
  codigo: string
  nombre: string
}

interface DepartmentSectionProps {
  departmentCode: string
  departmentPath: string
}

export default function DepartmentSection({ 
  departmentCode, 
  departmentPath
}: DepartmentSectionProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const itemsPerPage = 20

  useEffect(() => {
    fetchDepartmentInfo()
    // No cargar productos automáticamente, solo información del departamento
  }, [departmentCode])

  const fetchDepartmentInfo = async () => {
    try {
      const response = await fetch('/api/victoriana-departments')
      const data = await response.json()
      
      if (response.ok) {
        const department = data.departments.find((d: Department) => d.codigo === departmentCode)
        if (department) {
          setDepartmentInfo(department)
        } else {
          setError(`Departamento con código ${departmentCode} no encontrado`)
        }
      } else {
        setError(data.error || 'Error al cargar información del departamento')
      }
    } catch (error: any) {
      console.error('Error fetching department info:', error)
      setError(error.message || 'Error de conexión')
    }
  }

  const loadProducts = async (page: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const offset = (page - 1) * itemsPerPage
      const url = `/api/victoriana-department?department=${departmentCode}&limit=${itemsPerPage}&offset=${offset}`

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
        setTotalItems(data.pagination.total)
        setCurrentPage(page)
      } else {
        setError(data.error || `Error ${response.status}: No se pudieron cargar los productos`)
      }
    } catch (error: any) {
      console.error('Error loading products:', error)
      setError(error.message || 'Error de conexión al cargar los productos')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    loadProducts(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSearchResults = (results: Product[], searchError: string | null = null, term?: string) => {
    if (searchError) {
      setError(searchError)
    } else {
      if (term) {
        setSearchTerm(term.trim())
      }
      setError(null)
    }
    setIsLoading(false)
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setError(null)
  }

  if (error && !departmentInfo) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="text-center py-4 text-red-600">
          Error: {error}
          <button 
            onClick={fetchDepartmentInfo}
            className="block mx-auto mt-4 px-4 py-2 bg-[#C8302E] text-white rounded"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <div className="max-w-sm mx-auto mb-8">
        <Image 
          src="/images/victoriana/LOGO_LA VICTORIANA_WHITE_COLOR.png"
          alt="La Victoriana Logo"
          width={300}
          height={300}
          className="mx-auto"
          priority
        />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#C8A882] mb-2">
          {departmentInfo ? departmentInfo.nombre : 'Cargando...'}
        </h1>
        <p className="text-gray-400">Explora nuestros productos</p>
      </div>

      <div className="flex justify-center mb-6">
        <Link 
          href={departmentPath.includes('/la-victoriana/') ? '/listas-precios/la-victoriana' : '/listas-precios/victoriana'}
          className="group relative bg-gradient-to-r from-[#C8302E] to-[#A02624] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Regresar a Departamentos
          </span>
          <div className="absolute inset-0 rounded-full bg-[#C8A882] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Mostrar error de carga del departamento */}
        {error && !departmentInfo ? (
          <div className="text-center py-4 text-red-600">
            Error: {error}
            <button 
              onClick={fetchDepartmentInfo}
              className="block mx-auto mt-4 px-4 py-2 bg-[#C8302E] text-white rounded"
            >
              Reintentar
            </button>
          </div>
        ) : departmentInfo ? (
          <>
            {/* Componente de búsqueda - visible cuando se carga el departamento */}
            <ProductSearch 
              department={departmentCode}
              onResults={handleSearchResults}
              placeholder={`Buscar en ${departmentInfo.nombre}...`}
              onClear={handleClearSearch}
            />

            {/* Botón para limpiar búsqueda cuando hay término de búsqueda */}
            {searchTerm && (
              <div className="mb-4 text-center">
                <button
                  onClick={handleClearSearch}
                  className="text-[#C8A882] hover:text-[#C8302E] underline text-sm"
                >
                  ← Limpiar búsqueda
                </button>
              </div>
            )}

            {/* Contenido principal - Siempre mostrar ProductListWithPagination */}
            <ProductListWithPagination 
              departmentCode={departmentCode}
              searchTerm={searchTerm}
            />
          </>
        ) : (
          // Loading state mientras se carga la información del departamento
          <div className="text-center py-4">
            Cargando información del departamento...
          </div>
        )}
      </div>
    </main>
  )
}

// Componente auxiliar para productos con paginación
function ProductListWithPagination({ departmentCode, groupCode = null, searchTerm = '' }: { departmentCode: string, groupCode?: string | null, searchTerm?: string }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    loadProducts(1)
  }, [departmentCode, searchTerm])

  const loadProducts = async (page: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const offset = (page - 1) * itemsPerPage
      let url = `/api/victoriana-department?department=${departmentCode}&limit=${itemsPerPage}&offset=${offset}`
      
      if (groupCode) {
        url += `&group=${groupCode}`
      }
      
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm.trim())}`
      }

      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setProducts(data.products)
        setTotalItems(data.pagination.total)
        setCurrentPage(page)
      } else {
        setError(data.error || `Error ${response.status}: No se pudieron cargar los productos`)
      }
    } catch (error: any) {
      console.error('Error loading products:', error)
      setError(error.message || 'Error de conexión al cargar los productos')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    loadProducts(page)
    // Scroll al inicio de los productos
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (error && products.length === 0) {
    return (
      <div className="text-center py-4 text-red-600">
        Error: {error}
        <button 
          onClick={() => loadProducts(1)}
          className="block mx-auto mt-4 px-4 py-2 bg-[#C8302E] text-white rounded"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <>
      {isLoading && products.length === 0 ? (
        <div className="text-center py-4">
          Cargando productos...
        </div>
      ) : products.length > 0 ? (
        <>
          {searchTerm && (
            <div className="mb-4 text-center">
              <p className="text-gray-400">
                Se encontraron <span className="font-semibold text-[#C8A882]">{totalItems}</span> productos para "{searchTerm}"
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {products.map((product, index) => (
              <ProductCard key={`${product.codigo}-${index}`} product={product} />
            ))}
          </div>

          {/* Indicador de carga durante cambio de página */}
          {isLoading && (
            <div className="text-center mb-4">
              Cargando página...
            </div>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 py-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                ← Anterior
              </button>
              
              <span className="text-gray-400">
                Página {currentPage} de {totalPages} ({totalItems} productos)
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{searchTerm ? '🔍' : '📦'}</div>
          <h3 className="text-xl font-semibold text-[#C8A882] mb-2">
            {searchTerm ? 'No se encontraron productos' : 'No hay productos disponibles'}
          </h3>
          <p className="text-gray-400">
            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Esta sección está vacía en este momento'}
          </p>
        </div>
      )}
    </>
  )
}