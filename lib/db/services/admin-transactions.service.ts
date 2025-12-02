/**
 * Admin Transactions Service
 * Handles payment transaction management queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Transaction filters interface
 */
export interface TransactionFilters {
  status?: 'pending' | 'completed' | 'failed' | 'all';
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
 * Calculate if a transaction is stale
 * A transaction is stale if status='pending' AND created_at > 24 hours ago
 * 
 * @param status - Transaction status
 * @param createdAt - Transaction creation timestamp
 * @returns true if transaction is stale
 */
export function isTransactionStale(status: string, createdAt: string): boolean {
  if (status !== 'pending') return false;
  
  const now = new Date();
  const created = new Date(createdAt);
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff > 24;
}

/**
 * Check if a date is within a date range (inclusive)
 * 
 * @param date - Date to check
 * @param dateFrom - Start of range (optional)
 * @param dateTo - End of range (optional)
 * @returns true if date is within range
 */
export function isWithinDateRange(date: string, dateFrom?: string, dateTo?: string): boolean {
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
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of transactions with total count
 */
export async function getTransactions(filters: TransactionFilters = {}): Promise<{
  data: { transactions: TransactionListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { status, dateFrom, dateTo, page = 1, pageSize = 10 } = filters;

    // Get all transactions
    let query = supabaseAdmin
      .from("payment_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply status filter at database level
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      throw new Error(transactionsError.message);
    }

    if (!transactions || transactions.length === 0) {
      return { data: { transactions: [], total: 0 }, error: null };
    }

    // Get user emails from auth
    const userIds = [...new Set(transactions.map((t) => t.user_id))];
    const userEmails: Record<string, string> = {};
    
    for (const userId of userIds) {
      try {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (user?.user) {
          userEmails[userId] = user.user.email || "Unknown";
        }
      } catch {
        userEmails[userId] = "Unknown";
      }
    }

    // Map transactions to list items with calculated stale flag
    let transactionItems: TransactionListItem[] = transactions.map((t) => ({
      id: t.id,
      userId: t.user_id,
      userEmail: userEmails[t.user_id] || "Unknown",
      amount: t.amount,
      tier: t.tier,
      status: t.status,
      paymentMethod: t.payment_method,
      mayarInvoiceId: t.mayar_invoice_id,
      mayarTransactionId: t.mayar_transaction_id,
      createdAt: t.created_at,
      completedAt: t.completed_at,
      verifiedAt: t.verified_at,
      isStale: isTransactionStale(t.status, t.created_at),
    }));

    // Apply date range filter
    if (dateFrom || dateTo) {
      transactionItems = transactionItems.filter((t) => 
        isWithinDateRange(t.createdAt, dateFrom, dateTo)
      );
    }

    // Calculate pagination
    const total = transactionItems.length;
    const offset = (page - 1) * pageSize;
    const paginatedTransactions = transactionItems.slice(offset, offset + pageSize);

    return { data: { transactions: paginatedTransactions, total }, error: null };
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
 * Only updates verified_at while preserving other fields
 * 
 * @param transactionId - The transaction ID to verify
 * @returns Success status
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
