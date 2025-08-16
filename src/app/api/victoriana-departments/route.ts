import { getVictorianaDepartments } from '@/lib/services/listasPreciosService'

export async function GET() {
  try {
    const departments = await getVictorianaDepartments()
    
    return Response.json({
      departments: departments
    })
  } catch (error: any) {
    console.error('Error fetching Victoriana departments:', error)
    
    return Response.json(
      { error: 'Error al cargar los departamentos' },
      { status: 500 }
    )
  }
}