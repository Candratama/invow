/**
 * Store Contacts Service
 * Handles CRUD operations for store_contacts table
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StoreContact,
  StoreContactInsert,
  StoreContactUpdate,
} from "@/lib/db/database.types";

export class StoreContactsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all contacts for a store
   */
  async getContacts(storeId: string): Promise<{
    data: StoreContact[] | null;
    error: Error | null;
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store) {
        throw new Error("Store not found");
      }

      if (store.user_id !== user.id) {
        throw new Error("Unauthorized: Store does not belong to authenticated user");
      }

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
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store) {
        throw new Error("Store not found");
      }

      if (store.user_id !== user.id) {
        throw new Error("Unauthorized: Store does not belong to authenticated user");
      }

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
   * First contact for a store is automatically set as primary
   */
  async createContact(
    contact: Omit<StoreContactInsert, "id" | "created_at" | "updated_at">,
  ): Promise<{
    data: StoreContact | null;
    error: Error | null;
  }> {
    try {
      // Check if this is the first contact for the store
      const { count } = await this.supabase
        .from("store_contacts")
        .select("*", { count: "exact", head: true })
        .eq("store_id", contact.store_id);

      // First contact should be primary automatically
      const isPrimary = count === 0 || count === null;

      const { data, error } = await this.supabase
        .from("store_contacts")
        .insert({
          ...contact,
          is_primary: isPrimary,
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
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify contact belongs to user's store
      const { data: contact } = await this.supabase
        .from("store_contacts")
        .select("store_id")
        .eq("id", contactId)
        .single();

      if (!contact) {
        throw new Error("Contact not found");
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from("stores")
        .select("user_id")
        .eq("id", contact.store_id)
        .single();

      if (!store || store.user_id !== user.id) {
        throw new Error("Unauthorized: Contact does not belong to authenticated user");
      }

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
   * If deleted contact was primary, the oldest remaining contact becomes primary
   */
  async deleteContact(contactId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify contact belongs to user's store and get its details
      const { data: contact } = await this.supabase
        .from("store_contacts")
        .select("store_id, is_primary")
        .eq("id", contactId)
        .single();

      if (!contact) {
        throw new Error("Contact not found");
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from("stores")
        .select("user_id")
        .eq("id", contact.store_id)
        .single();

      if (!store || store.user_id !== user.id) {
        throw new Error("Unauthorized: Contact does not belong to authenticated user");
      }

      const wasPrimary = contact.is_primary;
      const storeId = contact.store_id;

      const { error } = await this.supabase
        .from("store_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw new Error(error.message);

      // If deleted contact was primary, set the oldest remaining contact as primary
      if (wasPrimary) {
        const { data: remainingContacts } = await this.supabase
          .from("store_contacts")
          .select("id")
          .eq("store_id", storeId)
          .order("created_at", { ascending: true })
          .limit(1);

        if (remainingContacts && remainingContacts.length > 0) {
          await this.supabase
            .from("store_contacts")
            .update({ is_primary: true })
            .eq("id", remainingContacts[0].id);
        }
      }

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
      // Verify user is authenticated
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Verify store belongs to user
      const { data: store } = await this.supabase
        .from("stores")
        .select("user_id")
        .eq("id", storeId)
        .single();

      if (!store) {
        throw new Error("Store not found");
      }

      if (store.user_id !== user.id) {
        throw new Error("Unauthorized: Store does not belong to authenticated user");
      }

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
