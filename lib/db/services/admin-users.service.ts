/**
 * Admin Users Service
 * Handles user management queries for admin panel
 * Uses optimized database functions to avoid N+1 queries
 */

import { createClient } from "@supabase/supabase-js";

/**
 * User filters interface
 */
export interface UserFilters {
  tier?: "free" | "premium" | "all";
  status?: "active" | "expired" | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * User list item interface
 */
export interface UserListItem {
  id: string;
  email: string;
  tier: string;
  subscriptionStatus: "active" | "expired" | "none";
  invoiceCount: number;
  currentMonthCount: number;
  invoiceLimit: number;
  createdAt: string;
}

/**
 * Store info for user detail
 */
export interface StoreInfo {
  id: string;
  name: string;
  isActive: boolean;
  invoiceCount: number;
}

/**
 * Transaction info for user detail
 */
export interface TransactionInfo {
  id: string;
  amount: number;
  tier: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * User detail interface
 */
export interface UserDetail extends UserListItem {
  lastLogin: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  stores: StoreInfo[];
  transactions: TransactionInfo[];
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
 * Get paginated list of users with filters
 * Uses optimized database function to avoid N+1 queries
 */
export async function getUsers(filters: UserFilters = {}): Promise<{
  data: { users: UserListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { tier, status, search, page = 1, pageSize = 10 } = filters;

    const { data, error } = await supabaseAdmin.rpc("get_admin_users", {
      p_tier: tier || null,
      p_status: status || null,
      p_search: search || null,
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: { users: [], total: 0 }, error: null };
    }

    const users: UserListItem[] = data.map(
      (row: {
        user_id: string;
        email: string;
        tier: string;
        subscription_status: string;
        invoice_count: number;
        current_month_count: number;
        invoice_limit: number;
        created_at: string;
      }) => ({
        id: row.user_id,
        email: row.email || "Unknown",
        tier: row.tier,
        subscriptionStatus: row.subscription_status as
          | "active"
          | "expired"
          | "none",
        invoiceCount: Number(row.invoice_count),
        currentMonthCount: row.current_month_count,
        invoiceLimit: row.invoice_limit,
        createdAt: row.created_at,
      })
    );

    const total = data[0]?.total_count || 0;

    return { data: { users, total: Number(total) }, error: null };
  } catch (error) {
    console.error("Error getting users:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Get detailed information about a specific user
 * Uses optimized database function to get all data in one query
 */
export async function getUserDetail(userId: string): Promise<{
  data: UserDetail | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc("get_admin_user_detail", {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: null, error: new Error("User not found") };
    }

    const row = data[0];
    const userDetail: UserDetail = {
      id: row.user_id,
      email: row.email || "Unknown",
      tier: row.tier,
      subscriptionStatus: row.subscription_status as
        | "active"
        | "expired"
        | "none",
      invoiceCount: Number(row.invoice_count),
      currentMonthCount: row.current_month_count,
      invoiceLimit: row.invoice_limit,
      createdAt: row.created_at,
      lastLogin: row.last_sign_in_at,
      subscriptionStartDate: row.subscription_start_date,
      subscriptionEndDate: row.subscription_end_date,
      stores: (row.stores || []).map(
        (s: { id: string; name: string; isActive: boolean; invoiceCount: number }) => ({
          id: s.id,
          name: s.name,
          isActive: s.isActive,
          invoiceCount: Number(s.invoiceCount),
        })
      ),
      transactions: (row.transactions || []).map(
        (t: {
          id: string;
          amount: number;
          tier: string;
          status: string;
          paymentMethod: string | null;
          createdAt: string;
          completedAt: string | null;
        }) => ({
          id: t.id,
          amount: t.amount,
          tier: t.tier,
          status: t.status,
          paymentMethod: t.paymentMethod,
          createdAt: t.createdAt,
          completedAt: t.completedAt,
        })
      ),
    };

    return { data: userDetail, error: null };
  } catch (error) {
    console.error("Error getting user detail:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Upgrade user to premium tier
 */
export async function upgradeUser(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        tier: "premium",
        invoice_limit: 200,
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error upgrading user:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Downgrade user to free tier
 */
export async function downgradeUser(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        tier: "free",
        invoice_limit: 10,
        subscription_end_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error downgrading user:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Extend user subscription by specified days
 */
export async function extendSubscription(
  userId: string,
  days: number
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    if (days <= 0) {
      return {
        success: false,
        error: new Error("Days must be a positive number"),
      };
    }

    const supabaseAdmin = createAdminClient();

    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_end_date")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      throw new Error("User subscription not found");
    }

    const now = new Date();
    const baseDate = subscription.subscription_end_date
      ? new Date(subscription.subscription_end_date)
      : now;

    const startDate = baseDate > now ? baseDate : now;
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + days);

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        subscription_end_date: newEndDate.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error extending subscription:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Reset user's invoice counter to zero
 */
export async function resetInvoiceCounter(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        current_month_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error resetting invoice counter:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
