/**
 * Stores Service
 * Handles CRUD operations for stores table
 */

import { createClient } from "@/lib/supabase/client";

export interface StoreInsert {
  name: string;
  slug: string;
  is_active?: boolean;
  logo?: string | null;
  address: string;
  whatsapp: string;
  admin_name?: string | null;
  admin_title?: string | null;
  admin_signature?: string | null;
  store_description?: string | null;
  tagline?: string | null;
  store_number?: string | null;
  payment_method?: string | null;
  email?: string | null;
  brand_color?: string;
  invoice_prefix?: string | null;
  store_code?: string;
  phone?: string | null;
  website?: string | null;
  invoice_number_format?: string | null;
  reset_counter_daily?: boolean;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  is_active: boolean;
  logo: string | null;
  address: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  admin_name: string | null;
  admin_title: string | null;
  admin_signature: string | null;
  store_description: string | null;
  tagline: string | null;
  store_number: string | null;
  payment_method: string | null;
  brand_color: string;
  invoice_prefix: string;
  invoice_number_format: string | null;
  reset_counter_daily: boolean;
  store_code: string;
  next_invoice_number: number;
  invoice_number_padding: number;
  daily_invoice_date: string | null;
  daily_invoice_counter: number | null;
  created_at: string;
  updated_at: string;
}

export class StoresService {
  private supabase = createClient();

  /**
   * Get all stores for the authenticated user
   */
  async getStores(): Promise<{
    data: Store[] | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get default store for the authenticated user
   * Priority: 1) User's default_store_id from preferences, 2) First active store
   */
  async getDefaultStore(): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Try to get user's preferred default store
      const { data: preferences } = await this.supabase
        .from("user_preferences")
        .select("default_store_id")
        .eq("user_id", user.id)
        .single();

      if (preferences?.default_store_id) {
        const { data: defaultStore } = await this.supabase
          .from("stores")
          .select("*")
          .eq("id", preferences.default_store_id)
          .eq("is_active", true)
          .single();

        if (defaultStore) {
          return { data: defaultStore, error: null };
        }
      }

      // Fallback: Get first active store
      const { data, error } = await this.supabase
        .from("stores")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (error) {
        // If no store found, return null
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        throw new Error(error.message);
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get default store with complete details (including admin info)
   * This is a unified API method that replaces the N+1 query pattern.
   * Since admin fields are now denormalized in the stores table,
   * this method provides complete store data in a single query.
   *
   * @returns Complete store data including admin information
   */
  async getDefaultStoreWithDetails(): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    // Since admin fields are denormalized, this is now equivalent to getDefaultStore()
    // But we keep this method for semantic clarity and future extensibility
    return this.getDefaultStore();
  }

  /**
   * Get store by ID
   */
  async getStore(storeId: string): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Create a new store
   */
  async createStore(
    store: StoreInsert,
  ): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await this.supabase
        .from("stores")
        .insert({
          ...store,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update an existing store
   */
  async updateStore(
    storeId: string,
    updates: Partial<StoreInsert>,
  ): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("stores")
        .update(updates)
        .eq("id", storeId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Soft delete a store (set is_active to false)
   */
  async deleteStore(storeId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("stores")
        .update({ is_active: false })
        .eq("id", storeId);

      if (error) throw new Error(error.message);

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Create default store from StoreSettings
   * Used during migration from old user_settings to new stores
   * Now includes admin fields directly in the store (denormalized)
   */
  async createDefaultStoreFromSettings(settings: {
    name: string;
    logo?: string | null;
    address: string;
    whatsapp: string;
    adminName?: string;
    adminTitle?: string | null;
    signature?: string | null;
    storeDescription?: string | null;
    tagline?: string | null;
    storeNumber?: string | null;
    paymentMethod?: string | null;
    email?: string | null;
    brandColor?: string;
  }): Promise<{
    data: Store | null;
    error: Error | null;
  }> {
    try {
      // Generate store code from name (first 3-6 uppercase letters)
      const storeCode = settings.name
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase()
        .substring(0, 6)
        .padEnd(2, "S");

      // Generate slug from name
      const slug =
        settings.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "store";

      return await this.createStore({
        name: settings.name,
        slug: slug,
        logo: settings.logo || null,
        address: settings.address,
        whatsapp: settings.whatsapp,
        phone: null,
        website: null,
        admin_name: settings.adminName || null,
        admin_title: settings.adminTitle || null,
        admin_signature: settings.signature || null,
        store_description: settings.storeDescription || null,
        tagline: settings.tagline || null,
        store_number: settings.storeNumber || null,
        payment_method: settings.paymentMethod || null,
        email: settings.email || null,
        brand_color: settings.brandColor || "#10b981",
        is_active: true,
        invoice_prefix: "INV",
        invoice_number_format: null,
        reset_counter_daily: false,
        store_code: storeCode,
      });
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

// Export singleton instance
export const storesService = new StoresService();
