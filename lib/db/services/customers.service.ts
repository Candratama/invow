/**
 * Customers Service
 * Handles CRUD operations for customers table
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
} from "@/lib/db/database.types";

export class CustomersService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active customers for a store
   * @param storeId - Store ID to filter customers
   * @returns Array of active customers
   */
  async getCustomers(storeId: string): Promise<{
    data: Customer[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name", { ascending: true });

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
   * Get a single customer by ID
   * @param id - Customer ID
   * @returns Customer or null if not found
   */
  async getCustomer(id: string): Promise<{
    data: Customer | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();


      if (error) {
        // If not found, return null instead of error
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
   * Create a new customer
   * @param data - Customer data to insert
   * @returns Created customer
   */
  async createCustomer(data: CustomerInsert): Promise<{
    data: Customer | null;
    error: Error | null;
  }> {
    try {
      const { data: customer, error } = await this.supabase
        .from("customers")
        .insert(data)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data: customer, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Update an existing customer
   * @param id - Customer ID
   * @param data - Customer data to update
   * @returns Updated customer
   */
  async updateCustomer(
    id: string,
    data: CustomerUpdate
  ): Promise<{
    data: Customer | null;
    error: Error | null;
  }> {
    try {
      const { data: customer, error } = await this.supabase
        .from("customers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      return { data: customer, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }


  /**
   * Soft delete a customer (set is_active to false)
   * @param id - Customer ID
   * @returns Success status
   */
  async deleteCustomer(id: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("customers")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

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
   * Search customers by name (case-insensitive)
   * Only returns active customers (is_active = true)
   * @param storeId - Store ID to filter customers
   * @param query - Search query string
   * @returns Array of matching customers
   */
  async searchCustomers(
    storeId: string,
    query: string
  ): Promise<{
    data: Customer[] | null;
    error: Error | null;
  }> {
    try {
      // Use ilike for case-insensitive search
      const { data, error } = await this.supabase
        .from("customers")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .ilike("name", `%${query}%`)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
