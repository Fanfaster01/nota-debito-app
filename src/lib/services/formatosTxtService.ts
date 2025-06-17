// Servicio para gestión de formatos TXT bancarios
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()
import type { FormatoTxtBancario, FacturaCuentaPorPagar, ProveedorConBanco } from '@/types/cuentasPorPagar'

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
    } catch (error) {
      console.error('Error obteniendo formatos TXT:', error)
      return { data: null, error: 'Error al obtener los formatos TXT' }
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
    } catch (error) {
      console.error('Error obteniendo formato TXT:', error)
      return { data: null, error: 'Error al obtener el formato TXT' }
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
    } catch (error) {
      console.error('Error creando formato TXT:', error)
      return { data: null, error: 'Error al crear el formato TXT' }
    }
  }

  /**
   * Actualizar formato TXT
   */
  async actualizarFormato(id: string, updates: Partial<FormatoTxtBancario>): Promise<{ data: FormatoTxtBancario | null; error: string | null }> {
    try {
      const updateData: any = {}
      
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
    } catch (error) {
      console.error('Error actualizando formato TXT:', error)
      return { data: null, error: 'Error al actualizar el formato TXT' }
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
      // Obtener formato
      const formatoResult = await this.getFormatoPorId(formatoId)
      if (formatoResult.error || !formatoResult.data) {
        throw new Error(formatoResult.error || 'Formato no encontrado')
      }

      const formato = formatoResult.data
      return this.procesarFormato(formato, facturas, proveedores)
    } catch (error) {
      console.error('Error generando archivo TXT:', error)
      return { data: null, error: 'Error al generar el archivo TXT' }
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
      for (const [proveedorRif, facturasProveedor] of facturasPorProveedor) {
        const proveedor = proveedores.find(p => p.rif === proveedorRif)
        if (!proveedor || !proveedor.bancoFavorito) {
          console.warn(`Proveedor ${proveedorRif} sin datos bancarios, omitiendo...`)
          continue
        }

        const montoTotal = facturasProveedor.reduce((sum, f) => sum + (f.montoFinalPagar || f.total), 0)
        
        // Generar línea según estructura del formato
        const linea = this.generarLineaSegunFormato(
          formato,
          proveedor,
          facturasProveedor,
          montoTotal,
          separador
        )

        if (linea) {
          lineas.push(linea)
        }
      }

      const contenido = lineas.join('\n')
      return { data: contenido, error: null }
    } catch (error) {
      console.error('Error procesando formato:', error)
      return { data: null, error: 'Error al procesar el formato' }
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
      const estructura = formato.formatoTemplate.estructura as string[]
      const campos: string[] = []

      for (const campo of estructura) {
        let valor = ''

        switch (campo.toLowerCase()) {
          case 'numero_cuenta':
            valor = proveedor.bancoFavorito?.numeroCuenta || ''
            break
          case 'tipo_cuenta':
            valor = proveedor.bancoFavorito?.tipoCuenta || 'CORRIENTE'
            break
          case 'monto':
          case 'monto_bs':
            valor = montoTotal.toFixed(2)
            break
          case 'monto_usd':
            valor = facturas.reduce((sum, f) => sum + f.montoUSD, 0).toFixed(2)
            break
          case 'referencia':
            valor = facturas.map(f => f.numero).join(', ')
            break
          case 'descripcion':
            valor = `Pago facturas: ${facturas.map(f => f.numero).join(', ')}`
            break
          case 'rif_beneficiario':
            valor = proveedor.rif
            break
          case 'nombre_beneficiario':
            valor = proveedor.nombre
            break
          case 'banco_codigo':
            valor = proveedor.bancoFavorito?.banco?.codigo || ''
            break
          case 'banco_nombre':
            valor = proveedor.bancoFavorito?.bancoNombre || proveedor.bancoFavorito?.banco?.nombre || ''
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

        campos.push(valor)
      }

      return campos.join(separador)
    } catch (error) {
      console.error('Error generando línea:', error)
      return null
    }
  }

  /**
   * Validar que un formato TXT tiene los campos requeridos
   */
  validarFormato(formato: FormatoTxtBancario): { valido: boolean; errores: string[] } {
    const errores: string[] = []

    if (!formato.nombreBanco.trim()) {
      errores.push('El nombre del banco es requerido')
    }

    if (!formato.formatoTemplate.estructura || formato.formatoTemplate.estructura.length === 0) {
      errores.push('La estructura del formato es requerida')
    }

    if (!formato.camposRequeridos || formato.camposRequeridos.length === 0) {
      errores.push('Los campos requeridos deben estar especificados')
    }

    // Validar que los campos requeridos estén en la estructura
    if (formato.formatoTemplate.estructura && formato.camposRequeridos) {
      const estructura = formato.formatoTemplate.estructura as string[]
      const faltantes = formato.camposRequeridos.filter(
        campo => !estructura.includes(campo)
      )
      
      if (faltantes.length > 0) {
        errores.push(`Campos requeridos faltantes en la estructura: ${faltantes.join(', ')}`)
      }
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
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = `${nombreArchivo}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    window.URL.revokeObjectURL(url)
  }

  /**
   * Mapear datos de la base de datos al tipo TypeScript
   */
  private mapToFormatoTxtBancario(data: any): FormatoTxtBancario {
    return {
      id: data.id,
      nombreBanco: data.nombre_banco,
      codigoBanco: data.codigo_banco,
      descripcion: data.descripcion,
      formatoTemplate: data.formato_template,
      camposRequeridos: data.campos_requeridos,
      separador: data.separador,
      extensionArchivo: data.extension_archivo,
      activo: data.activo,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }
}

export const formatosTxtService = new FormatosTxtService()