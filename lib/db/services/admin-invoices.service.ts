/**
 * Admin Invoices Service
 * Handles invoice management queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Invoice filters interface
 */
export interface InvoiceFilters {
  userId?: string;
  storeId?: string;
  status?: "draft" | "pending" | "synced" | "all";
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Invoice list item interface
 */
export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  userEmail: string;
  userId: string;
  storeName: string;
  storeId: string;
  total: number;
  status: "draft" | "pending" | "synced";
  invoiceDate: string;
  createdAt: string;
}

/**
 * Create Supabase admin client with service role key
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}


/**
 * Apply invoice filters to query (for client-side/testing use)
 */
export function applyInvoiceFilters(
  invoices: InvoiceListItem[],
  filters: InvoiceFilters
): InvoiceListItem[] {
  let result = [...invoices];

  // User filter
  if (filters.userId) {
    result = result.filter((inv) => inv.userId === filters.userId);
  }

  // Store filter
  if (filters.storeId) {
    result = result.filter((inv) => inv.storeId === filters.storeId);
  }

  // Status filter
  if (filters.status && filters.status !== "all") {
    result = result.filter((inv) => inv.status === filters.status);
  }

  // Date range filter
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    result = result.filter((inv) => new Date(inv.invoiceDate) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    result = result.filter((inv) => new Date(inv.invoiceDate) <= to);
  }

  // Amount range filter
  if (filters.amountMin !== undefined) {
    result = result.filter((inv) => inv.total >= filters.amountMin!);
  }

  if (filters.amountMax !== undefined) {
    result = result.filter((inv) => inv.total <= filters.amountMax!);
  }

  // Search filter (case-insensitive)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.customerName.toLowerCase().includes(searchLower)
    );
  }

  return result;
}

/**
 * Apply pagination to results (for client-side/testing use)
 */
export function applyPagination<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): { items: T[]; total: number } {
  const total = items.length;
  const offset = (page - 1) * pageSize;
  const paginatedItems = items.slice(offset, offset + pageSize);
  return { items: paginatedItems, total };
}

/**
 * Get paginated list of invoices with filters
 */
/**
 * Invoice item interface
 */
export interface InvoiceItemDetail {
  id: string;
  description: string;
  quantity: number;
  price: number;
  subtotal: number;
  position: number;
}

/**
 * Invoice detail interface (extends list item with full info)
 */
export interface InvoiceDetail extends InvoiceListItem {
  customerEmail: string | null;
  customerAddress: string | null;
  customerStatus: string | null;
  items: InvoiceItemDetail[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  note: string | null;
  updatedAt: string;
  syncedAt: string | null;
}

/**
 * Get invoice detail by ID
 */
export async function getInvoiceDetail(invoiceId: string): Promise<{
  data: InvoiceDetail | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // Get invoice with store info
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        invoice_date,
        customer_name,
        customer_email,
        customer_address,
        customer_status,
        user_id,
        store_id,
        subtotal,
        shipping_cost,
        tax_amount,
        total,
        note,
        status,
        created_at,
        updated_at,
        synced_at,
        stores!inner(name)
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      if (invoiceError.code === "PGRST116") {
        return { data: null, error: new Error("Invoice not found") };
      }
      throw new Error(invoiceError.message);
    }

    // Get invoice items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("invoice_items")
      .select("id, description, quantity, price, subtotal, position")
      .eq("invoice_id", invoiceId)
      .order("position", { ascending: true });

    if (itemsError) {
      throw new Error(itemsError.message);
    }

    // Get user email
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const user = usersData?.users?.find((u) => u.id === invoice.user_id);
    const userEmail = user?.email || "Unknown";

    const store = invoice.stores as unknown as { name: string } | null;

    const invoiceDetail: InvoiceDetail = {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      customerName: invoice.customer_name,
      customerEmail: invoice.customer_email,
      customerAddress: invoice.customer_address,
      customerStatus: invoice.customer_status,
      userEmail,
      userId: invoice.user_id,
      storeName: store?.name || "Unknown",
      storeId: invoice.store_id,
      total: invoice.total,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax_amount,
      shippingCost: invoice.shipping_cost,
      note: invoice.note,
      status: invoice.status as "draft" | "pending" | "synced",
      invoiceDate: invoice.invoice_date,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      syncedAt: invoice.synced_at,
      items: (items || []).map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        position: item.position,
      })),
    };

    return { data: invoiceDetail, error: null };
  } catch (error) {
    console.error("Error getting invoice detail:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export async function getInvoices(filters: InvoiceFilters = {}): Promise<{
  data: { invoices: InvoiceListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const {
      userId,
      storeId,
      status,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      search,
      page = 1,
      pageSize = 10,
    } = filters;

    // Build query
    let query = supabaseAdmin
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        customer_name,
        user_id,
        store_id,
        total,
        status,
        invoice_date,
        created_at,
        stores!inner(name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (dateFrom) {
      query = query.gte("invoice_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("invoice_date", dateTo);
    }

    if (amountMin !== undefined) {
      query = query.gte("total", amountMin);
    }

    if (amountMax !== undefined) {
      query = query.lte("total", amountMax);
    }

    if (search) {
      query = query.or(
        `invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: { invoices: [], total: 0 }, error: null };
    }

    // Get unique user IDs to fetch emails
    const userIds = [...new Set(data.map((row) => row.user_id))];

    // Fetch user emails using admin client
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const userEmailMap = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((user) => {
        if (userIds.includes(user.id)) {
          userEmailMap.set(user.id, user.email || "Unknown");
        }
      });
    }

    const invoices: InvoiceListItem[] = data.map((row) => {
      const store = row.stores as unknown as { name: string } | null;
      return {
        id: row.id,
        invoiceNumber: row.invoice_number,
        customerName: row.customer_name,
        userEmail: userEmailMap.get(row.user_id) || "Unknown",
        userId: row.user_id,
        storeName: store?.name || "Unknown",
        storeId: row.store_id,
        total: row.total,
        status: row.status as "draft" | "pending" | "synced",
        invoiceDate: row.invoice_date,
        createdAt: row.created_at,
      };
    });

    return { data: { invoices, total: count || 0 }, error: null };
  } catch (error) {
    console.error("Error getting invoices:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}


/**
 * Check if invoice was created in current month
 */
function isCurrentMonth(dateString: string): boolean {
  const invoiceDate = new Date(dateString);
  const now = new Date();
  return (
    invoiceDate.getFullYear() === now.getFullYear() &&
    invoiceDate.getMonth() === now.getMonth()
  );
}

/**
 * Delete an invoice and its items
 * Decrements current_month_count if invoice was created in current month
 */
export async function deleteInvoice(invoiceId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // First get the invoice to check user_id and created_at
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from("invoices")
      .select("id, user_id, created_at")
      .eq("id", invoiceId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return { success: false, error: new Error("Invoice not found") };
      }
      throw new Error(fetchError.message);
    }

    const shouldDecrementCounter = isCurrentMonth(invoice.created_at);

    // Delete invoice items first (cascade should handle this, but being explicit)
    const { error: itemsDeleteError } = await supabaseAdmin
      .from("invoice_items")
      .delete()
      .eq("invoice_id", invoiceId);

    if (itemsDeleteError) {
      throw new Error(`Failed to delete invoice items: ${itemsDeleteError.message}`);
    }

    // Delete the invoice
    const { error: invoiceDeleteError } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (invoiceDeleteError) {
      throw new Error(`Failed to delete invoice: ${invoiceDeleteError.message}`);
    }

    // Decrement current_month_count if invoice was created in current month
    if (shouldDecrementCounter) {
      const { data: subscription, error: subFetchError } = await supabaseAdmin
        .from("user_subscriptions")
        .select("id, current_month_count")
        .eq("user_id", invoice.user_id)
        .single();

      if (!subFetchError && subscription) {
        const newCount = Math.max(0, subscription.current_month_count - 1);
        await supabaseAdmin
          .from("user_subscriptions")
          .update({ current_month_count: newCount })
          .eq("id", subscription.id);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: "draft" | "pending" | "synced"
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const updateData: { status: string; synced_at?: string | null } = { status };
    
    // Set synced_at timestamp when status changes to synced
    if (status === "synced") {
      updateData.synced_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId);

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: new Error("Invoice not found") };
      }
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
