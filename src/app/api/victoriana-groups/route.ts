import { getVictorianaGroups } from '@/lib/services/listasPreciosService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const departmentId = searchParams.get('department')

  if (!departmentId) {
    return Response.json(
      { error: 'Department ID is required' },
      { status: 400 }
    )
  }

  try {
    const groups = await getVictorianaGroups(departmentId)
    
    return Response.json({
      groups: groups
    })
  } catch (error: any) {
    console.error('Error fetching Victoriana groups:', error)
    
    return Response.json(
      { error: 'Error al cargar los grupos' },
      { status: 500 }
    )
  }
}