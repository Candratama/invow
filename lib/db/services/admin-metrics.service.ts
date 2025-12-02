/**
 * Admin Metrics Service
 * Handles dashboard metrics queries for admin panel
 * Uses optimized database functions to avoid N+1 queries
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
 * Uses optimized database function to get all metrics in one query
 */
export async function getDashboardMetrics(): Promise<{
  data: DashboardMetrics | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc(
      "get_admin_dashboard_metrics"
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return {
        data: {
          totalUsers: 0,
          usersByTier: { free: 0, premium: 0 },
          totalRevenue: 0,
          monthlyRevenue: 0,
          activeSubscriptions: 0,
          totalInvoices: 0,
        },
        error: null,
      };
    }

    const row = data[0];
    return {
      data: {
        totalUsers: Number(row.total_users),
        usersByTier: {
          free: Number(row.free_users),
          premium: Number(row.premium_users),
        },
        totalRevenue: Number(row.total_revenue),
        monthlyRevenue: Number(row.monthly_revenue),
        activeSubscriptions: Number(row.active_subscriptions),
        totalInvoices: Number(row.total_invoices),
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
 * Uses optimized database function to avoid N+1 queries
 */
export async function getRecentTransactions(limit: number = 10): Promise<{
  data: TransactionListItem[] | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const { data, error } = await supabaseAdmin.rpc(
      "get_admin_recent_transactions",
      {
        p_limit: limit,
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const transactions: TransactionListItem[] = data.map(
      (row: {
        id: string;
        user_id: string;
        email: string;
        amount: number;
        tier: string;
        status: string;
        payment_method: string | null;
        mayar_invoice_id: string;
        created_at: string;
        completed_at: string | null;
        verified_at: string | null;
      }) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.email || "Unknown",
        amount: row.amount,
        tier: row.tier,
        status: row.status,
        paymentMethod: row.payment_method,
        mayarInvoiceId: row.mayar_invoice_id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        verifiedAt: row.verified_at,
      })
    );

    return { data: transactions, error: null };
  } catch (error) {
    console.error("Error getting recent transactions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
