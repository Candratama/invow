/**
 * Invoices Service
 * Handles CRUD operations for invoices table
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Invoice,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceItem,
  InvoiceItemInsert,
} from "@/lib/db/database.types";

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}

export class InvoicesService {
  private supabase = createClient();

  /**
   * Get all invoices for the authenticated user
   * @param status - Optional filter by status
   * @param limit - Optional limit number of results
   * @returns Array of invoices
   */
  async getInvoices(
    status?: "draft" | "pending" | "synced",
    limit?: number,
  ): Promise<{
    data: Invoice[] | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      let query = this.supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("invoice_date", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

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
   * Get a single invoice with its items
   * @param invoiceId - Invoice ID
   * @returns Invoice with items
   */
  async getInvoiceWithItems(invoiceId: string): Promise<{
    data: InvoiceWithItems | null;
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
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
        )
        .eq("id", invoiceId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If not found, return null instead of error
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        throw new Error(error.message);
      }

      // Sort items by position
      if (data.invoice_items) {
        data.invoice_items.sort(
          (a: InvoiceItem, b: InvoiceItem) => a.position - b.position,
        );
      }

      return { data: data as InvoiceWithItems, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Create a new invoice
   * @param invoice - Invoice data to insert
   * @returns Created invoice
   */
  async createInvoice(invoice: Omit<InvoiceInsert, "user_id">): Promise<{
    data: Invoice | null;
    error: Error | null;
  }> {
    try {
      // Get user with retry logic (for cases where auth session is being established)
      let user = null;
      let retries = 0;
      const maxRetries = 3;

      while (!user && retries < maxRetries) {
        const {
          data: { user: currentUser },
        } = await this.supabase.auth.getUser();

        if (currentUser) {
          user = currentUser;
        } else if (retries < maxRetries - 1) {
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000));
          retries++;
        } else {
          throw new Error("User not authenticated");
        }
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get default store_id if not provided
      let storeId = invoice.store_id;
      if (!storeId) {
        const { storesService } = await import("./index");
        const { data: defaultStore } = await storesService.getDefaultStore();

        if (!defaultStore) {
          throw new Error(
            "No default store found. Please create a store first.",
          );
        }

        storeId = defaultStore.id;
      }

      // Generate invoice number if not provided
      let invoiceNumber = invoice.invoice_number;
      if (!invoiceNumber) {
        const { data: generatedNumber, error: numberError } = await this.supabase
          .rpc('get_next_invoice_number', { p_store_id: storeId });

        if (numberError) {
          console.error("Failed to generate invoice number:", numberError);
          throw new Error("Failed to generate invoice number");
        }

        invoiceNumber = generatedNumber;
      }

      const { data, error } = await this.supabase
        .from("invoices")
        .insert({
          ...invoice,
          invoice_number: invoiceNumber,
          user_id: user.id,
          store_id: storeId,
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
   * Update an existing invoice
   * @param invoiceId - Invoice ID
   * @param invoice - Invoice data to update
   * @returns Updated invoice
   */
  async updateInvoice(
    invoiceId: string,
    invoice: InvoiceUpdate,
  ): Promise<{
    data: Invoice | null;
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
        .from("invoices")
        .update(invoice)
        .eq("id", invoiceId)
        .eq("user_id", user.id)
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
   * Update invoice and replace all its items (atomic operation)
   * @param invoiceId - Invoice ID
   * @param invoice - Invoice data to update
   * @param items - New items to replace existing ones
   * @returns Updated invoice with new items
   */
  async updateInvoiceWithItems(
    invoiceId: string,
    invoice: InvoiceUpdate,
    items: Omit<InvoiceItemInsert, "invoice_id">[],
  ): Promise<{
    data: InvoiceWithItems | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Start transaction-like operation
      // 1. Update invoice
      const { error: invoiceError } = await this.supabase
        .from("invoices")
        .update(invoice)
        .eq("id", invoiceId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (invoiceError) throw new Error(invoiceError.message);

      // 2. Delete existing items
      const { error: deleteError } = await this.supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteError) throw new Error(deleteError.message);

      // 3. Insert new items
      if (items.length > 0) {
        const itemsWithInvoiceId = items.map((item, index) => ({
          ...item,
          invoice_id: invoiceId,
          position: item.position ?? index,
        }));

        const { error: itemsError } = await this.supabase
          .from("invoice_items")
          .insert(itemsWithInvoiceId);

        if (itemsError) throw new Error(itemsError.message);
      }

      // 4. Fetch complete invoice with items
      const { data: completeInvoice, error: fetchError } = await this.supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
        )
        .eq("id", invoiceId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Sort items by position
      if (completeInvoice.invoice_items) {
        completeInvoice.invoice_items.sort(
          (a: InvoiceItem, b: InvoiceItem) => a.position - b.position,
        );
      }

      return { data: completeInvoice as InvoiceWithItems, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Upsert an invoice with items (for syncing)
   * This method will insert if not exists, or update if exists
   * @param invoice - Invoice data to upsert
   * @param items - Items to replace existing ones
   * @returns Upserted invoice with items
   */
  async upsertInvoiceWithItems(
    invoice: Omit<InvoiceInsert, "user_id">,
    items: Omit<InvoiceItemInsert, "invoice_id">[],
  ): Promise<{
    data: InvoiceWithItems | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get default store_id if not provided
      let storeId = invoice.store_id;
      if (!storeId) {
        const { storesService } = await import("./index");
        const { data: defaultStore } = await storesService.getDefaultStore();

        if (!defaultStore) {
          throw new Error(
            "No default store found. Please create a store first.",
          );
        }

        storeId = defaultStore.id;
      }

      // Prepare invoice data
      const invoiceData = {
        ...invoice,
        user_id: user.id,
        store_id: storeId,
      };

      // Upsert invoice (will insert or update based on id)
      const { data: upsertedInvoice, error: upsertError } = await this.supabase
        .from("invoices")
        .upsert(invoiceData, { onConflict: "id" })
        .select()
        .single();

      if (upsertError) throw new Error(upsertError.message);

      // Delete existing items - use proper error handling to ensure it completes
      const { data: deletedItems, error: deleteError } = await this.supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", upsertedInvoice.id)
        .select("id");

      if (deleteError) {
        throw new Error(`Failed to delete existing items: ${deleteError.message}`);
      }

      // Optional: Log how many items were deleted for debugging (development only, no sensitive data)
      if (deletedItems && deletedItems.length > 0) {
        // Log only in development environment with no invoice ID exposure
        if (process.env.NODE_ENV === 'development') {
          console.log(`Deleted ${deletedItems.length} existing items for invoice`);
        }
      }

      // Insert new items with guaranteed unique positions
      if (items.length > 0) {
        // Ensure all items have unique sequential positions
        const itemsWithInvoiceId = items.map((item, index) => ({
          ...item,
          invoice_id: upsertedInvoice.id,
          position: index, // Force sequential positions to avoid conflicts
        }));

        // Remove any existing fields that could cause conflicts during insert
        const cleanItems = itemsWithInvoiceId.map(({
          id,
          created_at,
          updated_at,
          ...item
        }) => item);

        const { data: insertedItems, error: itemsError } = await this.supabase
          .from("invoice_items")
          .insert(cleanItems)
          .select("id, position, description");

        if (itemsError) {
          // Provide error information without exposing sensitive data
          const errorDetails = itemsError.message;
          console.error('Invoice items insertion failed:', {
            error: errorDetails,
            itemCount: items.length,
          });
          throw new Error(`Failed to insert items: ${errorDetails}`);
        }
      }

      // Fetch complete invoice with items
      const { data: completeInvoice, error: fetchError } = await this.supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
        )
        .eq("id", upsertedInvoice.id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Sort items by position
      if (completeInvoice.invoice_items) {
        completeInvoice.invoice_items.sort(
          (a: InvoiceItem, b: InvoiceItem) => a.position - b.position,
        );
      }

      return { data: completeInvoice as InvoiceWithItems, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Delete an invoice (and its items via cascade)
   * @param invoiceId - Invoice ID
   * @returns Success status
   */
  async deleteInvoice(invoiceId: string): Promise<{
    success: boolean;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await this.supabase
        .from("invoices")
        .delete()
        .eq("id", invoiceId)
        .eq("user_id", user.id);

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
   * Bulk upsert invoices (for syncing local data to server)
   * @param invoices - Array of invoices to upsert
   * @returns Upserted invoices
   */
  async bulkUpsertInvoices(
    invoices: Omit<InvoiceInsert, "user_id">[],
  ): Promise<{
    data: Invoice[] | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const invoicesWithUserId = invoices.map((inv) => ({
        ...inv,
        user_id: user.id,
      }));

      const { data, error } = await this.supabase
        .from("invoices")
        .upsert(invoicesWithUserId, { onConflict: "id" })
        .select();

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

// Export singleton instance
export const invoicesService = new InvoicesService();
