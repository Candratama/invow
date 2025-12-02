/**
 * Admin Transactions Service
 * Handles payment transaction management queries for admin panel
 * Uses optimized database functions to avoid N+1 queries
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Transaction filters interface
 */
export interface TransactionFilters {
  status?: "pending" | "completed" | "failed" | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Transaction list item interface
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
  mayarTransactionId: string | null;
  createdAt: string;
  completedAt: string | null;
  verifiedAt: string | null;
  isStale: boolean;
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
 * Calculate if a transaction is stale (for client-side use)
 */
export function isTransactionStale(status: string, createdAt: string): boolean {
  if (status !== "pending") return false;

  const now = new Date();
  const created = new Date(createdAt);
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

  return hoursDiff > 24;
}

/**
 * Check if a date is within a date range (for client-side use)
 */
export function isWithinDateRange(
  date: string,
  dateFrom?: string,
  dateTo?: string
): boolean {
  const checkDate = new Date(date);

  if (dateFrom) {
    const from = new Date(dateFrom);
    from.setHours(0, 0, 0, 0);
    if (checkDate < from) return false;
  }

  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    if (checkDate > to) return false;
  }

  return true;
}

/**
 * Get paginated list of transactions with filters
 * Uses optimized database function to avoid N+1 queries
 */
export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<{
  data: { transactions: TransactionListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { status, dateFrom, dateTo, page = 1, pageSize = 10 } = filters;

    const { data, error } = await supabaseAdmin.rpc("get_admin_transactions", {
      p_status: status || null,
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_page: page,
      p_page_size: pageSize,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { data: { transactions: [], total: 0 }, error: null };
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
        mayar_transaction_id: string | null;
        created_at: string;
        completed_at: string | null;
        verified_at: string | null;
        is_stale: boolean;
      }) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.email || "Unknown",
        amount: row.amount,
        tier: row.tier,
        status: row.status,
        paymentMethod: row.payment_method,
        mayarInvoiceId: row.mayar_invoice_id,
        mayarTransactionId: row.mayar_transaction_id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        verifiedAt: row.verified_at,
        isStale: row.is_stale,
      })
    );

    const total = data[0]?.total_count || 0;

    return { data: { transactions, total: Number(total) }, error: null };
  } catch (error) {
    console.error("Error getting transactions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Verify a transaction by setting verified_at timestamp
 */
export async function verifyTransaction(transactionId: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();

    const now = new Date();

    const { error } = await supabaseAdmin
      .from("payment_transactions")
      .update({
        verified_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", transactionId);

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
