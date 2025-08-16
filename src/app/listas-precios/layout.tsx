import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Listas de Precios - Búnker Restaurant & La Victoriana',
  description: 'Consulta las listas de precios actualizadas de Búnker Restaurant y La Victoriana',
}

export default function ListasPreciosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="public-layout">
      {children}
    </div>
  )
}