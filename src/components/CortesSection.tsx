"use client"

import { useState, useEffect } from 'react'
import { useProductPrices } from '@/hooks/useProductPrices'
import { PhotoIcon } from '@heroicons/react/24/outline'
import Header from './common/Header'
import Footer from './common/Footer'
import ImageModal from './common/ImageModal'
import ContornosSection from './common/ContornosSection'

interface CortesItem {
  name: string
  description: string
  id: string
  imageUrl?: string
  peso: number
}

export default function CortesSection() {
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [rationPrices, setRationPrices] = useState<Record<string, number>>({})

  const cortesItems: CortesItem[] = [
    {
      name: "PUNTA TRASERA ANGUS",
      description: "Raciones de 300g",
      id: "4096",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "SOLOMO DE RES",
      description: "Raciones de 200g",
      id: "4058",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.2
    },
    {
      name: "PORKBELLY",
      description: "Raciones de 300g",
      id: "6535",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "BRISKET",
      description: "Raciones de 300g",
      id: "6566",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "COSTILLAS DE CERDO BBQ",
      description: "Raciones de 300g",
      id: "6907",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "CENTRO DE LOMITO",
      description: "Raciones de 300g",
      id: "6436",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "CHURRASCO DE MUSLO",
      description: "Raciones de 300g",
      id: "2446",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "ASADO DE TIRA DE CERDO",
      description: "Raciones de 300g",
      id: "4137",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "COSTILLAS DE CERDO AHUMADAS",
      description: "Raciones de 300g",
      id: "3940",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "CHULETA DE LOMO DE CERDO",
      description: "Raciones de 300g",
      id: "6648",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    },
    {
      name: "MILANESA DE POLLO",
      description: "Raciones de 300g",
      id: "6900",
      imageUrl: "URL_DE_LA_IMAGEN",
      peso: 0.3
    }
  ]

  const { prices, loading, error } = useProductPrices(cortesItems)

  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
      const newRationPrices: Record<string, number> = {}
      
      cortesItems.forEach(item => {
        const kiloPrice = prices[item.id]
        if (kiloPrice) {
          newRationPrices[item.id] = kiloPrice * item.peso
        }
      })
      
      setRationPrices(newRationPrices)
    }
  }, [prices])

  const formatPrice = (price: number) => {
    if (price === undefined || price === null) return "Cargando..."
    return `${price.toFixed(2)}€`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="CORTES AL CARBÓN" />
        <div className="text-center py-4">Cargando precios...</div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-4">
        <Header title="CORTES AL CARBÓN" />
        <div className="text-center py-4 text-red-600">Error al cargar los precios</div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-4">
      <Header title="CORTES AL CARBÓN" />

      <div className="space-y-6">
        <div className="space-y-4">
          {cortesItems.map((item) => (
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
                    {formatPrice(rationPrices[item.id])}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm italic">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-gray-600 text-sm text-center">
            La compra mínima es de una ración de 300g, excepto el Solomo de Res que es de 200g.
          </p>
          <p className="text-black text-sm text-center">
          Todos nuestros cortes se pesan en crudo.
          </p>
        </div>

        <ContornosSection title="CONTORNOS" />
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