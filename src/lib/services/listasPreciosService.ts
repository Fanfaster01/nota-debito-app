const sql = require('mssql')

/**
 * Variables de entorno requeridas:
 * 
 * Para Bunker Restaurant:
 * - NEXT_PUBLIC_BUNKER_DB_USER: Usuario de la base de datos
 * - NEXT_PUBLIC_BUNKER_DB_PASSWORD: Contraseña de la base de datos
 * - NEXT_PUBLIC_BUNKER_DB_HOST: Host/IP de la base de datos
 * - NEXT_PUBLIC_BUNKER_DB_NAME: Nombre de la base de datos (default: XETUXPOS)
 * - NEXT_PUBLIC_BUNKER_DB_PORT: Puerto de la base de datos (default: 1433)
 * 
 * Para La Victoriana:
 * - NEXT_PUBLIC_VICTORIANA_DB_USER: Usuario de la base de datos
 * - NEXT_PUBLIC_VICTORIANA_DB_PASSWORD: Contraseña de la base de datos
 * - NEXT_PUBLIC_VICTORIANA_DB_HOST: Host/IP de la base de datos
 * - NEXT_PUBLIC_VICTORIANA_DB_NAME: Nombre de la base de datos (default: VAD10)
 * - NEXT_PUBLIC_VICTORIANA_DB_PORT: Puerto de la base de datos (default: 14333)
 */

// Configuración para Bunker Restaurant
const bunkerConfig = {
  user: process.env.NEXT_PUBLIC_BUNKER_DB_USER,
  password: process.env.NEXT_PUBLIC_BUNKER_DB_PASSWORD,
  server: process.env.NEXT_PUBLIC_BUNKER_DB_HOST,
  database: process.env.NEXT_PUBLIC_BUNKER_DB_NAME || 'XETUXPOS',
  port: parseInt(process.env.NEXT_PUBLIC_BUNKER_DB_PORT || '1433'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
}

// Configuración para La Victoriana
const victorianaConfig = {
  user: process.env.NEXT_PUBLIC_VICTORIANA_DB_USER,
  password: process.env.NEXT_PUBLIC_VICTORIANA_DB_PASSWORD,
  server: process.env.NEXT_PUBLIC_VICTORIANA_DB_HOST,
  database: process.env.NEXT_PUBLIC_VICTORIANA_DB_NAME || 'VAD10',
  port: parseInt(process.env.NEXT_PUBLIC_VICTORIANA_DB_PORT || '14333'),
  options: {
    trustServerCertificate: true,
    encrypt: false,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
}

// Pool de conexiones
let bunkerPool: any = null
let victorianaPool: any = null

// Funciones para Bunker
export async function getBunkerConnection() {
  try {
    // Validar variables de entorno críticas
    if (!bunkerConfig.user || !bunkerConfig.password || !bunkerConfig.server) {
      throw new Error('Missing required Bunker database environment variables. Please check NEXT_PUBLIC_BUNKER_DB_USER, NEXT_PUBLIC_BUNKER_DB_PASSWORD, and NEXT_PUBLIC_BUNKER_DB_HOST')
    }
    
    if (!bunkerPool) {
      bunkerPool = await sql.connect(bunkerConfig)
    }
    return bunkerPool
  } catch (error) {
    console.error('Error connecting to Bunker database:', error)
    throw error
  }
}

export async function getBunkerProducts() {
  try {
    const pool = await getBunkerConnection()
    const result = await pool.request()
      .query(`
        SELECT 
          p.item_id,
          i.item_name,
          i.description,
          i.category_id,
          c.name as category_name,
          p.sale_price_1 as price,
          i.tax_id
        FROM T_POS_PRODUCT p
        JOIN T_POS_ITEM i ON p.item_id = i.item_id
        LEFT JOIN T_POS_CATEGORY c ON i.category_id = c.category_id
        WHERE i.status = 'A'
        ORDER BY c.name, i.item_name
      `)
    
    return result.recordset.map((item: any) => ({
      ...item,
      finalPrice: item.tax_id === 2 ? item.price * 1.16 : item.price
    }))
  } catch (error) {
    console.error('Error fetching Bunker products:', error)
    throw error
  }
}

export async function getBunkerCategories() {
  try {
    const pool = await getBunkerConnection()
    const result = await pool.request()
      .query(`
        SELECT 
          category_id,
          name,
          description
        FROM T_POS_CATEGORY
        WHERE status = 'A'
        ORDER BY name
      `)
    
    return result.recordset
  } catch (error) {
    console.error('Error fetching Bunker categories:', error)
    throw error
  }
}

// Funciones para La Victoriana
export async function getVictorianaConnection() {
  try {
    // Validar variables de entorno críticas
    if (!victorianaConfig.user || !victorianaConfig.password || !victorianaConfig.server) {
      throw new Error('Missing required La Victoriana database environment variables. Please check NEXT_PUBLIC_VICTORIANA_DB_USER, NEXT_PUBLIC_VICTORIANA_DB_PASSWORD, and NEXT_PUBLIC_VICTORIANA_DB_HOST')
    }
    
    if (!victorianaPool) {
      victorianaPool = await sql.connect(victorianaConfig)
    }
    return victorianaPool
  } catch (error) {
    console.error('Error connecting to La Victoriana database:', error)
    throw error
  }
}

export async function getVictorianaDepartments() {
  try {
    const pool = await getVictorianaConnection()
    const result = await pool.request()
      .query(`
        SELECT 
          d.C_CODIGO as codigo,
          d.C_DESCRIPCIO as nombre,
          COUNT(p.c_Codigo) as total_productos
        FROM MA_DEPARTAMENTOS d
        LEFT JOIN MA_PRODUCTOS p ON d.C_CODIGO = p.c_Departamento 
          AND p.n_Activo = 1 
          AND p.n_Precio1 > 0
        WHERE d.C_CODIGO != '08'
        GROUP BY d.C_CODIGO, d.C_DESCRIPCIO
        HAVING COUNT(p.c_Codigo) > 0
        ORDER BY d.C_DESCRIPCIO
      `)
    
    return result.recordset
  } catch (error) {
    console.error('Error fetching Victoriana departments:', error)
    throw error
  }
}

export async function getVictorianaGroups(departmentId: string) {
  try {
    const pool = await getVictorianaConnection()
    const result = await pool.request()
      .input('department', sql.NVarChar, departmentId)
      .query(`
        SELECT 
          g.c_CODIGO as codigo,
          g.C_DESCRIPCIO as nombre,
          COUNT(p.c_Codigo) as total_productos
        FROM MA_GRUPOS g
        LEFT JOIN MA_PRODUCTOS p ON g.c_CODIGO = p.c_Grupo 
          AND p.c_Departamento = @department
          AND p.n_Activo = 1 
          AND p.n_Precio1 > 0
        WHERE g.c_departamento = @department
        GROUP BY g.c_CODIGO, g.C_DESCRIPCIO
        HAVING COUNT(p.c_Codigo) > 0
        ORDER BY g.C_DESCRIPCIO
      `)
    
    return result.recordset
  } catch (error) {
    console.error('Error fetching Victoriana groups:', error)
    throw error
  }
}

export async function getVictorianaProducts(departmentId?: string, groupId?: string) {
  try {
    const pool = await getVictorianaConnection()
    let query = `
      SELECT 
        p.c_Codigo as codigo,
        p.c_Descri as descripcion,
        p.cu_Descripcion_Corta as descripcion_corta,
        p.n_Precio1 as precio,
        p.c_Marca as marca,
        p.c_Presenta as presentacion,
        p.n_Activo as activo,
        p.c_Departamento as departamento,
        p.c_Grupo as grupo
      FROM MA_PRODUCTOS p
      WHERE p.n_Activo = 1 
        AND p.n_Precio1 > 0
    `
    
    const request = pool.request()
    
    if (departmentId) {
      query += ' AND p.c_Departamento = @departmentId'
      request.input('departmentId', sql.NVarChar, departmentId)
    }
    
    if (groupId) {
      query += ' AND p.c_Grupo = @groupId'
      request.input('groupId', sql.NVarChar, groupId)
    }
    
    query += ' ORDER BY p.c_Descri'
    
    const result = await request.query(query)
    
    return result.recordset.map((item: any) => ({
      ...item,
      item_id: item.codigo,
      item_name: item.descripcion,
      description: item.descripcion_corta,
      price: item.precio,
      finalPrice: item.precio
    }))
  } catch (error) {
    console.error('Error fetching Victoriana products:', error)
    throw error
  }
}

export async function getVictorianaProductPrice(itemId: string) {
  try {
    const pool = await getVictorianaConnection()
    const result = await pool.request()
      .input('itemId', sql.NVarChar, itemId)
      .query(`
        SELECT 
          p.n_Precio1 as precio
        FROM MA_PRODUCTOS p
        WHERE p.c_Codigo = @itemId
          AND p.n_Activo = 1
      `)
    
    if (result.recordset.length > 0) {
      const { precio } = result.recordset[0]
      return precio
    }
    
    return null
  } catch (error) {
    console.error('Error fetching Victoriana product price:', error)
    throw error
  }
}

// Cerrar conexiones
export async function closeConnections() {
  try {
    if (bunkerPool) {
      await bunkerPool.close()
      bunkerPool = null
    }
    if (victorianaPool) {
      await victorianaPool.close()
      victorianaPool = null
    }
  } catch (error) {
    console.error('Error closing connections:', error)
  }
}