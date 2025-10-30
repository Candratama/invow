/**
 * Database Types for Supabase
 * Auto-generated type definitions for database tables
 *
 * These types match the schema defined in:
 * supabase/migrations/20250130000000_initial_schema.sql
 */

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
      user_settings: {
        Row: {
          id: string
          user_id: string
          name: string
          logo: string | null
          address: string
          whatsapp: string
          admin_name: string
          admin_title: string | null
          signature: string | null
          store_description: string | null
          tagline: string | null
          store_number: string | null
          payment_method: string | null
          email: string | null
          brand_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          logo?: string | null
          address: string
          whatsapp: string
          admin_name: string
          admin_title?: string | null
          signature?: string | null
          store_description?: string | null
          tagline?: string | null
          store_number?: string | null
          payment_method?: string | null
          email?: string | null
          brand_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          logo?: string | null
          address?: string
          whatsapp?: string
          admin_name?: string
          admin_title?: string | null
          signature?: string | null
          store_description?: string | null
          tagline?: string | null
          store_number?: string | null
          payment_method?: string | null
          email?: string | null
          brand_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_email: string | null
          customer_address: string | null
          customer_status: 'Distributor' | 'Reseller' | 'Customer' | null
          subtotal: number
          shipping_cost: number
          total: number
          note: string | null
          status: 'draft' | 'pending' | 'synced'
          created_at: string
          updated_at: string
          synced_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_email?: string | null
          customer_address?: string | null
          customer_status?: 'Distributor' | 'Reseller' | 'Customer' | null
          subtotal?: number
          shipping_cost?: number
          total?: number
          note?: string | null
          status?: 'draft' | 'pending' | 'synced'
          created_at?: string
          updated_at?: string
          synced_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          invoice_number?: string
          invoice_date?: string
          customer_name?: string
          customer_email?: string | null
          customer_address?: string | null
          customer_status?: 'Distributor' | 'Reseller' | 'Customer' | null
          subtotal?: number
          shipping_cost?: number
          total?: number
          note?: string | null
          status?: 'draft' | 'pending' | 'synced'
          created_at?: string
          updated_at?: string
          synced_at?: string | null
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          price: number
          subtotal: number
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          price: number
          subtotal: number
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          price?: number
          subtotal?: number
          position?: number
          created_at?: string
          updated_at?: string
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
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert']
export type InvoiceItemUpdate = Database['public']['Tables']['invoice_items']['Update']

// Status enums
export type InvoiceStatus = 'draft' | 'pending' | 'synced'
export type CustomerStatus = 'Distributor' | 'Reseller' | 'Customer'
