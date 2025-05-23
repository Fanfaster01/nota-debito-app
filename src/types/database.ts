// src/types/database.ts
export interface Database {
    public: {
      Tables: {
        users: {
          Row: {
            id: string
            email: string
            full_name: string | null
            role: 'master' | 'admin' | 'user'
            company_id: string | null
            permissions: string[] | null
            created_at: string
            updated_at: string
            is_active: boolean
          }
          Insert: {
            id?: string
            email: string
            full_name?: string | null
            role?: 'master' | 'admin' | 'user'
            company_id?: string | null
            permissions?: string[] | null
            created_at?: string
            updated_at?: string
            is_active?: boolean
          }
          Update: {
            id?: string
            email?: string
            full_name?: string | null
            role?: 'master' | 'admin' | 'user'
            company_id?: string | null
            permissions?: string[] | null
            created_at?: string
            updated_at?: string
            is_active?: boolean
          }
        }
        companies: {
          Row: {
            id: string
            name: string
            rif: string
            address: string
            phone: string | null
            email: string | null
            created_at: string
            updated_at: string
            is_active: boolean
          }
          Insert: {
            id?: string
            name: string
            rif: string
            address: string
            phone?: string | null
            email?: string | null
            created_at?: string
            updated_at?: string
            is_active?: boolean
          }
          Update: {
            id?: string
            name?: string
            rif?: string
            address?: string
            phone?: string | null
            email?: string | null
            created_at?: string
            updated_at?: string
            is_active?: boolean
          }
        }
        facturas: {
          Row: {
            id: string
            numero: string
            numero_control: string
            fecha: string
            proveedor_nombre: string
            proveedor_rif: string
            proveedor_direccion: string
            cliente_nombre: string
            cliente_rif: string
            cliente_direccion: string
            sub_total: number
            monto_exento: number
            base_imponible: number
            alicuota_iva: number
            iva: number
            total: number
            tasa_cambio: number
            monto_usd: number
            porcentaje_retencion: number
            retencion_iva: number
            company_id: string
            created_by: string
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            numero: string
            numero_control: string
            fecha: string
            proveedor_nombre: string
            proveedor_rif: string
            proveedor_direccion: string
            cliente_nombre: string
            cliente_rif: string
            cliente_direccion: string
            sub_total: number
            monto_exento: number
            base_imponible: number
            alicuota_iva: number
            iva: number
            total: number
            tasa_cambio: number
            monto_usd: number
            porcentaje_retencion: number
            retencion_iva: number
            company_id: string
            created_by: string
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            numero?: string
            numero_control?: string
            fecha?: string
            proveedor_nombre?: string
            proveedor_rif?: string
            proveedor_direccion?: string
            cliente_nombre?: string
            cliente_rif?: string
            cliente_direccion?: string
            sub_total?: number
            monto_exento?: number
            base_imponible?: number
            alicuota_iva?: number
            iva?: number
            total?: number
            tasa_cambio?: number
            monto_usd?: number
            porcentaje_retencion?: number
            retencion_iva?: number
            company_id?: string
            created_by?: string
            created_at?: string
            updated_at?: string
          }
        }
        notas_credito: {
          Row: {
            id: string
            numero: string
            numero_control: string
            fecha: string
            factura_afectada: string
            sub_total: number
            monto_exento: number
            base_imponible: number
            alicuota_iva: number
            iva: number
            total: number
            tasa_cambio: number
            monto_usd: number
            porcentaje_retencion: number
            retencion_iva: number
            factura_id: string
            company_id: string
            created_by: string
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            numero: string
            numero_control: string
            fecha: string
            factura_afectada: string
            sub_total: number
            monto_exento: number
            base_imponible: number
            alicuota_iva: number
            iva: number
            total: number
            tasa_cambio: number
            monto_usd: number
            porcentaje_retencion: number
            retencion_iva: number
            factura_id: string
            company_id: string
            created_by: string
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            numero?: string
            numero_control?: string
            fecha?: string
            factura_afectada?: string
            sub_total?: number
            monto_exento?: number
            base_imponible?: number
            alicuota_iva?: number
            iva?: number
            total?: number
            tasa_cambio?: number
            monto_usd?: number
            porcentaje_retencion?: number
            retencion_iva?: number
            factura_id?: string
            company_id?: string
            created_by?: string
            created_at?: string
            updated_at?: string
          }
        }
        notas_debito: {
          Row: {
            id: string
            numero: string
            fecha: string
            factura_id: string
            tasa_cambio_original: number
            tasa_cambio_pago: number
            monto_usd_neto: number
            diferencial_cambiario_con_iva: number
            base_imponible_diferencial: number
            iva_diferencial: number
            retencion_iva_diferencial: number
            monto_neto_pagar_nota_debito: number
            monto_final_pagar: number
            company_id: string
            created_by: string
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            numero: string
            fecha: string
            factura_id: string
            tasa_cambio_original: number
            tasa_cambio_pago: number
            monto_usd_neto: number
            diferencial_cambiario_con_iva: number
            base_imponible_diferencial: number
            iva_diferencial: number
            retencion_iva_diferencial: number
            monto_neto_pagar_nota_debito: number
            monto_final_pagar: number
            company_id: string
            created_by: string
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            numero?: string
            fecha?: string
            factura_id?: string
            tasa_cambio_original?: number
            tasa_cambio_pago?: number
            monto_usd_neto?: number
            diferencial_cambiario_con_iva?: number
            base_imponible_diferencial?: number
            iva_diferencial?: number
            retencion_iva_diferencial?: number
            monto_neto_pagar_nota_debito?: number
            monto_final_pagar?: number
            company_id?: string
            created_by?: string
            created_at?: string
            updated_at?: string
          }
        }
        nota_debito_notas_credito: {
          Row: {
            id: string
            nota_debito_id: string
            nota_credito_id: string
            created_at: string
          }
          Insert: {
            id?: string
            nota_debito_id: string
            nota_credito_id: string
            created_at?: string
          }
          Update: {
            id?: string
            nota_debito_id?: string
            nota_credito_id?: string
            created_at?: string
          }
        }
      }
      Views: {
        [_ in never]: never
      }
      Functions: {
        [_ in never]: never
      }
      Enums: {
        user_role: 'master' | 'admin' | 'user'
      }
    }
  }