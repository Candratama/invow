/**
 * Admin Subscriptions Service
 * Handles subscription management queries for admin panel
 * Uses optimized database functions to avoid N+1 queries
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Subscription filters interface
 */
export interface SubscriptionFilters {
  tier?: "free" | "premium" | "all";
  status?: "active" | "expired" | "expiring_soon" | "all";
  page?: number;
  pageSize?: number;
}

/**
 * Subscription list item interface
 */
export interface SubscriptionListItem {
  id: string;
  userId: string;
  userEmail: string;
  tier: string;
  invoiceLimit: number;
  currentMonthCount: number;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "expired" | "expiring_soon";
  limitExceeded: boolean;
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
 * Calculate subscription status based on end date (for client-side use)
 */
export function calculateSubscriptionStatus(
  endDate: string | null
): "active" | "expired" | "expiring_soon" {
  if (!endDate) return "active";

  const now = new Date();
  const end = new Date(endDate);

  if (end <= now) {
    return "expired";
  }

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  if (end <= sevenDaysFromNow) {
    return "expiring_soon";
  }

  return "active";
}

/**
 * Check if invoice limit is exceeded
 */
export function isLimitExceeded(
  currentMonthCount: number,
  invoiceLimit: number
): boolean {
  return currentMonthCount > invoiceLimit;
}

/**
 * Get paginated list of subscriptions with filters
 * Uses optimized database function to avoid N+1 queries
 */
export async function getSubscriptions(
  filters: SubscriptionFilters = {}
): Promise<{
  data: { subscriptions: SubscriptionListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { tier, status, page = 1, pageSize = 10 } = filters;

    const { data, error } = await supabaseAdmin.rpc("get_admin_subscriptions", {
      p_tier: tier || null,
      p_status: status || null,
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: { subscriptions: [], total: 0 }, error: null };
    }

    const subscriptions: SubscriptionListItem[] = data.map(
      (row: {
        id: string;
        user_id: string;
        email: string;
        tier: string;
        invoice_limit: number;
        current_month_count: number;
        subscription_start_date: string | null;
        subscription_end_date: string | null;
        status: string;
        limit_exceeded: boolean;
      }) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.email || "Unknown",
        tier: row.tier,
        invoiceLimit: row.invoice_limit,
        currentMonthCount: row.current_month_count,
        startDate: row.subscription_start_date,
        endDate: row.subscription_end_date,
        status: row.status as "active" | "expired" | "expiring_soon",
        limitExceeded: row.limit_exceeded,
      })
    );

    const total = data[0]?.total_count || 0;

    return { data: { subscriptions, total: Number(total) }, error: null };
  } catch (error) {
    console.error("Error getting subscriptions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
