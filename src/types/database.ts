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
export type Proveedor = Tables<'proveedores'>
export type Banco = Tables<'bancos'>
export type Caja = Tables<'cajas'>
export type PagoMovil = Tables<'pagos_movil'>
export type PagoZelle = Tables<'pagos_zelle'>
export type NotaCreditoCaja = Tables<'notas_credito_caja'>
export type CreditoCaja = Tables<'creditos_caja'>

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
      proveedores: {
        Row: {
          id: string
          nombre: string
          rif: string
          direccion: string
          telefono: string | null
          email: string | null
          contacto: string | null
          porcentaje_retencion: number
          numero_cuenta: string | null
          banco_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          nombre: string
          rif: string
          direccion: string
          telefono?: string | null
          email?: string | null
          contacto?: string | null
          porcentaje_retencion?: number
          numero_cuenta?: string | null
          banco_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          rif?: string
          direccion?: string
          telefono?: string | null
          email?: string | null
          contacto?: string | null
          porcentaje_retencion?: number
          numero_cuenta?: string | null
          banco_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proveedores_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bancos: {
        Row: {
          id: string
          nombre: string
          codigo: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          nombre: string
          codigo: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          nombre?: string
          codigo?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      cajas: {
        Row: {
          id: string
          user_id: string
          company_id: string
          fecha: string
          hora_apertura: string
          hora_cierre: string | null
          monto_apertura: number
          monto_apertura_usd: number
          monto_cierre: number | null
          tasa_dia: number
          total_pagos_movil: number
          cantidad_pagos_movil: number
          total_zelle_usd: number
          total_zelle_bs: number
          cantidad_zelle: number
          total_notas_credito: number
          cantidad_notas_credito: number
          total_creditos_bs: number
          total_creditos_usd: number
          cantidad_creditos: number
          estado: 'abierta' | 'cerrada'
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          fecha: string
          hora_apertura: string
          hora_cierre?: string | null
          monto_apertura?: number
          monto_apertura_usd?: number
          monto_cierre?: number | null
          tasa_dia?: number
          total_pagos_movil?: number
          cantidad_pagos_movil?: number
          total_zelle_usd?: number
          total_zelle_bs?: number
          cantidad_zelle?: number
          total_notas_credito?: number
          cantidad_notas_credito?: number
          total_creditos_bs?: number
          total_creditos_usd?: number
          cantidad_creditos?: number
          estado?: 'abierta' | 'cerrada'
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          fecha?: string
          hora_apertura?: string
          hora_cierre?: string | null
          monto_apertura?: number
          monto_apertura_usd?: number
          monto_cierre?: number | null
          tasa_dia?: number
          total_pagos_movil?: number
          cantidad_pagos_movil?: number
          total_zelle_usd?: number
          total_zelle_bs?: number
          cantidad_zelle?: number
          total_notas_credito?: number
          cantidad_notas_credito?: number
          total_creditos_bs?: number
          total_creditos_usd?: number
          cantidad_creditos?: number
          estado?: 'abierta' | 'cerrada'
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cajas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cajas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      pagos_movil: {
        Row: {
          id: string
          caja_id: string
          monto: number
          fecha_hora: string
          nombre_cliente: string
          telefono: string
          numero_referencia: string
          user_id: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caja_id: string
          monto: number
          fecha_hora?: string
          nombre_cliente: string
          telefono: string
          numero_referencia: string
          user_id: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caja_id?: string
          monto?: number
          fecha_hora?: string
          nombre_cliente?: string
          telefono?: string
          numero_referencia?: string
          user_id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_movil_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_movil_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_movil_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      pagos_zelle: {
        Row: {
          id: string
          caja_id: string
          monto_usd: number
          tasa: number
          monto_bs: number
          fecha_hora: string
          nombre_cliente: string
          telefono: string
          user_id: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caja_id: string
          monto_usd: number
          tasa: number
          monto_bs: number
          fecha_hora?: string
          nombre_cliente: string
          telefono: string
          user_id: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caja_id?: string
          monto_usd?: number
          tasa?: number
          monto_bs?: number
          fecha_hora?: string
          nombre_cliente?: string
          telefono?: string
          user_id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_zelle_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_zelle_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_zelle_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      notas_credito_caja: {
        Row: {
          id: string
          caja_id: string
          numero_nota_credito: string
          factura_afectada: string
          monto_bs: number
          nombre_cliente: string
          explicacion: string
          fecha_hora: string
          user_id: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caja_id: string
          numero_nota_credito: string
          factura_afectada: string
          monto_bs: number
          nombre_cliente: string
          explicacion: string
          fecha_hora?: string
          user_id: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caja_id?: string
          numero_nota_credito?: string
          factura_afectada?: string
          monto_bs?: number
          nombre_cliente?: string
          explicacion?: string
          fecha_hora?: string
          user_id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_credito_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_caja_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_caja_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      creditos_caja: {
        Row: {
          id: string
          caja_id: string
          numero_factura: string
          nombre_cliente: string
          telefono_cliente: string
          monto_bs: number
          monto_usd: number
          tasa: number
          estado: 'pendiente' | 'pagado'
          fecha_hora: string
          user_id: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          caja_id: string
          numero_factura: string
          nombre_cliente: string
          telefono_cliente: string
          monto_bs: number
          monto_usd: number
          tasa: number
          estado?: 'pendiente' | 'pagado'
          fecha_hora?: string
          user_id: string
          company_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          caja_id?: string
          numero_factura?: string
          nombre_cliente?: string
          telefono_cliente?: string
          monto_bs?: number
          monto_usd?: number
          tasa?: number
          estado?: 'pendiente' | 'pagado'
          fecha_hora?: string
          user_id?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creditos_caja_caja_id_fkey"
            columns: ["caja_id"]
            isOneToOne: false
            referencedRelation: "cajas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_caja_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creditos_caja_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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