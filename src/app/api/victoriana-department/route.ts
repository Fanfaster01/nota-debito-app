import { getVictorianaProducts } from '@/lib/services/listasPreciosService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const department = searchParams.get('department')
  const group = searchParams.get('group')
  const search = searchParams.get('search')
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')

  if (!department) {
    return Response.json(
      { error: 'Department is required' },
      { status: 400 }
    )
  }

  try {
    const departmentId = department
    const groupId = group || undefined
    const limit = limitParam ? parseInt(limitParam) : 20
    const offset = offsetParam ? parseInt(offsetParam) : 0

    // Obtener productos
    let allProducts = await getVictorianaProducts(departmentId, groupId)
    
    // Aplicar filtro de búsqueda si existe
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase()
      allProducts = allProducts.filter(product => 
        product.descripcion.toLowerCase().includes(searchTerm) ||
        (product.descripcion_corta && product.descripcion_corta.toLowerCase().includes(searchTerm)) ||
        (product.marca && product.marca.toLowerCase().includes(searchTerm))
      )
    }
    
    // Implementar paginación manual
    const total = allProducts.length
    const products = allProducts.slice(offset, offset + limit)
    
    return Response.json({
      products: products,
      pagination: {
        total: total,
        offset: offset,
        limit: limit,
        hasMore: offset + limit < total
      }
    })
  } catch (error: any) {
    console.error('Error fetching Victoriana department products:', error)
    
    return Response.json(
      { error: 'Error al cargar los productos del departamento' },
      { status: 500 }
    )
  }
}