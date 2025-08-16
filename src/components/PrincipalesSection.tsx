"use client"

import { useState } from 'react'
import { useProductPrices } from '@/hooks/useProductPrices'
import { PhotoIcon } from '@heroicons/react/24/outline'
import Header from './common/Header'
import Footer from './common/Footer'
import ImageModal from './common/ImageModal'
import ContornosSection from './common/ContornosSection'

export default function PrincipalesSection() {
  const [selectedImage, setSelectedImage] = useState<any>(null)

  const principalesItems = [
    { name: "SALTEADO DE MARISCOS", description: "Camarón, calamar, pulpo y guacuco en concha, salteados en vino blanco, acompañados de vegetales al grill y papas fritas.", id: "2510" },
    { name: "PARRILLA CLÁSICA", description: "Pollo, lomito y chorizo ahumado a las brasas, acompañados de papas fritas.", id: "2363" },
    { name: "PARRILLA MAR Y TIERRA", description: "Mariscos salteados en vino blanco, acompañados de lomito y pollo a la parrilla, vegetales y papas fritas.", id: "2509" },
    { name: "NOSTRA PARMIGIANA", description: "Milanesa de pollo en salsa al estilo napolitano y quesos frescos gratinados, acompañada de un (1) contorno de su elección.", id: "2541" },
    { name: "LOMITO O POLLO AL CHAMPIÑÓN", description: "Acompañado de un (1) contorno de su elección.", id: "2534" },
    { name: "PESCA DEL DÍA", description: "Pescado blanco a la plancha ó al ajillo, acompañado de un (1) contorno de su elección.", id: "4132" },
    { name: "SALMÓN", description: "Salmón a la plancha ó al ajillo, acompañado de un (1) contorno de su elección.", id: "6891" },
    { name: "PASTA BÚNKER", description: "Linguini en salsa blanca, acompañada de costillas de cerdo ahumadas en casa más una (1) proteína de su elección.", id: "3966" },
    { name: "RISOTTO DE MARISCOS", description: "Arroz cremoso, con un sofrito tradicional y mariscos frescos.", id: "3588" },
    { name: "PASTA MARINERA", description: "Linguini en salsa roja, acompañado de mix de mariscos salteados en vino blanco, coronada con queso parmesano.", id: "7051" },
    { name: "RISOTTO DE PUNTA AHUMADA", description: "Arroz cremoso, punta trasera de res ahumada, acompañado con queso parmesano.", id: "2341" }
  ]

  const { prices, loading, error } = useProductPrices(principalesItems)

  const formatPrice = (price: number) => {
    return `${price?.toFixed(2)}€`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="PRINCIPALES" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="PRINCIPALES" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="PRINCIPALES" />

      <div className="space-y-6">
        <div className="space-y-4">
          {principalesItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white shadow-md rounded-lg p-4 border border-[#C8A882] hover:border-[#8B7355] hover:shadow-lg transition-all duration-200"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg mb-2 text-[#8B7355]">{item.name}</h3>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedImage(item)}
                    className="text-gray-500 hover:text-[#8B7355] transition-colors"
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-lg text-[#C8A882]">
                    {formatPrice(prices[item.id])}
                  </span>
                </div>
              </div>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        <ContornosSection />
      </div>

      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage?.imageUrl}
        title={selectedImage?.name}
      />

      <Footer />
    </div>
  )
}