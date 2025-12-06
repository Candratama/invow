/**
 * Invoices Service
 * Handles CRUD operations for invoices table
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Invoice,
  InvoiceInsert,
  InvoiceUpdate,
  InvoiceItem,
  InvoiceItemInsert,
} from "@/lib/db/database.types";
import { TierService } from "./tier.service";

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}

export interface TierLimitedInvoicesResult {
  invoices: InvoiceWithItems[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMoreHistory: boolean;
  historyLimitMessage?: string;
}

export class InvoicesService {
  constructor(private supabase: SupabaseClient) {}

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
   * Get paginated invoices with items (optimized with JOIN)
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of invoices per page
   * @param status - Optional filter by status
   * @returns Paginated invoices with items and total count
   */
  async getInvoicesPaginated(
    page: number = 1,
    pageSize: number = 10,
    status?: "draft" | "pending" | "synced",
  ): Promise<{
    data: {
      invoices: InvoiceWithItems[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    } | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Build query with items included (single query with JOIN)
      let query = this.supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
          { count: "exact" }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }); // DESC order - newest created first

      if (status) {
        query = query.eq("status", status);
      }

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw new Error(error.message);

      // Sort items by position for each invoice
      const invoices = (data || []).map((invoice) => {
        const typedInvoice = invoice as InvoiceWithItems;
        if (typedInvoice.invoice_items) {
          typedInvoice.invoice_items.sort(
            (a: InvoiceItem, b: InvoiceItem) => a.position - b.position
          );
        }
        return typedInvoice;
      });

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: {
          invoices,
          total,
          page,
          pageSize,
          totalPages,
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get paginated invoices with tier-based history limits
   * - Free users: limited to last 10 transactions (count-based)
   * - Premium users: limited to last 30 days (time-based)
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of invoices per page
   * @param status - Optional filter by status
   * @returns Paginated invoices with tier-based limits and metadata
   */
  async getInvoicesPaginatedWithTierLimit(
    page: number = 1,
    pageSize: number = 10,
    status?: "draft" | "pending" | "synced",
  ): Promise<{
    data: TierLimitedInvoicesResult | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's tier and history limit
      const tierService = new TierService(this.supabase);
      const { data: historyLimit } = await tierService.getHistoryLimit(user.id);

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Build base query with items included
      let query = this.supabase
        .from("invoices")
        .select(
          `
          *,
          invoice_items (*)
        `,
          { count: "exact" }
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }); // DESC order - newest first

      if (status) {
        query = query.eq("status", status);
      }

      // Apply tier-based filtering
      if (historyLimit.type === 'days') {
        // Premium tier: filter by date (last N days)
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - historyLimit.limit);
        query = query.gte("created_at", cutoffDate.toISOString());
      }

      // For count-based limit (free tier), we need to get total first
      // then limit the results
      const { data: allData, error: countError, count: totalCount } = await query;

      if (countError) throw new Error(countError.message);

      let invoicesData = allData || [];
      let hasMoreHistory = false;
      let historyLimitMessage: string | undefined;

      // Apply count-based limit for free tier
      if (historyLimit.type === 'count') {
        // Check if there are more invoices beyond the limit
        const totalInvoicesCount = totalCount || 0;
        if (totalInvoicesCount > historyLimit.limit) {
          hasMoreHistory = true;
          historyLimitMessage = `Showing last ${historyLimit.limit} transactions. Upgrade to Premium for 30 days of history.`;
        }
        // Limit to the configured count
        invoicesData = invoicesData.slice(0, historyLimit.limit);
      }

      // Apply pagination to the filtered results
      const paginatedData = invoicesData.slice(offset, offset + pageSize);

      // Sort items by position for each invoice
      const invoices = paginatedData.map((invoice) => {
        const typedInvoice = invoice as InvoiceWithItems;
        if (typedInvoice.invoice_items) {
          typedInvoice.invoice_items.sort(
            (a: InvoiceItem, b: InvoiceItem) => a.position - b.position
          );
        }
        return typedInvoice;
      });

      const total = historyLimit.type === 'count' 
        ? Math.min(invoicesData.length, historyLimit.limit)
        : invoicesData.length;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: {
          invoices,
          total,
          page,
          pageSize,
          totalPages,
          hasMoreHistory,
          historyLimitMessage,
        },
        error: null,
      };
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
        const { StoresService } = await import("./index");
        const storesService = new StoresService(this.supabase);
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
        const { StoresService } = await import("./index");
        const storesService = new StoresService(this.supabase);
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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          created_at,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          updated_at,
          ...item
        }) => item);

        const { error: itemsError } = await this.supabase
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

  /**
   * Get next invoice sequence number for a specific date and store
   * Returns the count of invoices created on that date + 1
   */
  async getNextInvoiceSequence(storeId: string, invoiceDate: string): Promise<{
    data: number | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Format date for invoice number pattern (DDMMYY)
      const [year, month, day] = invoiceDate.split('-');
      const datePattern = `${day}${month}${year.slice(-2)}`;
      
      // Get max sequence from existing invoice numbers for this store and date
      // Supports both formats:
      // - Old: INV-DDMMYY-XXX
      // - New: INV-DDMMYY-XXXXXXXX-XXX
      const { data: invoices, error } = await this.supabase
        .from("invoices")
        .select("invoice_number")
        .eq("store_id", storeId)
        .like("invoice_number", `INV-${datePattern}-%`);

      if (error) throw new Error(error.message);

      // Extract max sequence number from invoice numbers
      // Only count new format (INV-DDMMYY-XXXXXXXX-XXX) to avoid conflicts with old format
      let maxSequence = 0;
      if (invoices && invoices.length > 0) {
        for (const inv of invoices) {
          // Only match new format: INV-DDMMYY-XXXXXXXX-XXX (8 char user code + 3 digit sequence)
          const match = inv.invoice_number.match(/-[A-Z0-9]{8}-(\d{3})$/);
          if (match) {
            const seq = parseInt(match[1], 10);
            if (seq > maxSequence) {
              maxSequence = seq;
            }
          }
        }
      }

      // Next sequence is max + 1
      const nextSequence = maxSequence + 1;

      // Check if we've exceeded the 3-digit limit (999)
      if (nextSequence > 999) {
        throw new Error(
          "Invoice limit reached for this date (999 invoices). Please use a different date."
        );
      }

      return { data: nextSequence, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
