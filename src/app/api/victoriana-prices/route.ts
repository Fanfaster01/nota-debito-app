import { getVictorianaProductPrice } from '@/lib/services/listasPreciosService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const itemId = searchParams.get('itemId')

  if (!itemId) {
    return Response.json(
      { error: 'Item ID is required' },
      { status: 400 }
    )
  }

  // Validar que itemId no esté vacío
  if (!itemId.trim()) {
    return Response.json(
      { error: 'Invalid Item ID format' },
      { status: 400 }
    )
  }

  try {
    const price = await Promise.race([
      getVictorianaProductPrice(itemId),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 30000)
      )
    ])
    
    if (price === null) {
      return Response.json(
        { error: 'Price not found' },
        { status: 404 }
      )
    }

    return Response.json({ price })
  } catch (error: any) {
    console.error('Database error:', error)
    
    // No exponer detalles del error en producción
    const isProduction = process.env.NODE_ENV === 'production'
    const errorResponse = {
      error: 'Database connection error',
      ...((!isProduction) && { details: error.message })
    }
    
    return Response.json(errorResponse, { status: 503 })
  }
}