'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Department {
  codigo: string
  nombre: string
  total_productos: number
  path: string
}

export default function LaVictoriana() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const generatePath = (codigo: string, nombre: string) => {
    return `/listas-precios/la-victoriana/departamento/${codigo}`
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/victoriana-departments')
      const data = await response.json()
      
      if (response.ok) {
        const departmentsWithPath = data.departments.map((dept: any) => ({
          ...dept,
          path: generatePath(dept.codigo, dept.nombre)
        }))
        setDepartments(departmentsWithPath)
      } else {
        setError(data.error || 'Error al cargar departamentos')
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error)
      setError(error.message || 'Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="text-center py-4">Cargando departamentos...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white p-4">
        <div className="text-center py-4 text-red-600">
          Error: {error}
          <button 
            onClick={fetchDepartments}
            className="block mx-auto mt-4 px-4 py-2 bg-[#C8302E] text-white rounded"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

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

      <div className="flex justify-center mb-6">
        <Link 
          href="/listas-precios"
          className="group relative bg-gradient-to-r from-[#C8302E] to-[#A02624] text-white px-8 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-medium"
        >
          <span className="flex items-center">
            <span className="mr-2 transition-transform duration-300 group-hover:-translate-x-1">←</span>
            Volver a Listas de Precios
          </span>
          <div className="absolute inset-0 rounded-full bg-[#C8A882] opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {departments.map((department) => (
          <Link 
            href={department.path} 
            key={department.codigo}
            className="bg-gray-900 shadow-lg rounded-lg p-6 border-2 border-[#C8A882] hover:shadow-xl hover:border-[#C8302E] transition-all duration-200 text-center h-32 text-white group"
          >
            <div className="flex flex-col justify-center h-full">
              <span className="font-bold text-lg mb-2 text-white group-hover:text-[#C8A882]">{department.nombre}</span>
              <span className="text-sm text-[#C8A882]">{department.total_productos} productos</span>
              <span className="text-xs text-gray-500 mt-1">Código: {department.codigo}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}