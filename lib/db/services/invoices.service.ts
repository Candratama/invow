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

        // Handle duplicate key constraint violation gracefully
        // This can happen if multiple sync operations occur simultaneously
        if (itemsError) {
          if (itemsError.code === "23505") {
            // 23505 = unique_violation in PostgreSQL
            console.warn("⚠️ Duplicate invoice items detected, skipping insert (likely race condition)");
          } else {
            throw new Error(itemsError.message);
          }
        }
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

      // Delete existing items
      const { error: deleteError } = await this.supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", upsertedInvoice.id);

      if (deleteError) throw new Error(deleteError.message);

      // Insert new items
      if (items.length > 0) {
        const itemsWithInvoiceId = items.map((item, index) => ({
          ...item,
          invoice_id: upsertedInvoice.id,
          position: item.position ?? index,
        }));

        const { error: itemsError } = await this.supabase
          .from("invoice_items")
          .insert(itemsWithInvoiceId);

        // Handle duplicate key constraint violation gracefully
        // This can happen if multiple sync operations occur simultaneously
        if (itemsError) {
          if (itemsError.code === "23505") {
            // 23505 = unique_violation in PostgreSQL
            console.warn("⚠️ Duplicate invoice items detected, skipping insert (likely race condition)");
          } else {
            throw new Error(itemsError.message);
          }
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

  /**
   * Get total revenue from all synced invoices
   * @returns Total revenue amount and invoice count
   */
  async getTotalRevenue(): Promise<{
    total: number;
    count: number;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetch all synced invoices (only total field for efficiency)
      const { data, error } = await this.supabase
        .from("invoices")
        .select("total")
        .eq("user_id", user.id)
        .eq("status", "synced");

      if (error) throw new Error(error.message);

      // Calculate total revenue
      const total = data?.reduce((sum, invoice) => sum + Number(invoice.total), 0) ?? 0;
      const count = data?.length ?? 0;

      return { total, count, error: null };
    } catch (error) {
      console.error("Error calculating total revenue:", error);
      return {
        total: 0,
        count: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get revenue statistics including monthly and total
   * @returns Revenue statistics
   */
  async getRevenueStats(): Promise<{
    monthlyRevenue: number;
    totalRevenue: number;
    count: number;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch all synced invoices with date
      const { data, error } = await this.supabase
        .from("invoices")
        .select("total, invoice_date")
        .eq("user_id", user.id)
        .eq("status", "synced");

      if (error) throw new Error(error.message);

      // Calculate totals
      let monthlyRevenue = 0;
      let totalRevenue = 0;

      data?.forEach((invoice) => {
        const invoiceTotal = Number(invoice.total);
        const invoiceDate = new Date(invoice.invoice_date);

        // Add to total
        totalRevenue += invoiceTotal;

        // Add to monthly if in current month
        if (invoiceDate >= startOfMonth) {
          monthlyRevenue += invoiceTotal;
        }
      });

      const count = data?.length ?? 0;

      return { monthlyRevenue, totalRevenue, count, error: null };
    } catch (error) {
      console.error("Error calculating revenue stats:", error);
      return {
        monthlyRevenue: 0,
        totalRevenue: 0,
        count: 0,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}

// Export singleton instance
export const invoicesService = new InvoicesService();
