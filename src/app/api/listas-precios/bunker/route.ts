import { NextResponse } from 'next/server'
import { getBunkerProducts, getBunkerCategories } from '@/lib/services/listasPreciosService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    if (type === 'categories') {
      const categories = await getBunkerCategories()
      return NextResponse.json({ success: true, categories })
    } else {
      const products = await getBunkerProducts()
      return NextResponse.json({ success: true, products })
    }
  } catch (error: any) {
    console.error('Error in Bunker API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener datos de Bunker' },
      { status: 500 }
    )
  }
}