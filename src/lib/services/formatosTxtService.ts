// Servicio para gestión de formatos TXT bancarios
import { createClient } from '@/utils/supabase/client'
import { handleServiceError, createErrorResponse, createSuccessResponse } from '@/utils/errorHandler'
import { validate, assertValid } from '@/utils/validators'

const supabase = createClient()
import type { FormatoTxtBancario, FacturaCuentaPorPagar, ProveedorConBanco } from '@/types/cuentasPorPagar'

interface FormatoTemplateStructure {
  estructura: string[]
  separador: string
  [key: string]: any
}

class FormatosTxtService {
  /**
   * Obtener todos los formatos TXT activos
   */
  async getFormatos(): Promise<{ data: FormatoTxtBancario[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('formatos_txt_bancarios')
        .select('*')
        .eq('activo', true)
        .order('nombre_banco')

      if (error) throw error

      const formatos: FormatoTxtBancario[] = data?.map(this.mapToFormatoTxtBancario) || []
      return { data: formatos, error: null }
    } catch (err) {
      console.error('Error obteniendo formatos TXT:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener los formatos TXT') }
    }
  }

  /**
   * Obtener formato por ID
   */
  async getFormatoPorId(id: string): Promise<{ data: FormatoTxtBancario | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('formatos_txt_bancarios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { data: this.mapToFormatoTxtBancario(data), error: null }
    } catch (err) {
      console.error('Error obteniendo formato TXT:', err)
      return { data: null, error: handleServiceError(err, 'Error al obtener el formato TXT') }
    }
  }

  /**
   * Crear nuevo formato TXT
   */
  async crearFormato(formato: Omit<FormatoTxtBancario, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: FormatoTxtBancario | null; error: string | null }> {
    try {
      const formatoData = {
        nombre_banco: formato.nombreBanco,
        codigo_banco: formato.codigoBanco,
        descripcion: formato.descripcion,
        formato_template: formato.formatoTemplate,
        campos_requeridos: formato.camposRequeridos,
        separador: formato.separador,
        extension_archivo: formato.extensionArchivo,
        activo: formato.activo
      }

      const { data, error } = await supabase
        .from('formatos_txt_bancarios')
        .insert(formatoData)
        .select()
        .single()

      if (error) throw error

      return { data: this.mapToFormatoTxtBancario(data), error: null }
    } catch (err) {
      console.error('Error creando formato TXT:', err)
      return { data: null, error: handleServiceError(err, 'Error al crear el formato TXT') }
    }
  }

  /**
   * Actualizar formato TXT
   */
  async actualizarFormato(id: string, updates: Partial<FormatoTxtBancario>): Promise<{ data: FormatoTxtBancario | null; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {}
      
      if (updates.nombreBanco) updateData.nombre_banco = updates.nombreBanco
      if (updates.codigoBanco) updateData.codigo_banco = updates.codigoBanco
      if (updates.descripcion !== undefined) updateData.descripcion = updates.descripcion
      if (updates.formatoTemplate) updateData.formato_template = updates.formatoTemplate
      if (updates.camposRequeridos) updateData.campos_requeridos = updates.camposRequeridos
      if (updates.separador) updateData.separador = updates.separador
      if (updates.extensionArchivo) updateData.extension_archivo = updates.extensionArchivo
      if (updates.activo !== undefined) updateData.activo = updates.activo

      const { data, error } = await supabase
        .from('formatos_txt_bancarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data: this.mapToFormatoTxtBancario(data), error: null }
    } catch (err) {
      console.error('Error actualizando formato TXT:', err)
      return { data: null, error: handleServiceError(err, 'Error al actualizar el formato TXT') }
    }
  }

  /**
   * Generar archivo TXT según formato y facturas
   */
  async generarArchivoTxt(
    formatoId: string,
    facturas: FacturaCuentaPorPagar[],
    proveedores: ProveedorConBanco[]
  ): Promise<{ data: string | null; error: string | null }> {
    try {
      // Validar parámetros de entrada
      try {
        assertValid(validate.companyId(formatoId), 'ID de formato')
      } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'ID de formato inválido' }
      }

      if (!facturas || facturas.length === 0) {
        return { data: null, error: 'No hay facturas para procesar' }
      }

      if (!proveedores || proveedores.length === 0) {
        return { data: null, error: 'No hay proveedores para procesar' }
      }

      // Obtener formato
      const formatoResult = await this.getFormatoPorId(formatoId)
      if (formatoResult.error || !formatoResult.data) {
        return { data: null, error: formatoResult.error || 'Formato no encontrado' }
      }

      const formato = formatoResult.data

      // Validar formato antes de procesar
      const validacion = this.validarFormato(formato)
      if (!validacion.valido) {
        return { 
          data: null, 
          error: `Formato inválido: ${validacion.errores.join('; ')}` 
        }
      }

      return this.procesarFormato(formato, facturas, proveedores)
    } catch (err) {
      console.error('Error generando archivo TXT:', err)
      return { data: null, error: handleServiceError(err, 'Error al generar el archivo TXT') }
    }
  }

  /**
   * Procesar formato y generar contenido TXT
   */
  private procesarFormato(
    formato: FormatoTxtBancario,
    facturas: FacturaCuentaPorPagar[],
    proveedores: ProveedorConBanco[]
  ): { data: string | null; error: string | null } {
    try {
      const lineas: string[] = []
      const separador = formato.separador

      // Agrupar facturas por proveedor
      const facturasPorProveedor = new Map<string, FacturaCuentaPorPagar[]>()
      facturas.forEach(factura => {
        const key = factura.proveedorRif
        if (!facturasPorProveedor.has(key)) {
          facturasPorProveedor.set(key, [])
        }
        facturasPorProveedor.get(key)!.push(factura)
      })

      // Procesar cada proveedor
      const proveedoresSinDatos: string[] = []
      
      for (const [proveedorRif, facturasProveedor] of facturasPorProveedor) {
        const proveedor = proveedores.find(p => p.rif === proveedorRif)
        
        if (!proveedor) {
          proveedoresSinDatos.push(`${proveedorRif} (no encontrado)`)
          continue
        }
        
        if (!proveedor.bancoFavorito) {
          proveedoresSinDatos.push(`${proveedorRif} (sin banco favorito)`)
          continue
        }

        const montoTotal = facturasProveedor.reduce((sum, f) => {
          const monto = f.montoFinalPagar || f.total || 0
          return sum + monto
        }, 0)
        
        if (montoTotal <= 0) {
          console.warn(`Proveedor ${proveedorRif} con monto total <= 0, omitiendo...`)
          continue
        }
        
        // Generar línea según estructura del formato
        const linea = this.generarLineaSegunFormato(
          formato,
          proveedor,
          facturasProveedor,
          montoTotal,
          separador
        )

        if (linea && linea.trim()) {
          lineas.push(linea)
        }
      }

      // Reportar proveedores con problemas si los hay
      if (proveedoresSinDatos.length > 0) {
        console.warn(`Proveedores omitidos: ${proveedoresSinDatos.join(', ')}`)
      }

      const contenido = lineas.join('\n')
      return { data: contenido, error: null }
    } catch (err) {
      console.error('Error procesando formato:', err)
      return { data: null, error: handleServiceError(err, 'Error al procesar el formato') }
    }
  }

  /**
   * Generar línea según estructura del formato
   */
  private generarLineaSegunFormato(
    formato: FormatoTxtBancario,
    proveedor: ProveedorConBanco,
    facturas: FacturaCuentaPorPagar[],
    montoTotal: number,
    separador: string
  ): string | null {
    try {
      const estructura = this.getFormatoEstructura(formato)
      if (estructura.length === 0) {
        console.error('Formato sin estructura válida')
        return null
      }
      
      const campos: string[] = []

      for (const campo of estructura) {
        let valor = ''

        try {
          switch (campo.toLowerCase()) {
            case 'numero_cuenta':
              valor = proveedor.bancoFavorito?.numeroCuenta || ''
              if (!valor) {
                console.warn(`Número de cuenta faltante para proveedor ${proveedor.rif}`)
              }
              break
            case 'tipo_cuenta':
              valor = proveedor.bancoFavorito?.tipoCuenta || 'CORRIENTE'
              break
            case 'monto':
            case 'monto_bs':
              valor = montoTotal.toFixed(2)
              break
            case 'monto_usd':
              const montoUsd = facturas.reduce((sum, f) => sum + (f.montoUSD || 0), 0)
              valor = montoUsd.toFixed(2)
              break
            case 'referencia':
              const numerosFactura = facturas.map(f => f.numero).filter(Boolean)
              valor = numerosFactura.length > 0 ? numerosFactura.join(', ') : 'SIN_REF'
              break
            case 'descripcion':
              const numerosDesc = facturas.map(f => f.numero).filter(Boolean)
              valor = numerosDesc.length > 0 
                ? `Pago facturas: ${numerosDesc.join(', ')}`
                : 'Pago de facturas'
              break
            case 'rif_beneficiario':
              valor = proveedor.rif || ''
              break
            case 'nombre_beneficiario':
              valor = proveedor.nombre || ''
              break
            case 'banco_codigo':
              valor = proveedor.bancoFavorito?.banco?.codigo || ''
              break
            case 'banco_nombre':
              valor = proveedor.bancoFavorito?.bancoNombre || 
                     proveedor.bancoFavorito?.banco?.nombre || ''
              break
            case 'fecha':
              valor = new Date().toISOString().split('T')[0].replace(/-/g, '')
              break
            case 'fecha_iso':
              valor = new Date().toISOString().split('T')[0]
              break
            default:
              // Campo personalizado o literal
              valor = campo
          }
        } catch (fieldError) {
          console.error(`Error procesando campo ${campo}:`, handleServiceError(fieldError, `Error al procesar campo ${campo}`))
          valor = ''
        }

        // Sanitizar el valor (remover caracteres problemáticos)
        valor = String(valor).replace(/[\r\n\t]/g, ' ').trim()
        campos.push(valor)
      }

      return campos.join(separador)
    } catch (err) {
      console.error('Error generando línea:', handleServiceError(err, 'Error al generar línea'))
      return null
    }
  }

  /**
   * Validar que un formato TXT tiene los campos requeridos
   */
  validarFormato(formato: FormatoTxtBancario): { valido: boolean; errores: string[] } {
    const errores: string[] = []

    // Validar nombre del banco
    if (!formato.nombreBanco || !formato.nombreBanco.trim()) {
      errores.push('El nombre del banco es requerido')
    }

    // Validar estructura del formato
    const estructura = this.getFormatoEstructura(formato)
    if (estructura.length === 0) {
      errores.push('La estructura del formato es requerida')
    }

    // Validar campos requeridos
    if (!formato.camposRequeridos || formato.camposRequeridos.length === 0) {
      errores.push('Los campos requeridos deben estar especificados')
    }

    // Validar que los campos requeridos estén en la estructura
    if (estructura.length > 0 && formato.camposRequeridos && formato.camposRequeridos.length > 0) {
      const faltantes = formato.camposRequeridos.filter(
        campo => !estructura.includes(campo)
      )
      
      if (faltantes.length > 0) {
        errores.push(`Campos requeridos faltantes en la estructura: ${faltantes.join(', ')}`)
      }
    }

    // Validar separador
    if (!formato.separador || formato.separador.trim() === '') {
      errores.push('El separador es requerido')
    }

    // Validar extensión de archivo
    if (!formato.extensionArchivo || formato.extensionArchivo.trim() === '') {
      errores.push('La extensión de archivo es requerida')
    }

    return {
      valido: errores.length === 0,
      errores
    }
  }

  /**
   * Descargar archivo TXT
   */
  descargarTxt(contenido: string, nombreArchivo: string, extension = 'txt'): void {
    try {
      // Validar parámetros
      if (!contenido || contenido.trim() === '') {
        console.error('Contenido vacío para descarga')
        return
      }

      if (!nombreArchivo || nombreArchivo.trim() === '') {
        nombreArchivo = `archivo_${Date.now()}`
      }

      // Sanitizar nombre de archivo
      const nombreSanitizado = nombreArchivo.replace(/[^a-zA-Z0-9_-]/g, '_')
      
      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `${nombreSanitizado}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando archivo TXT:', handleServiceError(err, 'Error al descargar archivo TXT'))
    }
  }

  /**
   * Obtener estructura del formato de forma segura
   */
  private getFormatoEstructura(formato: FormatoTxtBancario): string[] {
    try {
      const template = formato.formatoTemplate as FormatoTemplateStructure
      if (template && Array.isArray(template.estructura)) {
        return template.estructura
      }
      return []
    } catch (err) {
      console.error('Error accediendo a estructura del formato:', handleServiceError(err, 'Error al acceder a estructura del formato'))
      return []
    }
  }

  /**
   * Mapear datos de la base de datos al tipo TypeScript
   */
  private mapToFormatoTxtBancario(data: unknown): FormatoTxtBancario {
    const dbData = data as Record<string, unknown>
    
    // Validar y parsear formatoTemplate de forma segura
    let formatoTemplate: FormatoTemplateStructure
    try {
      const templateData = dbData.formato_template
      if (typeof templateData === 'string') {
        formatoTemplate = JSON.parse(templateData)
      } else if (templateData && typeof templateData === 'object') {
        formatoTemplate = templateData as FormatoTemplateStructure
      } else {
        formatoTemplate = { estructura: [], separador: ',' }
      }
      
      // Validar que tiene estructura
      if (!formatoTemplate.estructura || !Array.isArray(formatoTemplate.estructura)) {
        formatoTemplate.estructura = []
      }
      
      // Asegurar que tiene separador
      if (!formatoTemplate.separador || typeof formatoTemplate.separador !== 'string') {
        formatoTemplate.separador = (dbData.separador as string) || ','
      }
    } catch (err) {
      console.error('Error parseando formato_template:', handleServiceError(err, 'Error al parsear formato_template'))
      formatoTemplate = { 
        estructura: [], 
        separador: (dbData.separador as string) || ',' 
      }
    }
    
    return {
      id: dbData.id as string,
      nombreBanco: (dbData.nombre_banco as string) || '',
      codigoBanco: dbData.codigo_banco as string | undefined,
      descripcion: dbData.descripcion as string | undefined,
      formatoTemplate: formatoTemplate,
      camposRequeridos: Array.isArray(dbData.campos_requeridos) 
        ? dbData.campos_requeridos as string[]
        : [],
      separador: (dbData.separador as string) || ',',
      extensionArchivo: (dbData.extension_archivo as string) || 'txt',
      activo: Boolean(dbData.activo),
      createdAt: (dbData.created_at as string) || '',
      updatedAt: (dbData.updated_at as string) || ''
    }
  }
}

export const formatosTxtService = new FormatosTxtService()