import { NextResponse } from 'next/server'
import { getBunkerConnection } from '@/lib/services/listasPreciosService'

const sql = require('mssql')

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'itemId is required' },
        { status: 400 }
      )
    }

    const pool = await getBunkerConnection()
    const result = await pool.request()
      .input('itemId', sql.Int, parseInt(itemId))
      .query(`
        SELECT 
          p.sale_price_1,
          i.tax_id
        FROM T_POS_PRODUCT p
        JOIN T_POS_ITEM i ON p.item_id = i.item_id
        WHERE i.item_id = @itemId
      `)
    
    if (result.recordset.length > 0) {
      const { sale_price_1, tax_id } = result.recordset[0]
      const finalPrice = tax_id === 2 ? sale_price_1 * 1.16 : sale_price_1
      return NextResponse.json({ success: true, price: finalPrice })
    } else {
      return NextResponse.json({ success: true, price: 0 })
    }
  } catch (error: any) {
    console.error('Error fetching Bunker price:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener precio' },
      { status: 500 }
    )
  }
}