/**
 * Store Contacts Service
 * Handles CRUD operations for store_contacts table
 */

import { createClient } from "@/lib/supabase/client";
import type {
  StoreContact,
  StoreContactInsert,
  StoreContactUpdate,
} from "@/lib/db/database.types";

export class StoreContactsService {
  private supabase = createClient();

  /**
   * Get all contacts for a store
   */
  async getContacts(storeId: string): Promise<{
    data: StoreContact[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("store_contacts")
        .select("*")
        .eq("store_id", storeId)
        .order("is_primary", { ascending: false })
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
   * Get primary contact for a store
   */
  async getPrimaryContact(storeId: string): Promise<{
    data: StoreContact | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("store_contacts")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_primary", true)
        .single();

      if (error) {
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
   * Create a new contact
   */
  async createContact(
    contact: Omit<StoreContactInsert, "id" | "created_at" | "updated_at">,
  ): Promise<{
    data: StoreContact | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("store_contacts")
        .insert(contact)
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
   * Update an existing contact
   */
  async updateContact(
    contactId: string,
    updates: StoreContactUpdate,
  ): Promise<{
    data: StoreContact | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("store_contacts")
        .update(updates)
        .eq("id", contactId)
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
   * Delete a contact
   */
  async deleteContact(contactId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const { error } = await this.supabase
        .from("store_contacts")
        .delete()
        .eq("id", contactId);

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
   * Set a contact as primary (and unset others)
   */
  async setPrimaryContact(
    storeId: string,
    contactId: string,
  ): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // The trigger will automatically unset other primary contacts
      const { error } = await this.supabase
        .from("store_contacts")
        .update({ is_primary: true })
        .eq("id", contactId)
        .eq("store_id", storeId);

      if (error) throw new Error(error.message);

      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

// Export singleton instance
export const storeContactsService = new StoreContactsService();
