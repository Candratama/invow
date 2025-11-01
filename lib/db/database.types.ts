/**
 * Database Types for Supabase
 * Auto-generated type definitions for database tables
 *
 * Generated from Supabase schema
 * Last updated: 2025-10-31
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
      user_preferences: {
        Row: {
          id: string
          user_id: string
          preferred_language: string
          timezone: string
          date_format: string
          currency: string
          default_store_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_language?: string
          timezone?: string
          date_format?: string
          currency?: string
          default_store_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          preferred_language?: string
          timezone?: string
          date_format?: string
          currency?: string
          default_store_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          user_id: string
          name: string
          slug: string
          is_active: boolean
          logo: string | null
          address: string
          whatsapp: string
          phone: string | null
          email: string | null
          website: string | null
          store_description: string | null
          tagline: string | null
          store_number: string | null
          payment_method: string | null
          brand_color: string
          invoice_prefix: string | null
          store_code: string
          invoice_number_format: string | null
          next_invoice_number: number
          invoice_number_padding: number
          daily_invoice_date: string | null
          daily_invoice_counter: number | null
          reset_counter_daily: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          slug: string
          is_active?: boolean
          logo?: string | null
          address: string
          whatsapp: string
          phone?: string | null
          email?: string | null
          website?: string | null
          store_description?: string | null
          tagline?: string | null
          store_number?: string | null
          payment_method?: string | null
          brand_color?: string
          invoice_prefix?: string | null
          store_code: string
          invoice_number_format?: string | null
          next_invoice_number?: number
          invoice_number_padding?: number
          daily_invoice_date?: string | null
          daily_invoice_counter?: number | null
          reset_counter_daily?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          slug?: string
          is_active?: boolean
          logo?: string | null
          address?: string
          whatsapp?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          store_description?: string | null
          tagline?: string | null
          store_number?: string | null
          payment_method?: string | null
          brand_color?: string
          invoice_prefix?: string | null
          store_code?: string
          invoice_number_format?: string | null
          next_invoice_number?: number
          invoice_number_padding?: number
          daily_invoice_date?: string | null
          daily_invoice_counter?: number | null
          reset_counter_daily?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      store_contacts: {
        Row: {
          id: string
          store_id: string
          name: string
          title: string | null
          signature: string | null
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          title?: string | null
          signature?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          title?: string | null
          signature?: string | null
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          store_id: string
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_email: string | null
          customer_address: string | null
          customer_status: string | null
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
          store_id: string
          invoice_number: string
          invoice_date: string
          customer_name: string
          customer_email?: string | null
          customer_address?: string | null
          customer_status?: string | null
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
          store_id?: string
          invoice_number?: string
          invoice_date?: string
          customer_name?: string
          customer_email?: string | null
          customer_address?: string | null
          customer_status?: string | null
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
      user_settings_deprecated: {
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
    }
  }
}

// Type helpers for convenience
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

export type Store = Database['public']['Tables']['stores']['Row']
export type StoreInsert = Database['public']['Tables']['stores']['Insert']
export type StoreUpdate = Database['public']['Tables']['stores']['Update']

export type StoreContact = Database['public']['Tables']['store_contacts']['Row']
export type StoreContactInsert = Database['public']['Tables']['store_contacts']['Insert']
export type StoreContactUpdate = Database['public']['Tables']['store_contacts']['Update']

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert']
export type InvoiceItemUpdate = Database['public']['Tables']['invoice_items']['Update']

export type UserSettings = Database['public']['Tables']['user_settings_deprecated']['Row']
export type UserSettingsInsert = Database['public']['Tables']['user_settings_deprecated']['Insert']
export type UserSettingsUpdate = Database['public']['Tables']['user_settings_deprecated']['Update']
