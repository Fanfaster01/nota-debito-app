// src/types/database.ts

// Tipos de base de datos
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Aliases para facilitar el uso
export type Company = Tables<'companies'>
export type User = Tables<'users'>
export type FacturaDB = Tables<'facturas'>
export type NotaCreditoDB = Tables<'notas_credito'>
export type NotaDebitoDB = Tables<'notas_debito'>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
        Relationships: []
      }
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
          id: string
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
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "facturas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "notas_credito_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "notas_debito_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_debito_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_debito_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "nota_debito_notas_credito_nota_credito_id_fkey"
            columns: ["nota_credito_id"]
            isOneToOne: false
            referencedRelation: "notas_credito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nota_debito_notas_credito_nota_debito_id_fkey"
            columns: ["nota_debito_id"]
            isOneToOne: false
            referencedRelation: "notas_debito"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}