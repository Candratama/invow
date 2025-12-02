/**
 * Admin Users Service
 * Handles user management queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * User filters interface
 */
export interface UserFilters {
  tier?: 'free' | 'premium' | 'all';
  status?: 'active' | 'expired' | 'all';
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
  subscriptionStatus: 'active' | 'expired' | 'none';
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
 * Calculate subscription status based on end date
 */
function calculateSubscriptionStatus(endDate: string | null): 'active' | 'expired' | 'none' {
  if (!endDate) return 'active'; // No end date means active (free tier or unlimited)
  const now = new Date();
  const end = new Date(endDate);
  return end > now ? 'active' : 'expired';
}

/**
 * Get paginated list of users with filters
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of users with total count
 */
export async function getUsers(filters: UserFilters = {}): Promise<{
  data: { users: UserListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { tier, status, search, page = 1, pageSize = 10 } = filters;

    // Get all subscriptions first
    let query = supabaseAdmin
      .from("user_subscriptions")
      .select("*");

    // Apply tier filter
    if (tier && tier !== 'all') {
      query = query.eq('tier', tier);
    }

    const { data: subscriptions, error: subscriptionsError } = await query;

    if (subscriptionsError) {
      throw new Error(subscriptionsError.message);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { data: { users: [], total: 0 }, error: null };
    }

    // Get user emails from auth
    const userIds = subscriptions.map((s) => s.user_id);
    const userEmails: Record<string, { email: string; lastLogin: string | null; createdAt: string }> = {};
    
    for (const userId of userIds) {
      try {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (user?.user) {
          userEmails[userId] = {
            email: user.user.email || "Unknown",
            lastLogin: user.user.last_sign_in_at || null,
            createdAt: user.user.created_at,
          };
        }
      } catch {
        // Skip if user not found
      }
    }

    // Get invoice counts per user
    const { data: invoiceCounts, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("user_id");

    if (invoiceError) {
      throw new Error(invoiceError.message);
    }

    const invoiceCountMap: Record<string, number> = {};
    invoiceCounts?.forEach((inv) => {
      invoiceCountMap[inv.user_id] = (invoiceCountMap[inv.user_id] || 0) + 1;
    });

    // Map subscriptions to user list items
    let users: UserListItem[] = subscriptions.map((sub) => ({
      id: sub.user_id,
      email: userEmails[sub.user_id]?.email || "Unknown",
      tier: sub.tier,
      subscriptionStatus: calculateSubscriptionStatus(sub.subscription_end_date),
      invoiceCount: invoiceCountMap[sub.user_id] || 0,
      currentMonthCount: sub.current_month_count,
      invoiceLimit: sub.invoice_limit,
      createdAt: userEmails[sub.user_id]?.createdAt || sub.created_at,
    }));

    // Apply status filter
    if (status && status !== 'all') {
      users = users.filter((u) => u.subscriptionStatus === status);
    }

    // Apply search filter (case-insensitive email search)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      users = users.filter((u) => u.email.toLowerCase().includes(searchLower));
    }

    // Sort by createdAt descending
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate pagination
    const total = users.length;
    const offset = (page - 1) * pageSize;
    const paginatedUsers = users.slice(offset, offset + pageSize);

    return { data: { users: paginatedUsers, total }, error: null };
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
 * 
 * @param userId - The user ID to get details for
 * @returns User detail or null if not found
 */
export async function getUserDetail(userId: string): Promise<{
  data: UserDetail | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // Get user subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (subError || !subscription) {
      return { data: null, error: new Error("User subscription not found") };
    }

    // Get user auth info
    let email = "Unknown";
    let lastLogin: string | null = null;
    let createdAt = subscription.created_at;

    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user) {
        email = authUser.user.email || "Unknown";
        lastLogin = authUser.user.last_sign_in_at || null;
        createdAt = authUser.user.created_at;
      }
    } catch {
      // Continue with defaults if auth lookup fails
    }

    // Get user's stores with invoice counts
    const { data: stores, error: storesError } = await supabaseAdmin
      .from("stores")
      .select("id, name, is_active")
      .eq("user_id", userId);

    if (storesError) {
      throw new Error(storesError.message);
    }

    // Get invoice counts per store
    const storeInfos: StoreInfo[] = [];
    if (stores && stores.length > 0) {
      for (const store of stores) {
        const { count } = await supabaseAdmin
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id);

        storeInfos.push({
          id: store.id,
          name: store.name,
          isActive: store.is_active,
          invoiceCount: count || 0,
        });
      }
    }

    // Get total invoice count for user
    const { count: totalInvoices } = await supabaseAdmin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get user's payment transactions
    const { data: transactions, error: transError } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (transError) {
      throw new Error(transError.message);
    }

    const transactionInfos: TransactionInfo[] = (transactions || []).map((t) => ({
      id: t.id,
      amount: t.amount,
      tier: t.tier,
      status: t.status,
      paymentMethod: t.payment_method,
      createdAt: t.created_at,
      completedAt: t.completed_at,
    }));

    const userDetail: UserDetail = {
      id: userId,
      email,
      tier: subscription.tier,
      subscriptionStatus: calculateSubscriptionStatus(subscription.subscription_end_date),
      invoiceCount: totalInvoices || 0,
      currentMonthCount: subscription.current_month_count,
      invoiceLimit: subscription.invoice_limit,
      createdAt,
      lastLogin,
      subscriptionStartDate: subscription.subscription_start_date,
      subscriptionEndDate: subscription.subscription_end_date,
      stores: storeInfos,
      transactions: transactionInfos,
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
 * Sets tier=premium, invoice_limit=200, subscription_end_date=now+30days
 * 
 * @param userId - The user ID to upgrade
 * @returns Success status
 */
export async function upgradeUser(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Calculate new end date (30 days from now)
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
 * Sets tier=free, invoice_limit=10
 * 
 * @param userId - The user ID to downgrade
 * @returns Success status
 */
export async function downgradeUser(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const now = new Date();

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        tier: "free",
        invoice_limit: 10,
        subscription_end_date: null,
        updated_at: now.toISOString(),
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
 * Adds days to subscription_end_date (or from now if null)
 * 
 * @param userId - The user ID to extend
 * @param days - Number of days to add
 * @returns Success status
 */
export async function extendSubscription(userId: string, days: number): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    if (days <= 0) {
      return { success: false, error: new Error("Days must be a positive number") };
    }

    const supabaseAdmin = createAdminClient();
    
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("subscription_end_date")
      .eq("user_id", userId)
      .single();

    if (fetchError || !subscription) {
      throw new Error("User subscription not found");
    }

    // Calculate new end date
    const now = new Date();
    const baseDate = subscription.subscription_end_date 
      ? new Date(subscription.subscription_end_date)
      : now;
    
    // If the current end date is in the past, start from now
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
 * Sets current_month_count=0 while preserving other fields
 * 
 * @param userId - The user ID to reset counter for
 * @returns Success status
 */
export async function resetInvoiceCounter(userId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    
    const now = new Date();

    const { error } = await supabaseAdmin
      .from("user_subscriptions")
      .update({
        current_month_count: 0,
        updated_at: now.toISOString(),
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
