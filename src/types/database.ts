// src/types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never