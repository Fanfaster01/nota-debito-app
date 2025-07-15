'use client'

import React, { useState, useEffect } from 'react'

interface Logo {
  src: string
  alt: string
  instagram: string
  name: string
  gradient: string
}

const logos: Logo[] = [
  {
    src: '/logos/LA VICTORIANA LOGO.png',
    alt: 'La Victoriana',
    instagram: 'https://www.instagram.com/lavictorianac.a/?hl=en',
    name: 'La Victoriana',
    gradient: 'from-red-500/20 to-amber-500/20'
  },
  {
    src: '/logos/BÚNKER RESTAURANT LOGO.svg',
    alt: 'Búnker Restaurant',
    instagram: 'https://www.instagram.com/bunkerestaurant/?hl=en',
    name: 'Búnker Restaurant',
    gradient: 'from-gray-500/20 to-slate-500/20'
  },
  {
    src: '/logos/MICHI BURGER LOGO.svg',
    alt: 'Michi Burger',
    instagram: 'https://www.instagram.com/michiburgerve/?hl=en',
    name: 'Michi Burger',
    gradient: 'from-orange-500/20 to-yellow-500/20'
  },
  {
    src: '/logos/MICHI PIZZA LOGO.svg',
    alt: 'Michi Pizza',
    instagram: 'https://www.instagram.com/michipizzave/?hl=en',
    name: 'Michi Pizza',
    gradient: 'from-red-500/20 to-orange-500/20'
  }
]

export function LogoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isHovered) return // Pausar auto-rotate cuando se hace hover
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % logos.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isHovered])

  const handleLogoClick = (instagram: string) => {
    window.open(instagram, '_blank', 'noopener,noreferrer')
  }

  const getCardStyle = (index: number) => {
    const diff = index - currentIndex
    const totalCards = logos.length
    
    // Normalizar la diferencia para que esté entre -2 y 2
    let position = diff
    if (position > totalCards / 2) position -= totalCards
    if (position < -totalCards / 2) position += totalCards
    
    let transform = ''
    let opacity = 0.4
    let scale = 0.7
    let zIndex = 1
    let blur = 'blur(2px)'
    
    switch (position) {
      case 0: // Centro (activo)
        transform = 'translateX(0) translateZ(180px) rotateY(0deg)'
        opacity = 1
        scale = 1.3
        zIndex = 10
        blur = 'blur(0px)'
        break
      case -1: // Izquierda
        transform = 'translateX(-200px) translateZ(80px) rotateY(35deg)'
        opacity = 0.8
        scale = 1.0
        zIndex = 5
        blur = 'blur(0px)'
        break
      case 1: // Derecha
        transform = 'translateX(200px) translateZ(80px) rotateY(-35deg)'
        opacity = 0.8
        scale = 1.0
        zIndex = 5
        blur = 'blur(0px)'
        break
      case -2: // Más izquierda
        transform = 'translateX(-320px) translateZ(20px) rotateY(55deg)'
        opacity = 0.5
        scale = 0.8
        zIndex = 1
        blur = 'blur(1px)'
        break
      case 2: // Más derecha
        transform = 'translateX(320px) translateZ(20px) rotateY(-55deg)'
        opacity = 0.5
        scale = 0.8
        zIndex = 1
        blur = 'blur(1px)'
        break
      default:
        transform = 'translateX(450px) translateZ(-40px) rotateY(75deg)'
        opacity = 0.2
        scale = 0.6
        zIndex = 0
        blur = 'blur(2px)'
    }

    return {
      transform,
      opacity,
      scale,
      zIndex,
      filter: blur
    }
  }

  return (
    <div className="relative w-full">
      {/* Contenedor 3D del carrusel */}
      <div 
        className="relative h-72 mb-10"
        style={{ perspective: '1600px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setHoveredIndex(null)
        }}
      >
        {/* Ambiente de luz */}
        <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent rounded-full blur-3xl"></div>
        
        {/* Container 3D */}
        <div 
          className="relative w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0)'
          }}
        >
          {logos.map((logo, index) => {
            const cardStyle = getCardStyle(index)
            const isActive = index === currentIndex
            const isHoveredCard = hoveredIndex === index
            
            return (
              <div
                key={index}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out cursor-pointer"
                style={{
                  transform: `${cardStyle.transform} scale(${cardStyle.scale})`,
                  opacity: cardStyle.opacity,
                  zIndex: cardStyle.zIndex,
                  filter: isHoveredCard ? 'blur(0px)' : cardStyle.filter
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  if (isActive) {
                    handleLogoClick(logo.instagram)
                  } else {
                    setCurrentIndex(index)
                  }
                }}
              >
                {/* Glassmorphism card */}
                <div 
                  className={`
                    relative w-60 h-36 rounded-3xl overflow-hidden
                    backdrop-blur-xl border border-white/20
                    bg-gradient-to-br ${logo.gradient}
                    shadow-2xl shadow-black/20
                    transition-all duration-500 ease-out
                    ${isActive ? 'shadow-3xl shadow-white/10' : ''}
                    ${isHoveredCard ? 'scale-105 shadow-3xl' : ''}
                  `}
                  style={{
                    background: isActive 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                  }}
                >
                  {/* Highlight edge */}
                  <div className="absolute inset-0 rounded-3xl border border-white/30 opacity-0 transition-opacity duration-300"
                       style={{ opacity: isActive ? 1 : 0 }}></div>
                  
                  {/* Inner glow */}
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>
                  
                  {/* Logo content */}
                  <div className="relative w-full h-full flex items-center justify-center p-6 group">
                    <img 
                      src={logo.src} 
                      alt={logo.alt}
                      className={`
                        max-h-24 max-w-full object-contain transition-all duration-300
                        ${logo.alt === 'Búnker Restaurant' ? 'filter invert brightness-0' : ''}
                        ${isActive ? 'drop-shadow-2xl' : 'drop-shadow-lg'}
                        group-hover:scale-110
                      `}
                      style={{
                        imageRendering: 'crisp-edges'
                      }}
                    />
                    
                    {/* Instagram icon overlay - solo visible en el activo */}
                    {isActive && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full shadow-lg">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                                transform -skew-x-12 -translate-x-full group-hover:translate-x-full 
                                transition-transform duration-1000 ease-out"></div>
                </div>

                {/* Reflection */}
                <div className="absolute -bottom-1 left-0 right-0 h-10 bg-gradient-to-t from-white/5 to-transparent 
                              rounded-b-3xl transform scale-y-50 opacity-30"></div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Nombre de la empresa actual con animación */}
      <div className="text-center mb-10 min-h-[4rem] flex flex-col justify-center">
        <h3 className="text-white font-bold text-2xl mb-2 transition-all duration-500 transform">
          {logos[currentIndex].name}
        </h3>
        <div className="flex items-center justify-center space-x-3 text-slate-300 text-base">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z"/>
            </svg>
            <span className="font-medium">Visita en Instagram</span>
          </div>
          <span className="text-slate-400">•</span>
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">Explora sus productos</span>
          </div>
        </div>
      </div>

      {/* Indicadores mejorados */}
      <div className="flex justify-center space-x-4 mb-8">
        {logos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              relative h-3 rounded-full transition-all duration-500 overflow-hidden
              ${index === currentIndex 
                ? 'w-12 bg-white shadow-lg shadow-white/50' 
                : 'w-3 bg-white/30 hover:bg-white/60 hover:w-6'
              }
            `}
          >
            {index === currentIndex && (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full
                            animate-pulse"></div>
            )}
          </button>
        ))}
      </div>

      {/* Texto descriptivo mejorado */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-sm rounded-full px-6 py-3 border border-white/10">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-slate-300 text-base font-medium">
            Empresas líderes confiando en nuestra tecnología
          </p>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
        
        {/* Estadísticas adicionales */}
        <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">4</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Marcas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">100%</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Confianza</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">24/7</div>
            <div className="text-xs text-slate-400 uppercase tracking-wide">Soporte</div>
          </div>
        </div>
      </div>
    </div>
  )
}