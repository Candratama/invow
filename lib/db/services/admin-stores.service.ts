/**
 * Admin Stores Service
 * Handles store management queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Store filters interface
 */
export interface StoreFilters {
  userId?: string;
  isActive?: boolean | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Store list item interface
 */
export interface StoreListItem {
  id: string;
  name: string;
  storeCode: string;
  userEmail: string;
  userId: string;
  isActive: boolean;
  invoiceCount: number;
  createdAt: string;
}

/**
 * Store contact interface
 */
export interface StoreContact {
  id: string;
  name: string;
  title: string | null;
  isPrimary: boolean;
}

/**
 * Store stats interface
 */
export interface StoreStats {
  totalInvoices: number;
  thisMonthInvoices: number;
  totalRevenue: number;
}

/**
 * Store detail interface
 */
export interface StoreDetail extends StoreListItem {
  slug: string;
  address: string;
  whatsapp: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo: string | null;
  brandColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  invoicePrefix: string | null;
  invoiceNumberFormat: string | null;
  nextInvoiceNumber: number;
  invoiceNumberPadding: number;
  resetCounterDaily: boolean;
  dailyInvoiceCounter: number | null;
  contacts: StoreContact[];
  stats: StoreStats;
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
 * Apply store filters to array (for client-side/testing use)
 */
export function applyStoreFilters(
  stores: StoreListItem[],
  filters: StoreFilters
): StoreListItem[] {
  let result = [...stores];

  // User filter
  if (filters.userId) {
    result = result.filter((store) => store.userId === filters.userId);
  }

  // Active filter
  if (filters.isActive !== undefined && filters.isActive !== "all") {
    result = result.filter((store) => store.isActive === filters.isActive);
  }

  // Search filter (case-insensitive)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    result = result.filter(
      (store) =>
        store.name.toLowerCase().includes(searchLower) ||
        store.storeCode.toLowerCase().includes(searchLower)
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
 * Get paginated list of stores with filters
 */
export async function getStores(filters: StoreFilters = {}): Promise<{
  data: { stores: StoreListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { userId, isActive, search, page = 1, pageSize = 10 } = filters;

    // Build query - get stores with invoice count
    let query = supabaseAdmin
      .from("stores")
      .select(
        `
        id,
        name,
        store_code,
        user_id,
        is_active,
        created_at,
        invoices(count)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (isActive !== undefined && isActive !== "all") {
      query = query.eq("is_active", isActive);
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,store_code.ilike.%${search}%`
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
      return { data: { stores: [], total: 0 }, error: null };
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

    const stores: StoreListItem[] = data.map((row) => {
      // Extract invoice count from aggregation
      const invoiceAgg = row.invoices as unknown as { count: number }[] | null;
      const invoiceCount = invoiceAgg?.[0]?.count ?? 0;

      return {
        id: row.id,
        name: row.name,
        storeCode: row.store_code,
        userEmail: userEmailMap.get(row.user_id) || "Unknown",
        userId: row.user_id,
        isActive: row.is_active,
        invoiceCount,
        createdAt: row.created_at,
      };
    });

    return { data: { stores, total: count || 0 }, error: null };
  } catch (error) {
    console.error("Error getting stores:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Get store detail by ID
 * Includes store contacts and stats (total invoices, this month, revenue)
 */
export async function getStoreDetail(storeId: string): Promise<{
  data: StoreDetail | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // Get store with contacts
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from("stores")
      .select(
        `
        *,
        store_contacts (
          id,
          name,
          title,
          is_primary
        )
      `
      )
      .eq("id", storeId)
      .single();

    if (storeError) {
      if (storeError.code === "PGRST116") {
        return { data: null, error: new Error("Store not found") };
      }
      throw new Error(storeError.message);
    }

    if (!storeData) {
      return { data: null, error: new Error("Store not found") };
    }

    // Get user email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
      storeData.user_id
    );
    const userEmail = userData?.user?.email || "Unknown";

    // Get store stats - total invoices
    const { count: totalInvoices } = await supabaseAdmin
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId);

    // Get this month invoices
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: thisMonthInvoices } = await supabaseAdmin
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("store_id", storeId)
      .gte("created_at", firstDayOfMonth.toISOString());

    // Get total revenue from invoices
    const { data: revenueData } = await supabaseAdmin
      .from("invoices")
      .select("total")
      .eq("store_id", storeId);

    const totalRevenue =
      revenueData?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    // Map contacts
    const contacts: StoreContact[] = (storeData.store_contacts || []).map(
      (contact: { id: string; name: string; title: string | null; is_primary: boolean }) => ({
        id: contact.id,
        name: contact.name,
        title: contact.title,
        isPrimary: contact.is_primary,
      })
    );

    // Build store detail
    const storeDetail: StoreDetail = {
      id: storeData.id,
      name: storeData.name,
      storeCode: storeData.store_code,
      userEmail,
      userId: storeData.user_id,
      isActive: storeData.is_active,
      invoiceCount: totalInvoices || 0,
      createdAt: storeData.created_at,
      slug: storeData.slug,
      address: storeData.address,
      whatsapp: storeData.whatsapp,
      phone: storeData.phone,
      email: storeData.email,
      website: storeData.website,
      logo: storeData.logo,
      brandColor: storeData.brand_color,
      primaryColor: storeData.primary_color,
      secondaryColor: storeData.secondary_color,
      accentColor: storeData.accent_color,
      invoicePrefix: storeData.invoice_prefix,
      invoiceNumberFormat: storeData.invoice_number_format,
      nextInvoiceNumber: storeData.next_invoice_number,
      invoiceNumberPadding: storeData.invoice_number_padding,
      resetCounterDaily: storeData.reset_counter_daily || false,
      dailyInvoiceCounter: storeData.daily_invoice_counter,
      contacts,
      stats: {
        totalInvoices: totalInvoices || 0,
        thisMonthInvoices: thisMonthInvoices || 0,
        totalRevenue,
      },
    };

    return { data: storeDetail, error: null };
  } catch (error) {
    console.error("Error getting store detail:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Toggle store active status
 */
export async function toggleStoreActive(
  storeId: string,
  isActive: boolean
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("stores")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error toggling store active:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Reset store invoice counter
 * Sets next_invoice_number to 1 and daily_invoice_counter to 1
 */
export async function resetStoreInvoiceCounter(storeId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("stores")
      .update({
        next_invoice_number: 1,
        daily_invoice_counter: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", storeId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error resetting store invoice counter:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
