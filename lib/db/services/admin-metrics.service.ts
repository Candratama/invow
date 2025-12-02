/**
 * Admin Metrics Service
 * Handles dashboard metrics queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  totalUsers: number;
  usersByTier: {
    free: number;
    premium: number;
  };
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  totalInvoices: number;
}

/**
 * Transaction list item for recent transactions
 */
export interface TransactionListItem {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  tier: string;
  status: string;
  paymentMethod: string | null;
  mayarInvoiceId: string;
  createdAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
}

/**
 * Create Supabase admin client with service role key
 * This client bypasses RLS and can access all data
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
 * Get dashboard metrics for admin panel
 * Queries total users, users by tier, revenue, subscriptions, and invoices
 * 
 * @returns Dashboard metrics
 */
export async function getDashboardMetrics(): Promise<{
  data: DashboardMetrics | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // Get all subscriptions to count users and tiers
    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id, tier, subscription_end_date");

    if (subscriptionsError) {
      throw new Error(subscriptionsError.message);
    }

    const totalUsers = subscriptions?.length || 0;
    const freeUsers = subscriptions?.filter((s) => s.tier === "free").length || 0;
    const premiumUsers = subscriptions?.filter((s) => s.tier === "premium").length || 0;

    // Count active subscriptions (end_date is null or > now)
    const now = new Date().toISOString();
    const activeSubscriptions = subscriptions?.filter((s) => {
      if (!s.subscription_end_date) return true; // No end date = active
      return s.subscription_end_date > now;
    }).length || 0;

    // Get total revenue from completed transactions
    const { data: completedTransactions, error: revenueError } = await supabaseAdmin
      .from("payment_transactions")
      .select("amount, created_at")
      .eq("status", "completed");

    if (revenueError) {
      throw new Error(revenueError.message);
    }

    const totalRevenue = completedTransactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

    // Calculate monthly revenue (current month)
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthStartISO = currentMonthStart.toISOString();

    const monthlyRevenue = completedTransactions?.filter((t) => {
      return t.created_at >= currentMonthStartISO;
    }).reduce((sum, t) => sum + t.amount, 0) || 0;

    // Get total invoices count
    const { count: totalInvoices, error: invoicesError } = await supabaseAdmin
      .from("invoices")
      .select("id", { count: "exact", head: true });

    if (invoicesError) {
      throw new Error(invoicesError.message);
    }

    return {
      data: {
        totalUsers,
        usersByTier: {
          free: freeUsers,
          premium: premiumUsers,
        },
        totalRevenue,
        monthlyRevenue,
        activeSubscriptions,
        totalInvoices: totalInvoices || 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting dashboard metrics:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}


/**
 * Get recent payment transactions for admin dashboard
 * Returns transactions ordered by created_at descending
 * 
 * @param limit - Maximum number of transactions to return
 * @returns List of recent transactions with user emails
 */
export async function getRecentTransactions(limit: number = 10): Promise<{
  data: TransactionListItem[] | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    if (!transactions || transactions.length === 0) {
      return { data: [], error: null };
    }

    // Get unique user IDs
    const userIds = [...new Set(transactions.map((t) => t.user_id))];

    // Fetch user emails from auth
    const userEmails: Record<string, string> = {};
    for (const userId of userIds) {
      try {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (user?.user?.email) {
          userEmails[userId] = user.user.email;
        }
      } catch {
        // Skip if user not found
      }
    }

    // Map transactions to list items
    const transactionItems: TransactionListItem[] = transactions.map((t) => ({
      id: t.id,
      userId: t.user_id,
      userEmail: userEmails[t.user_id] || "Unknown",
      amount: t.amount,
      tier: t.tier,
      status: t.status,
      paymentMethod: t.payment_method,
      mayarInvoiceId: t.mayar_invoice_id,
      createdAt: t.created_at,
      completedAt: t.completed_at,
      verifiedAt: t.verified_at,
    }));

    return { data: transactionItems, error: null };
  } catch (error) {
    console.error("Error getting recent transactions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
