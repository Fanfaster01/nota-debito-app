"use client"

import { useState } from 'react'
import { useProductPrices } from '@/hooks/useProductPrices'
import { PhotoIcon } from '@heroicons/react/24/outline'
import Header from './common/Header'
import Footer from './common/Footer'
import ImageModal from './common/ImageModal'

interface HamburguesaItem {
  name: string
  description: string
  id: string
  imageUrl?: string
}

export default function HamburguesasSection() {
  const [selectedImage, setSelectedImage] = useState<any>(null)

  const hamburguesas: HamburguesaItem[] = [
    {
      name: "CHEESEBURGER",
      description: "Pan de la casa, 100g de pollo ó solomo al carbón, queso cheddar y papas fritas.",
      id: "6644",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "CHEESE BACON",
      description: "Pan de la casa, 200g de solomo ó pollo al carbón, tocineta, pepinillos, queso cheddar y papas fritas.",
      id: "7157",
      imageUrl: "URL_DE_LA_IMAGEN"
    },
    {
      name: "POLLO CRISPY",
      description: "Pan de la casa, 200g de pollo empanizado en panko, tomate, lechuga, pepinillos, tocineta, queso cheddar y papas fritas.",
      id: "6544",
      imageUrl: "URL_DE_LA_IMAGEN"
    }
  ]

  const { prices, loading, error } = useProductPrices(hamburguesas)

  const formatPrice = (price: number) => {
    return `${price?.toFixed(2)}€`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="HAMBURGUESAS" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="HAMBURGUESAS" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="HAMBURGUESAS" />

      <div className="space-y-6">
        <div className="space-y-4">
          {hamburguesas.map((item) => (
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

        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-gray-600 text-sm text-center">
            Todas nuestras hamburguesas incluyen papas fritas.
          </p>
          <p className="text-gray-600 text-sm text-center">
            Puedes elegir entre pollo o carne en las opciones disponibles.
          </p>
        </div>
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