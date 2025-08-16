import { NextResponse } from 'next/server'
import { 
  getVictorianaDepartments, 
  getVictorianaGroups,
  getVictorianaProducts,
  getVictorianaProductPrice 
} from '@/lib/services/listasPreciosService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const departmentId = searchParams.get('departmentId')
    const groupId = searchParams.get('groupId')
    const itemId = searchParams.get('itemId')
    
    if (type === 'departments') {
      const departments = await getVictorianaDepartments()
      return NextResponse.json({ success: true, departments })
    } else if (type === 'groups' && departmentId) {
      const groups = await getVictorianaGroups(parseInt(departmentId))
      return NextResponse.json({ success: true, groups })
    } else if (type === 'price' && itemId) {
      const price = await getVictorianaProductPrice(parseInt(itemId))
      return NextResponse.json({ success: true, price })
    } else {
      const products = await getVictorianaProducts(
        departmentId ? parseInt(departmentId) : undefined,
        groupId ? parseInt(groupId) : undefined
      )
      return NextResponse.json({ success: true, products })
    }
  } catch (error: any) {
    console.error('Error in Victoriana API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener datos de La Victoriana' },
      { status: 500 }
    )
  }
}