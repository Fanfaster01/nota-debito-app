// src/lib/services/comparadorPreciosService.ts

import { createClient as createSafeSupabaseClient } from '@/utils/supabase/client-wrapper'
import type { DatabaseExtended } from '@/types/database-extended'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'
import { validate, assertValid } from '@/utils/validators'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type {
  ListaPrecio,
  ProductoLista,
  ProductoMaestro,
  ConfiguracionProveedor,
  ComparacionPrecios,
  ResultadoComparacion,
  EstadisticasComparacion,
  ProcesamientoIA,
  UploadListaResponse,
  ProcesamientoListaResponse,
  ComparacionResponse,
  FiltrosComparacion
} from '@/types/comparadorPrecios'
import {
  EstadoProcesamiento,
  ModeloIA
} from '@/types/comparadorPrecios'

// Interfaz para el JSON response de Gemini
interface GeminiProductoResponse {
  codigo?: string
  nombre: string
  presentacion?: string
  precio: string | number
  unidad?: string
  marca?: string
  confianza?: number
}

export class ComparadorPreciosService {
  private supabase = createSafeSupabaseClient()
  
  // Cliente tipado para las nuevas tablas
  private get supabaseExtended(): SupabaseClient<DatabaseExtended> {
    return this.supabase as SupabaseClient<DatabaseExtended>
  }
  
  // Configuración de IA
  private readonly GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  private genAI: GoogleGenerativeAI | null = null
  private readonly isGeminiConfigured: boolean
  
  constructor() {
    this.isGeminiConfigured = !!this.GEMINI_API_KEY
    
    if (this.isGeminiConfigured) {
      try {
        this.genAI = new GoogleGenerativeAI(this.GEMINI_API_KEY!)
      } catch (error) {
        console.error('Error al inicializar Google Gemini:', error)
        this.isGeminiConfigured = false
      }
    }
  }

  private ensureGeminiConfigured(): GoogleGenerativeAI {
    if (!this.GEMINI_API_KEY) {
      throw new Error('Google Gemini API Key no está configurada. Configure NEXT_PUBLIC_GEMINI_API_KEY en las variables de entorno.')
    }
    
    if (!this.genAI) {
      throw new Error('Google Gemini no se pudo inicializar. Verifica que la API Key sea válida.')
    }
    
    return this.genAI
  }

  // ====== GESTIÓN DE LISTAS DE PRECIO ======
  
  async uploadLista(
    companyId: string,
    archivo: File,
    proveedorNombre: string,
    fechaLista: Date,
    moneda: 'USD' | 'BS',
    tasaCambio?: number
  ): Promise<{ data: UploadListaResponse | null, error: unknown }> {
    try {
      console.log('ComparadorPreciosService.uploadLista iniciado')
      assertValid(validate.companyId(companyId), 'ID de compañía')
      console.log('Validación de companyId exitosa')
      
      if (!archivo) {
        throw new Error('Archivo requerido')
      }
      
      if (!proveedorNombre?.trim()) {
        throw new Error('Nombre de proveedor requerido')
      }
      
      // Validar tipo de archivo
      const formatosPermitidos = ['xlsx', 'xls', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']
      const extension = archivo.name.split('.').pop()?.toLowerCase()
      
      if (!extension || !formatosPermitidos.includes(extension)) {
        return createErrorResponse('Formato de archivo no soportado. Se permiten: Excel (.xlsx, .xls), CSV, PDF, imágenes (PNG, JPG, WEBP, HEIC, HEIF).')
      }

      // Subir archivo a Supabase Storage
      const fileName = `${companyId}/${Date.now()}_${archivo.name}`
      console.log('Subiendo archivo a Storage:', fileName)
      
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('listas-precios')
        .upload(fileName, archivo)
        
      console.log('Resultado de upload a Storage:', { uploadData, uploadError })

      if (uploadError) {
        return createErrorResponse(handleServiceError(uploadError, 'Error al subir archivo'))
      }

      // Crear registro en BD
      const { data: lista, error: dbError } = await this.supabaseExtended
        .from('listas_precio')
        .insert({
          company_id: companyId,
          proveedor_nombre: proveedorNombre,
          fecha_lista: fechaLista.toISOString().split('T')[0],
          moneda,
          tasa_cambio: tasaCambio,
          archivo_original: uploadData.path,
          formato_archivo: extension,
          estado_procesamiento: EstadoProcesamiento.PENDIENTE
        })
        .select()
        .single()

      if (dbError) {
        return createErrorResponse(handleServiceError(dbError, 'Error al crear registro de lista'))
      }

      return createSuccessResponse({
        listaId: lista.id,
        mensaje: 'Lista de precios cargada exitosamente'
      })

    } catch (error) {
      console.error('Error detallado al cargar lista de precios:', error)
      
      // Verificar si es un error de red
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return createErrorResponse('Error de conexión. Verifica tu conexión a internet y vuelve a intentar.')
      }
      
      // Verificar si es un error de autenticación
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message
        if (message.includes('Invalid API key') || message.includes('authentication')) {
          return createErrorResponse('Error de autenticación con Google Gemini. Verifica la configuración de API Key.')
        }
      }
      
      return createErrorResponse(handleServiceError(error, 'Error al cargar lista de precios'))
    }
  }

  async procesarListaConIA(
    listaId: string,
    modelo: ModeloIA = ModeloIA.GEMINI_15_FLASH
  ): Promise<{ data: ProcesamientoListaResponse | null, error: unknown }> {
    try {
      const startTime = Date.now()
      
      // Obtener información de la lista
      const { data: lista, error: listaError } = await this.supabaseExtended
        .from('listas_precio')
        .select('*')
        .eq('id', listaId)
        .single()

      if (listaError || !lista) {
        return createErrorResponse('Lista de precios no encontrada')
      }

      // Actualizar estado a procesando
      await this.supabaseExtended
        .from('listas_precio')
        .update({ estado_procesamiento: EstadoProcesamiento.PROCESANDO })
        .eq('id', listaId)

      // Descargar archivo
      const { data: archivoData } = await this.supabase.storage
        .from('listas-precios')
        .download(lista.archivo_original)

      if (!archivoData) {
        throw new Error('No se pudo descargar el archivo')
      }

      // Procesar con IA usando Gemini
      let productosExtraidos: ProductoLista[] = []
      let tokensUsados = 0

      const resultado = await this.procesarArchivoConGemini(archivoData, lista.formato_archivo, modelo, lista.moneda as 'USD' | 'BS')
      productosExtraidos = resultado.productos
      tokensUsados = resultado.tokens

      // Guardar productos extraídos
      const productosParaInsertar = productosExtraidos.map(producto => ({
        ...producto,
        lista_precio_id: listaId,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await this.supabaseExtended
        .from('productos_lista')
        .insert(productosParaInsertar)

      if (insertError) {
        throw new Error(handleServiceError(insertError, 'Error al guardar productos'))
      }

      // Realizar matching con productos maestro
      const productosMatcheados = await this.realizarMatching(listaId, lista.company_id)

      // Calcular métricas
      const confianzaPromedio = productosExtraidos.reduce((sum, p) => sum + p.confianzaExtraccion, 0) / productosExtraidos.length
      const tiempoProcesamiento = Date.now() - startTime

      // Registrar uso de IA
      await this.registrarUsoIA({
        listaPrecioId: listaId,
        tipoOperacion: 'extraccion',
        modelo,
        tokensUsados: tokensUsados,
        costoEstimado: this.calcularCostoIA(modelo, tokensUsados),
        tiempoProcesamiento: tiempoProcesamiento,
        exitoso: true
      })

      // Actualizar estado y métricas
      await this.supabaseExtended
        .from('listas_precio')
        .update({
          estado_procesamiento: EstadoProcesamiento.COMPLETADO,
          productos_extraidos: productosExtraidos.length
        })
        .eq('id', listaId)

      return createSuccessResponse({
        listaId,
        productosExtraidos: productosExtraidos.length,
        productosMatcheados,
        confianzaPromedio,
        tiempoProcesamiento,
        costoIA: this.calcularCostoIA(modelo, tokensUsados)
      })

    } catch (error) {
      console.error('Error detallado al procesar lista con IA:', error)
      
      // Actualizar estado de error
      await this.supabaseExtended
        .from('listas_precio')
        .update({ estado_procesamiento: EstadoProcesamiento.ERROR })
        .eq('id', listaId)

      // Verificar si es un error específico de Gemini
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as any).message
        if (message.includes('Gemini API')) {
          return createErrorResponse(`Error al procesar con Google Gemini: ${message}`)
        }
      }

      return createErrorResponse(handleServiceError(error, 'Error al procesar lista con IA'))
    }
  }

  // ====== MÉTODOS PRIVADOS DE PROCESAMIENTO IA GEMINI ======

  private async procesarArchivoConGemini(
    archivo: Blob, 
    formato: string, 
    modelo: ModeloIA,
    moneda: 'USD' | 'BS' = 'BS'
  ): Promise<{ productos: ProductoLista[], tokens: number }> {
    try {
      // Determinar si usar File API o procesamiento directo
      const formatosFileAPI = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']
      const formatosDirectos = ['xlsx', 'xls', 'csv']
      
      if (formatosFileAPI.includes(formato)) {
        // Usar Gemini File API para archivos multimodales
        return await this.procesarConFileAPI(archivo, formato, modelo, moneda)
      } else if (formatosDirectos.includes(formato)) {
        // Procesamiento directo para Excel/CSV (fallback mejorado)
        return await this.procesarArchivoDirecto(archivo, formato, modelo, moneda)
      } else {
        throw new Error(`Formato no soportado: ${formato}`)
      }
      
    } catch (error) {
      throw new Error(`Error al procesar archivo con Gemini: ${handleServiceError(error, 'Procesamiento IA')}`)
    }
  }

  private async procesarConFileAPI(
    archivo: Blob,
    formato: string,
    modelo: ModeloIA,
    moneda: 'USD' | 'BS' = 'BS'
  ): Promise<{ productos: ProductoLista[], tokens: number }> {
    try {
      const formatosImagen = ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif']
      
      if (formatosImagen.includes(formato)) {
        // Procesar imágenes con base64
        return await this.procesarImagenConGemini(archivo, formato, modelo, moneda)
      } else if (formato === 'pdf') {
        // Para PDFs, intentar extracción de texto como fallback
        return await this.procesarPDFConFallback(archivo, modelo, moneda)
      } else {
        throw new Error(`Formato multimodal no soportado: ${formato}`)
      }
      
    } catch (error) {
      throw new Error(`Error en procesamiento multimodal: ${handleServiceError(error, 'Procesamiento multimodal')}`)
    }
  }

  private async procesarImagenConGemini(
    archivo: Blob,
    formato: string,
    modelo: ModeloIA,
    moneda: 'USD' | 'BS' = 'BS'
  ): Promise<{ productos: ProductoLista[], tokens: number }> {
    try {
      // Convertir imagen a base64
      const base64Data = await this.convertirArchivoABase64(archivo)
      const mimeType = this.getMimeType(formato)
      
      const genAI = this.ensureGeminiConfigured()
      const model = genAI.getGenerativeModel({
        model: modelo,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      })

      const prompt = this.generarPromptParaArchivo(formato)
      
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }

      const result = await model.generateContent([prompt, imagePart])
      const response = await result.response
      const text = response.text()
      
      // Estimar tokens (imagen + texto)
      const estimatedTokens = Math.ceil((text.length + 1000) / 4) // +1000 para la imagen
      
      return this.procesarRespuestaGemini({
        contenido: text,
        tokens: estimatedTokens
      }, moneda)
      
    } catch (error) {
      throw new Error(`Error al procesar imagen: ${handleServiceError(error, 'Procesamiento de imagen')}`)
    }
  }

  private async procesarPDFConFallback(
    archivo: Blob,
    modelo: ModeloIA,
    moneda: 'USD' | 'BS' = 'BS'
  ): Promise<{ productos: ProductoLista[], tokens: number }> {
    // Para PDFs, lanzamos un error especial que será manejado en la UI
    const error = new Error('PDF_CONVERSION_NEEDED')
    ;(error as any).isPDFConversionError = true
    throw error
  }

  private async procesarArchivoDirecto(
    archivo: Blob,
    formato: string,
    modelo: ModeloIA,
    moneda: 'USD' | 'BS' = 'BS'
  ): Promise<{ productos: ProductoLista[], tokens: number }> {
    try {
      let contenidoTexto: string
      
      if (['xlsx', 'xls'].includes(formato)) {
        const contenidoJSON = await this.convertExcelToJSON(archivo)
        contenidoTexto = JSON.stringify(contenidoJSON).substring(0, 30000) // Más contexto para Gemini
      } else if (formato === 'csv') {
        contenidoTexto = await archivo.text()
        // Gemini puede manejar más contenido
        if (contenidoTexto.length > 30000) {
          contenidoTexto = contenidoTexto.substring(0, 30000)
        }
      } else {
        throw new Error(`Formato directo no soportado: ${formato}`)
      }

      const resultado = await this.llamarGeminiDirecto(modelo, contenidoTexto, formato)
      return this.procesarRespuestaGemini(resultado, moneda)
      
    } catch (error) {
      throw new Error(`Error en procesamiento directo: ${handleServiceError(error, 'Procesamiento directo')}`)
    }
  }

  private getMimeType(formato: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'csv': 'text/csv'
    }
    return mimeTypes[formato] || 'application/octet-stream'
  }

  private async convertirArchivoABase64(archivo: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remover el prefijo "data:mime/type;base64,"
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = () => reject(new Error('Error al convertir archivo a base64'))
      reader.readAsDataURL(archivo)
    })
  }


  private generarPromptParaArchivo(formato: string): string {
    const tipoArchivo = formato === 'pdf' ? 'PDF' : 
                       ['png', 'jpg', 'jpeg', 'webp', 'heic', 'heif'].includes(formato) ? 'imagen' : 
                       formato.toUpperCase()

    return `
Eres un experto en análisis de listas de precios. Analiza este ${tipoArchivo} que contiene una lista de precios de productos y extrae TODOS los productos encontrados.

INSTRUCCIONES IMPORTANTES:
1. Identifica y extrae cada producto listado en el archivo
2. Para cada producto, busca: código, nombre, precio, presentación/tamaño, unidad de medida, marca
3. Normaliza los precios a números decimales (elimina símbolos de moneda, comas, espacios)
4. Si el archivo es una imagen, lee cuidadosamente todo el texto visible
5. Si es un PDF, analiza todas las tablas y listas de productos
6. Asigna una confianza de 0-100 basada en qué tan clara está la información
7. Si no encuentras algún campo, usa string vacío o 0 para números

FORMATO DE RESPUESTA:
Responde EXCLUSIVAMENTE con un JSON válido, sin texto adicional ni explicaciones:
[
  {
    "codigo": "código del producto o vacío",
    "nombre": "nombre completo del producto",
    "presentacion": "presentación/tamaño o vacío", 
    "precio": número_decimal,
    "unidad": "unidad de medida o vacío",
    "marca": "marca del producto o vacío",
    "confianza": número_entre_0_y_100
  }
]

IMPORTANTE: 
- Extrae TODOS los productos visibles
- Sé preciso con los números de precios
- Mantén los nombres de productos completos y exactos
- Si ves tablas, extrae cada fila como un producto separado
`
  }

  private async llamarGeminiDirecto(
    modelo: ModeloIA, 
    contenido: string, 
    formato: string
  ): Promise<{ contenido: string, tokens: number }> {
    try {
      const genAI = this.ensureGeminiConfigured()
      const model = genAI.getGenerativeModel({ 
        model: modelo,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4000,
        }
      })

      const prompt = this.generarPromptExtraccion(contenido, formato)
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      // Estimamos basado en la longitud del contenido y respuesta
      const estimatedTokens = Math.ceil((contenido.length + text.length) / 4)
      
      return {
        contenido: text,
        tokens: estimatedTokens
      }
      
    } catch (error) {
      throw new Error(`Error al llamar Gemini API: ${handleServiceError(error, 'Gemini API')}`)
    }
  }

  private generarPromptExtraccion(contenido: string, formato: string): string {
    return `
Eres un experto en análisis de listas de precios. Analiza el siguiente ${formato.toUpperCase()} y extrae TODOS los productos encontrados.

INSTRUCCIONES IMPORTANTES:
1. Identifica automáticamente las columnas que corresponden a: código, nombre, precio, presentación, unidad, marca
2. Extrae cada fila que represente un producto
3. Normaliza los precios a números (elimina símbolos de moneda, comas, etc.)
4. Asigna una confianza de 0-100 basada en qué tan clara está la información
5. Si no encuentras algún campo, deja el string vacío o 0 para números

FORMATO DE RESPUESTA:
Responde EXCLUSIVAMENTE con un JSON válido, sin texto adicional:
[
  {
    "codigo": "código del producto o vacío",
    "nombre": "nombre completo del producto",
    "presentacion": "presentación/tamaño o vacío", 
    "precio": número_decimal,
    "unidad": "unidad de medida o vacío",
    "marca": "marca del producto o vacío",
    "confianza": número_entre_0_y_100
  }
]

CONTENIDO A ANALIZAR:
${contenido}
`
  }

  private procesarRespuestaGemini(respuesta: { contenido: string, tokens: number }, moneda: 'USD' | 'BS' = 'BS'): { productos: ProductoLista[], tokens: number } {
    try {
      // Limpiar respuesta y extraer JSON - Gemini puede incluir markdown
      let jsonStr = respuesta.contenido.trim()
      
      // Remover posibles markdown code blocks
      jsonStr = jsonStr.replace(/```json\s*/, '').replace(/```\s*$/, '')
      
      // Buscar el array JSON en la respuesta
      const startIndex = jsonStr.indexOf('[')
      const endIndex = jsonStr.lastIndexOf(']') + 1
      
      if (startIndex !== -1 && endIndex !== -1) {
        jsonStr = jsonStr.substring(startIndex, endIndex)
      }

      const productosRaw = JSON.parse(jsonStr)
      
      if (!Array.isArray(productosRaw)) {
        throw new Error('La respuesta de Gemini no es un array válido')
      }
      
      const productos: ProductoLista[] = productosRaw.map((p: GeminiProductoResponse) => ({
        id: '', // Se asignará en BD
        listaPrecioId: '', // Se asignará después
        codigoOriginal: p.codigo || undefined,
        nombreOriginal: p.nombre || '',
        nombreNormalizado: this.normalizarNombre(p.nombre || ''),
        presentacion: p.presentacion || undefined,
        unidadMedida: p.unidad || undefined,
        precioUnitario: parseFloat(String(p.precio)) || 0,
        precioMonedaOriginal: parseFloat(String(p.precio)) || 0,
        moneda: moneda,
        categoria: undefined,
        marca: p.marca || undefined,
        observaciones: undefined,
        confianzaExtraccion: Math.min(100, Math.max(0, p.confianza || 85)),
        matchingId: undefined
      })).filter(p => p.nombreOriginal.trim() !== '') // Filtrar productos sin nombre

      return { productos, tokens: respuesta.tokens }
    } catch (error) {
      throw new Error(`Error al procesar respuesta de Gemini: ${handleServiceError(error, 'Error de parsing JSON')}`)
    }
  }

  // ====== MÉTODOS AUXILIARES ======

  private async convertExcelToJSON(archivo: Blob): Promise<unknown> {
    try {
      const XLSX = await import('xlsx')
      const arrayBuffer = await archivo.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      
      // Tomar la primera hoja
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      
      // Convertir a JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, // Usar números como headers
        raw: false // Convertir todo a string
      })
      
      return jsonData
    } catch (error) {
      throw new Error(`Error al convertir Excel: ${handleServiceError(error, 'Error de parsing Excel')}`)
    }
  }

  private async convertCSVToJSON(contenido: string): Promise<unknown> {
    try {
      const Papa = await import('papaparse')
      const result = Papa.default.parse(contenido, {
        header: false,
        skipEmptyLines: true,
        delimiter: ',',
        download: false,
        worker: false
      })
      
      if (result.errors.length > 0) {
        console.warn('Errores en parsing CSV:', result.errors)
      }
      
      return result.data
    } catch (error) {
      throw new Error(`Error al convertir CSV: ${handleServiceError(error, 'Error de parsing CSV')}`)
    }
  }

  private normalizarNombre(nombre: string): string {
    return nombre
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sñáéíóú]/gi, '') // Mantener caracteres españoles
      .replace(/\b(kg|gr|g|ml|l|lt|lts|unid|und|pza|pieza|caja|bulto|display)\b/gi, '') // Remover unidades comunes
      .trim()
  }

  private calcularCostoIA(modelo: ModeloIA, tokens: number): number {
    const costoPorToken = {
      [ModeloIA.GEMINI_15_FLASH]: 0.000000075, // $0.075 per 1M tokens - GRATIS hasta 1M
      [ModeloIA.GEMINI_15_PRO]: 0.000000375,  // $0.375 per 1M tokens - GRATIS hasta 50K
      [ModeloIA.GEMINI_PRO]: 0.000000375      // Similar a 1.5 Pro
    }

    // Los primeros 1M tokens de Flash son gratis, 50K de Pro
    const limiteGratuito = modelo === ModeloIA.GEMINI_15_FLASH ? 1000000 : 50000
    const tokensFacturables = Math.max(0, tokens - limiteGratuito)

    return tokensFacturables * (costoPorToken[modelo] || 0)
  }

  private async realizarMatching(listaId: string, companyId: string): Promise<number> {
    try {
      // Obtener productos de la lista
      const { data: productosLista, error: productosError } = await this.supabaseExtended
        .from('productos_lista')
        .select('*')
        .eq('lista_precio_id', listaId)

      if (productosError || !productosLista) {
        return 0
      }

      // Obtener productos maestro de la compañía
      const { data: productosMaestro, error: maestroError } = await this.supabaseExtended
        .from('productos_maestro')
        .select('*')
        .eq('company_id', companyId)
        .eq('activo', true)

      if (maestroError || !productosMaestro) {
        return 0
      }

      let productosMatcheados = 0

      // Realizar matching para cada producto de la lista
      for (const producto of productosLista) {
        const match = await this.encontrarMejorMatchConMeili(producto, companyId)
        
        if (match) {
          // Actualizar el producto con el match encontrado
          await this.supabaseExtended
            .from('productos_lista')
            .update({ matching_id: match.id })
            .eq('id', producto.id)
          
          productosMatcheados++
        }
      }

      return productosMatcheados
    } catch (error) {
      console.error('Error en matching:', handleServiceError(error, 'Error en proceso de matching'))
      return 0
    }
  }

  private async encontrarMejorMatchConMeili(
    productoLista: ProductoLista,
    companyId: string
  ): Promise<ProductoMaestro | null> {
    try {
      const { meilisearchService } = await import('./meilisearchService')
      
      if (!meilisearchService.isAvailable()) {
        return this.encontrarMejorMatchFallback(productoLista, companyId)
      }
      
      // Convertir formato de base de datos a formato de aplicación
      const productoListaFormateado = {
        id: productoLista.id,
        listaPrecioId: productoLista.listaPrecioId,
        codigoOriginal: productoLista.codigoOriginal,
        nombreOriginal: productoLista.nombreOriginal,
        nombreNormalizado: productoLista.nombreNormalizado,
        presentacion: productoLista.presentacion,
        unidadMedida: productoLista.unidadMedida,
        precioUnitario: productoLista.precioUnitario,
        precioMonedaOriginal: productoLista.precioMonedaOriginal,
        moneda: productoLista.moneda,
        categoria: productoLista.categoria,
        marca: productoLista.marca,
        observaciones: productoLista.observaciones,
        confianzaExtraccion: productoLista.confianzaExtraccion,
        matchingId: productoLista.matchingId
      }

      const { data: match, error } = await meilisearchService.encontrarMejorMatch(
        companyId,
        productoListaFormateado,
        0.7
      )

      if (error) {
        console.warn('Error en Meilisearch, usando fallback:', error)
        return this.encontrarMejorMatchFallback(productoLista, companyId)
      }

      return match
    } catch (error) {
      console.warn('Meilisearch no disponible, usando fallback:', error)
      return this.encontrarMejorMatchFallback(productoLista, companyId)
    }
  }

  private async encontrarMejorMatchFallback(
    productoLista: ProductoLista,
    companyId: string
  ): Promise<ProductoMaestro | null> {
    try {
      // Fallback simple usando base de datos
      const { data: productosMaestro } = await this.supabaseExtended
        .from('productos_maestro')
        .select('*')
        .eq('company_id', companyId)
        .eq('activo', true)
        .limit(50)

      if (!productosMaestro || productosMaestro.length === 0) {
        return null
      }

      // Matching simple por nombre
      const nombreBusqueda = this.normalizarNombre(productoLista.nombreOriginal)
      
      for (const maestro of productosMaestro) {
        // Coincidencia exacta de código
        if (productoLista.codigoOriginal && maestro.codigo &&
            productoLista.codigoOriginal.toLowerCase() === maestro.codigo.toLowerCase()) {
          return maestro
        }

        // Coincidencia parcial de nombre
        const nombreMaestro = this.normalizarNombre(maestro.nombre)
        if (nombreBusqueda.includes(nombreMaestro) || nombreMaestro.includes(nombreBusqueda)) {
          return maestro
        }
      }

      return null
    } catch (error) {
      console.error('Error en fallback matching:', error)
      return null
    }
  }

  private async registrarUsoIA(registro: Omit<ProcesamientoIA, 'id' | 'createdAt'>): Promise<void> {
    await this.supabaseExtended
      .from('procesamiento_ia')
      .insert({
        lista_precio_id: registro.listaPrecioId,
        tipo_operacion: registro.tipoOperacion,
        modelo: registro.modelo,
        tokens_usados: registro.tokensUsados,
        costo_estimado: registro.costoEstimado,
        tiempo_procesamiento: registro.tiempoProcesamiento,
        exitoso: registro.exitoso,
        error: registro.error
      })
  }

  // ====== MÉTODOS PÚBLICOS ADICIONALES ======

  async getListas(
    companyId: string,
    filtros?: { estado?: EstadoProcesamiento, proveedor?: string }
  ): Promise<{ data: ListaPrecio[] | null, error: unknown }> {
    try {
      console.log('ComparadorPreciosService.getListas - companyId:', companyId)
      
      let query = this.supabaseExtended
        .from('listas_precio')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (filtros?.estado) {
        query = query.eq('estado_procesamiento', filtros.estado)
      }

      if (filtros?.proveedor) {
        query = query.ilike('proveedor_nombre', `%${filtros.proveedor}%`)
      }

      const { data, error } = await query
      
      console.log('ComparadorPreciosService.getListas - resultado:', { 
        data: data?.length || 0, 
        error: error?.message,
        registros: data 
      })

      if (error) {
        return createErrorResponse(handleServiceError(error, 'Error al obtener listas'))
      }

      return createSuccessResponse(data as ListaPrecio[])
    } catch (error) {
      console.error('ComparadorPreciosService.getListas - error:', error)
      return createErrorResponse(handleServiceError(error, 'Error al obtener listas de precios'))
    }
  }

  async deleteLista(listaId: string): Promise<{ data: null, error: unknown }> {
    try {
      // Eliminar archivo del storage
      const { data: lista } = await this.supabaseExtended
        .from('listas_precio')
        .select('archivo_original')
        .eq('id', listaId)
        .single()

      if (lista?.archivo_original) {
        await this.supabase.storage
          .from('listas-precios')
          .remove([lista.archivo_original])
      }

      // Eliminar registro (cascade eliminará productos relacionados)
      const { error } = await this.supabaseExtended
        .from('listas_precio')
        .delete()
        .eq('id', listaId)

      if (error) {
        return createErrorResponse(handleServiceError(error, 'Error al eliminar lista'))
      }

      return createSuccessResponse(null)
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al eliminar lista de precios'))
    }
  }

  // ====== MÉTODOS DE MANTENIMIENTO ======

  async limpiarRegistrosHuerfanos(
    companyId: string
  ): Promise<{ data: { eliminados: number } | null, error: unknown }> {
    try {
      assertValid(validate.companyId(companyId), 'ID de compañía')

      // Obtener todas las listas de la compañía
      const { data: listas, error: listasError } = await this.supabaseExtended
        .from('listas_precio')
        .select('id, archivo_original')
        .eq('company_id', companyId)

      if (listasError) {
        return createErrorResponse(handleServiceError(listasError, 'Error al obtener listas'))
      }

      if (!listas || listas.length === 0) {
        return createSuccessResponse({ eliminados: 0 })
      }

      const registrosAEliminar: string[] = []

      // Verificar cada lista si su archivo existe en storage
      for (const lista of listas) {
        if (!lista.archivo_original) {
          // Lista sin archivo original, marcar para eliminar
          registrosAEliminar.push(lista.id)
          continue
        }

        try {
          // Intentar acceder al archivo en storage
          const { error: downloadError } = await this.supabase.storage
            .from('listas-precios')
            .download(lista.archivo_original)

          if (downloadError) {
            // Si no se puede descargar, el archivo no existe
            registrosAEliminar.push(lista.id)
          }
        } catch {
          // Error al acceder, marcar para eliminar
          registrosAEliminar.push(lista.id)
        }
      }

      console.log(`Encontrados ${registrosAEliminar.length} registros huérfanos para eliminar`)

      // Eliminar registros huérfanos (cascade eliminará productos relacionados)
      let eliminados = 0
      if (registrosAEliminar.length > 0) {
        const { error: deleteError } = await this.supabaseExtended
          .from('listas_precio')
          .delete()
          .in('id', registrosAEliminar)

        if (deleteError) {
          return createErrorResponse(handleServiceError(deleteError, 'Error al eliminar registros huérfanos'))
        }

        eliminados = registrosAEliminar.length
      }

      return createSuccessResponse({ eliminados })

    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al limpiar registros huérfanos'))
    }
  }

  // ====== MÉTODOS DE COMPARACIÓN ======

  async compararListas(
    companyId: string,
    listasIds: string[]
  ): Promise<{ data: ComparacionResponse | null, error: unknown }> {
    try {
      if (listasIds.length < 2) {
        throw new Error('Se requieren al menos 2 listas para comparar')
      }
      
      // Crear registro de comparación
      const { data: comparacion, error: comparacionError } = await this.supabaseExtended
        .from('comparaciones_precios')
        .insert({
          company_id: companyId,
          listas_comparadas: listasIds,
          estado_comparacion: EstadoProcesamiento.PROCESANDO
        })
        .select()
        .single()

      if (comparacionError) {
        return createErrorResponse(handleServiceError(comparacionError, 'Error al crear comparación'))
      }

      // Obtener TODOS los productos de las listas (sin filtrar por matching_id)
      const { data: productos, error: productosError } = await this.supabaseExtended
        .from('productos_lista')
        .select(`
          *,
          lista_precio:listas_precio(*)
        `)
        .in('lista_precio_id', listasIds)

      if (productosError || !productos) {
        return createErrorResponse(handleServiceError(productosError, 'Error al obtener productos'))
      }

      // Agrupar productos por lista
      const productosPorLista = new Map<string, typeof productos>()
      for (const producto of productos) {
        const listaId = producto.lista_precio_id
        if (!productosPorLista.has(listaId)) {
          productosPorLista.set(listaId, [])
        }
        productosPorLista.get(listaId)?.push(producto)
      }

      const resultados: ResultadoComparacion[] = []
      const productosComparados = new Set<string>()
      let totalProductos = 0
      let productosMatcheados = 0

      // Tomar la primera lista como base
      const [primeraListaId] = listasIds
      const productosBase = productosPorLista.get(primeraListaId) || []

      // Intentar cargar Meilisearch si está disponible
      let meilisearchService: typeof import('./meilisearchService').meilisearchService | null = null
      try {
        const mod = await import('./meilisearchService')
        if (mod.meilisearchService.isAvailable()) {
          meilisearchService = mod.meilisearchService
        } else {
          console.warn('Meilisearch no está configurado, usando solo comparación con IA')
        }
      } catch (error) {
        console.warn('Meilisearch no disponible, usando comparación con IA:', error)
      }

      // Generar modelo de IA
      const genAI = this.ensureGeminiConfigured()
      const model = genAI.getGenerativeModel({
        model: ModeloIA.GEMINI_15_FLASH,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        }
      })

      for (const productoBase of productosBase) {
        if (productosComparados.has(productoBase.id)) continue

        totalProductos++
        const matches: Array<{producto: typeof productoBase, score: number, proveedor: string}> = []
        
        // El producto base siempre se incluye
        matches.push({ 
          producto: productoBase, 
          score: 1,
          proveedor: productoBase.lista_precio?.proveedor_nombre || 'Proveedor 1'
        })

        // Buscar productos similares en las otras listas
        for (const listaId of listasIds.slice(1)) {
          const productosLista = productosPorLista.get(listaId) || []
          let mejorMatch: typeof productoBase | null = null
          let mejorScore = 0

          // Primero intentar con Meilisearch si está disponible
          if (meilisearchService) {
            // Convertir el producto base al formato esperado
            const productoListaFormato: ProductoLista = {
              id: productoBase.id,
              listaPrecioId: productoBase.lista_precio_id,
              codigoOriginal: productoBase.codigo_original,
              nombreOriginal: productoBase.nombre_original,
              nombreNormalizado: productoBase.nombre_normalizado,
              presentacion: productoBase.presentacion,
              unidadMedida: productoBase.unidad_medida,
              precioUnitario: productoBase.precio_unitario,
              precioMonedaOriginal: productoBase.precio_moneda_original,
              moneda: productoBase.moneda,
              categoria: productoBase.categoria,
              marca: productoBase.marca,
              observaciones: productoBase.observaciones,
              confianzaExtraccion: productoBase.confianza_extraccion,
              matchingId: productoBase.matching_id
            }
            
            const { data: matchMeili } = await meilisearchService.encontrarMejorMatch(
              companyId,
              productoListaFormato,
              0.7
            )
            
            if (matchMeili) {
              // Buscar el producto en la lista actual que coincida con el match encontrado
              mejorMatch = productosLista.find(p => 
                (p.codigo_original && matchMeili.codigo && p.codigo_original.toLowerCase() === matchMeili.codigo.toLowerCase()) ||
                (p.nombre_normalizado && this.normalizarNombre(matchMeili.nombre) === p.nombre_normalizado)
              ) || null
              
              if (mejorMatch) {
                mejorScore = 0.9
              }
            }
          }

          // Si no hay match con Meilisearch, usar IA para comparar
          if (!mejorMatch) {
            for (const productoComparar of productosLista) {
              // Evitar comparar productos ya procesados
              if (productosComparados.has(productoComparar.id)) continue

              // Usar Gemini para determinar si son el mismo producto
              const prompt = `Compara estos dos productos y determina si son el mismo producto (pueden tener nombres ligeramente diferentes).
              
Producto 1: ${productoBase.nombre_original} ${productoBase.presentacion || ''}
Producto 2: ${productoComparar.nombre_original} ${productoComparar.presentacion || ''}

Responde SOLO con un número entre 0 y 1 indicando la probabilidad de que sean el mismo producto (1 = definitivamente el mismo, 0 = completamente diferentes).`

              try {
                const resultado = await model.generateContent(prompt)
                const respuesta = resultado.response.text().trim()
                const score = parseFloat(respuesta)
                
                if (!isNaN(score) && score > mejorScore && score >= 0.7) {
                  mejorScore = score
                  mejorMatch = productoComparar
                }
              } catch (error) {
                console.error('Error comparando con IA:', error)
              }
            }
          }

          if (mejorMatch) {
            matches.push({ 
              producto: mejorMatch, 
              score: mejorScore,
              proveedor: mejorMatch.lista_precio?.proveedor_nombre || `Proveedor ${listasIds.indexOf(listaId) + 1}`
            })
            productosComparados.add(mejorMatch.id)
          }
        }

        // Si encontramos matches en múltiples listas, crear resultado de comparación
        if (matches.length > 1) {
          productosMatcheados++

          // Crear o actualizar producto maestro basado en el producto base
          const { data: productoMaestro } = await this.supabaseExtended
            .from('productos_maestro')
            .upsert({
              company_id: companyId,
              codigo: productoBase.codigo_original || `AUTO-${Date.now()}-${totalProductos}`,
              nombre: productoBase.nombre_normalizado || productoBase.nombre_original,
              nombres_busqueda: matches.map(m => m.producto.nombre_original),
              presentacion: productoBase.presentacion || '',
              unidad_medida: productoBase.unidad_medida || 'UNIDAD',
              categoria: productoBase.categoria || 'GENERAL',
              marca: productoBase.marca || '',
              activo: true
            })
            .select()
            .single()

          if (productoMaestro) {
            // Actualizar matching_id en los productos
            for (const match of matches) {
              await this.supabaseExtended
                .from('productos_lista')
                .update({ matching_id: productoMaestro.id })
                .eq('id', match.producto.id)
            }

            // Normalizar precios a USD
            const preciosNormalizados = matches.map(match => {
              const producto = match.producto
              const precio = producto.precio_unitario
              const tasa = producto.lista_precio?.tasa_cambio || 1
              const precioUSD = producto.moneda === 'BS' ? precio / tasa : precio
              
              return {
                proveedorId: producto.lista_precio?.proveedor_id || '',
                proveedorNombre: match.proveedor,
                listaPrecioId: producto.lista_precio_id,
                productoListaId: producto.id,
                precio: producto.precio_unitario,
                moneda: producto.moneda,
                precioUSD,
                fechaLista: producto.lista_precio?.fecha_lista,
                confianzaMatch: Math.round(match.score * 100)
              }
            })

            // Encontrar mejor precio
            const mejorPrecio = preciosNormalizados.reduce((mejor, actual) => 
              actual.precioUSD < mejor.precioUSD ? actual : mejor
            )

            // Calcular diferencia porcentual
            const precioMaximo = Math.max(...preciosNormalizados.map(p => p.precioUSD))
            const precioMinimo = Math.min(...preciosNormalizados.map(p => p.precioUSD))
            const diferenciaPorcentual = precioMaximo > 0 ? 
              ((precioMaximo - precioMinimo) / precioMaximo) * 100 : 0

            // Detectar alertas de precio
            let alertaPrecio: 'subida_anormal' | 'bajada_anormal' | undefined = undefined
            if (diferenciaPorcentual > 50) {
              alertaPrecio = 'subida_anormal'
            }

            const resultado: ResultadoComparacion = {
              id: '', // Se asignará en BD
              comparacionId: comparacion.id,
              productoMaestroId: productoMaestro.id,
              productoNombre: productoMaestro.nombre,
              presentacion: productoMaestro.presentacion,
              precios: preciosNormalizados,
              mejorPrecio: {
                proveedorId: mejorPrecio.proveedorId,
                proveedorNombre: mejorPrecio.proveedorNombre,
                precio: mejorPrecio.precio,
                moneda: mejorPrecio.moneda as 'USD' | 'BS'
              },
              diferenciaPorcentual,
              alertaPrecio
            }

            resultados.push(resultado)
          }
        }

        productosComparados.add(productoBase.id)
      }

      // Guardar resultados
      if (resultados.length > 0) {
        const resultadosParaInsertar = resultados.map(resultado => ({
          comparacion_id: resultado.comparacionId,
          producto_maestro_id: resultado.productoMaestroId,
          producto_nombre: resultado.productoNombre,
          presentacion: resultado.presentacion,
          precios: resultado.precios,
          mejor_precio: resultado.mejorPrecio,
          diferencia_porcentual: resultado.diferenciaPorcentual,
          alerta_precio: resultado.alertaPrecio
        }))

        await this.supabaseExtended
          .from('resultados_comparacion')
          .insert(resultadosParaInsertar)
      }

      // Calcular estadísticas
      const estadisticas = this.calcularEstadisticas(resultados)

      // Actualizar comparación
      const tasaMatcheo = totalProductos > 0 ? (productosMatcheados / totalProductos) * 100 : 0
      await this.supabaseExtended
        .from('comparaciones_precios')
        .update({
          total_productos: totalProductos,
          productos_matcheados: productosMatcheados,
          tasa_matcheo: tasaMatcheo,
          estado_comparacion: EstadoProcesamiento.COMPLETADO
        })
        .eq('id', comparacion.id)

      return createSuccessResponse({
        comparacionId: comparacion.id,
        resultados,
        estadisticas,
        archivoExcel: undefined // Implementar exportación
      })

    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al comparar listas'))
    }
  }

  private calcularEstadisticas(resultados: ResultadoComparacion[]): EstadisticasComparacion {
    const totalProductos = resultados.length
    const productosConVariacion = resultados.filter(r => r.diferenciaPorcentual > 5).length
    const promedioDiferenciaPrecio = totalProductos > 0 ? 
      resultados.reduce((sum, r) => sum + r.diferenciaPorcentual, 0) / totalProductos : 0

    // Contar proveedores más baratos
    const conteoProveedores = new Map<string, number>()
    resultados.forEach(resultado => {
      const proveedor = resultado.mejorPrecio.proveedorNombre
      conteoProveedores.set(proveedor, (conteoProveedores.get(proveedor) || 0) + 1)
    })

    // Encontrar proveedor más barato y más caro
    let proveedorMasBarato = { id: '', nombre: '', porcentaje: 0 }
    let proveedorMasCaro = { id: '', nombre: '', porcentaje: 0 }

    if (conteoProveedores.size > 0) {
      const entries = Array.from(conteoProveedores.entries())
      const masBarato = entries.reduce((max, current) => current[1] > max[1] ? current : max)
      proveedorMasBarato = {
        id: '',
        nombre: masBarato[0],
        porcentaje: (masBarato[1] / totalProductos) * 100
      }
    }

    const alertasPrecios = resultados.filter(r => r.alertaPrecio).length

    return {
      totalProductos,
      productosConVariacion,
      promedioDiferenciaPrecio,
      proveedorMasBarato,
      proveedorMasCaro,
      alertasPrecios
    }
  }

  async getComparaciones(
    companyId: string,
    filtros?: FiltrosComparacion
  ): Promise<{ data: ComparacionPrecios[] | null, error: unknown }> {
    try {
      let query = this.supabaseExtended
        .from('comparaciones_precios')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (filtros?.fechaDesde) {
        query = query.gte('fecha_comparacion', filtros.fechaDesde.toISOString())
      }

      if (filtros?.fechaHasta) {
        query = query.lte('fecha_comparacion', filtros.fechaHasta.toISOString())
      }

      const { data, error } = await query

      if (error) {
        return createErrorResponse(handleServiceError(error, 'Error al obtener comparaciones'))
      }

      return createSuccessResponse(data as ComparacionPrecios[])
    } catch (error) {
      return createErrorResponse(handleServiceError(error, 'Error al obtener comparaciones'))
    }
  }
}

export const comparadorPreciosService = new ComparadorPreciosService()