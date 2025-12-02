/**
 * Admin Subscriptions Service
 * Handles subscription management queries for admin panel
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Subscription filters interface
 */
export interface SubscriptionFilters {
  tier?: 'free' | 'premium' | 'all';
  status?: 'active' | 'expired' | 'expiring_soon' | 'all';
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
  status: 'active' | 'expired' | 'expiring_soon';
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
 * Calculate subscription status based on end date
 * - 'active' if end_date is null or > now
 * - 'expiring_soon' if end_date is within 7 days
 * - 'expired' otherwise
 */
export function calculateSubscriptionStatus(endDate: string | null): 'active' | 'expired' | 'expiring_soon' {
  if (!endDate) return 'active'; // No end date means active (free tier or unlimited)
  
  const now = new Date();
  const end = new Date(endDate);
  
  if (end <= now) {
    return 'expired';
  }
  
  // Check if within 7 days
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  if (end <= sevenDaysFromNow) {
    return 'expiring_soon';
  }
  
  return 'active';
}

/**
 * Check if invoice limit is exceeded
 * Returns true if current_month_count > invoice_limit
 */
export function isLimitExceeded(currentMonthCount: number, invoiceLimit: number): boolean {
  return currentMonthCount > invoiceLimit;
}

/**
 * Get paginated list of subscriptions with filters
 * 
 * @param filters - Filter options for the query
 * @returns Paginated list of subscriptions with total count
 */
export async function getSubscriptions(filters: SubscriptionFilters = {}): Promise<{
  data: { subscriptions: SubscriptionListItem[]; total: number } | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { tier, status, page = 1, pageSize = 10 } = filters;

    // Get all subscriptions first
    let query = supabaseAdmin
      .from("user_subscriptions")
      .select("*");

    // Apply tier filter at database level
    if (tier && tier !== 'all') {
      query = query.eq('tier', tier);
    }

    const { data: subscriptions, error: subscriptionsError } = await query;

    if (subscriptionsError) {
      throw new Error(subscriptionsError.message);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { data: { subscriptions: [], total: 0 }, error: null };
    }

    // Get user emails from auth
    const userIds = subscriptions.map((s) => s.user_id);
    const userEmails: Record<string, string> = {};
    
    for (const userId of userIds) {
      try {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (user?.user) {
          userEmails[userId] = user.user.email || "Unknown";
        }
      } catch {
        // Skip if user not found
        userEmails[userId] = "Unknown";
      }
    }

    // Map subscriptions to list items with calculated status
    let subscriptionItems: SubscriptionListItem[] = subscriptions.map((sub) => ({
      id: sub.id,
      userId: sub.user_id,
      userEmail: userEmails[sub.user_id] || "Unknown",
      tier: sub.tier,
      invoiceLimit: sub.invoice_limit,
      currentMonthCount: sub.current_month_count,
      startDate: sub.subscription_start_date,
      endDate: sub.subscription_end_date,
      status: calculateSubscriptionStatus(sub.subscription_end_date),
      limitExceeded: isLimitExceeded(sub.current_month_count, sub.invoice_limit),
    }));

    // Apply status filter
    if (status && status !== 'all') {
      subscriptionItems = subscriptionItems.filter((s) => s.status === status);
    }

    // Sort by start date descending (most recent first)
    subscriptionItems.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    // Calculate pagination
    const total = subscriptionItems.length;
    const offset = (page - 1) * pageSize;
    const paginatedSubscriptions = subscriptionItems.slice(offset, offset + pageSize);

    return { data: { subscriptions: paginatedSubscriptions, total }, error: null };
  } catch (error) {
    console.error("Error getting subscriptions:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
