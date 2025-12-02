/**
 * Admin Analytics Service
 * Handles analytics queries for admin panel
 * Provides revenue, user growth, and invoice analytics
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Date range interface for analytics queries
 */
export interface AnalyticsDateRange {
  from: string;
  to: string;
}

/**
 * Daily data point for charts
 */
export interface DailyDataPoint {
  date: string;
  value: number;
}

/**
 * Revenue by tier breakdown
 */
export interface RevenueByTier {
  tier: string;
  amount: number;
}

/**
 * Revenue analytics interface
 */
export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;
  previousPeriodRevenue: number;
  percentageChange: number;
  dailyRevenue: DailyDataPoint[];
  revenueByTier: RevenueByTier[];
}

/**
 * Transaction record for analytics
 */
export interface TransactionRecord {
  id: string;
  amount: number;
  tier: string;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
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
 * Check if a date is within a date range (inclusive)
 */
export function isWithinDateRange(
  date: string,
  dateFrom: string,
  dateTo: string
): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const from = new Date(dateFrom);
  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return checkDate >= from && checkDate <= to;
}

/**
 * Calculate total revenue from completed transactions
 */
export function calculateTotalRevenue(
  transactions: TransactionRecord[]
): number {
  return transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Calculate average transaction value from completed transactions
 */
export function calculateAverageTransactionValue(
  transactions: TransactionRecord[]
): number {
  const completed = transactions.filter((t) => t.status === "completed");
  if (completed.length === 0) return 0;
  const total = completed.reduce((sum, t) => sum + t.amount, 0);
  return Math.round(total / completed.length);
}

/**
 * Aggregate daily revenue from transactions
 */
export function aggregateDailyRevenue(
  transactions: TransactionRecord[],
  dateFrom: string,
  dateTo: string
): DailyDataPoint[] {
  const completed = transactions.filter((t) => t.status === "completed");
  
  // Create a map of date -> total amount
  const dailyMap = new Map<string, number>();
  
  // Initialize all dates in range with 0
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, 0);
  }
  
  // Sum amounts by date
  for (const t of completed) {
    const dateStr = new Date(t.createdAt).toISOString().split("T")[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + t.amount);
    }
  }
  
  // Convert to array sorted by date
  return Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

/**
 * Calculate revenue breakdown by tier
 */
export function calculateRevenueByTier(
  transactions: TransactionRecord[]
): RevenueByTier[] {
  const completed = transactions.filter((t) => t.status === "completed");
  
  const tierMap = new Map<string, number>();
  
  for (const t of completed) {
    const tier = t.tier || "unknown";
    tierMap.set(tier, (tierMap.get(tier) || 0) + t.amount);
  }
  
  return Array.from(tierMap.entries())
    .map(([tier, amount]) => ({ tier, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

/**
 * Get previous period date range based on current range
 */
export function getPreviousPeriodRange(
  dateFrom: string,
  dateTo: string
): AnalyticsDateRange {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const periodLength = to.getTime() - from.getTime();
  
  const prevTo = new Date(from.getTime() - 1); // Day before current from
  const prevFrom = new Date(prevTo.getTime() - periodLength);
  
  return {
    from: prevFrom.toISOString().split("T")[0],
    to: prevTo.toISOString().split("T")[0],
  };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: TransactionRecord[],
  dateFrom: string,
  dateTo: string
): TransactionRecord[] {
  return transactions.filter((t) =>
    isWithinDateRange(t.createdAt, dateFrom, dateTo)
  );
}

/**
 * Get revenue analytics for a date range
 */
export async function getRevenueAnalytics(
  dateRange: AnalyticsDateRange
): Promise<{
  data: RevenueAnalytics | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get current period transactions
    const { data: currentData, error: currentError } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, amount, tier, status, payment_method, created_at, completed_at")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`);

    if (currentError) {
      throw new Error(currentError.message);
    }

    const currentTransactions: TransactionRecord[] = (currentData || []).map(
      (row) => ({
        id: row.id,
        amount: row.amount,
        tier: row.tier,
        status: row.status,
        paymentMethod: row.payment_method,
        createdAt: row.created_at,
        completedAt: row.completed_at,
      })
    );

    // Get previous period transactions for comparison
    const prevRange = getPreviousPeriodRange(from, to);
    const { data: prevData, error: prevError } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, amount, tier, status, created_at")
      .eq("status", "completed")
      .gte("created_at", `${prevRange.from}T00:00:00`)
      .lte("created_at", `${prevRange.to}T23:59:59`);

    if (prevError) {
      throw new Error(prevError.message);
    }

    const prevTransactions: TransactionRecord[] = (prevData || []).map(
      (row) => ({
        id: row.id,
        amount: row.amount,
        tier: row.tier,
        status: row.status,
        paymentMethod: null,
        createdAt: row.created_at,
        completedAt: null,
      })
    );

    // Calculate current month revenue (current calendar month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const { data: monthlyData, error: monthlyError } = await supabaseAdmin
      .from("payment_transactions")
      .select("amount")
      .eq("status", "completed")
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    if (monthlyError) {
      throw new Error(monthlyError.message);
    }

    const monthlyRevenue = (monthlyData || []).reduce(
      (sum, row) => sum + row.amount,
      0
    );

    // Calculate analytics
    const totalRevenue = calculateTotalRevenue(currentTransactions);
    const averageTransactionValue = calculateAverageTransactionValue(
      currentTransactions
    );
    const dailyRevenue = aggregateDailyRevenue(currentTransactions, from, to);
    const revenueByTier = calculateRevenueByTier(currentTransactions);
    const previousPeriodRevenue = calculateTotalRevenue(prevTransactions);
    const percentageChange = calculatePercentageChange(
      totalRevenue,
      previousPeriodRevenue
    );

    return {
      data: {
        totalRevenue,
        monthlyRevenue,
        averageTransactionValue,
        previousPeriodRevenue,
        percentageChange,
        dailyRevenue,
        revenueByTier,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting revenue analytics:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}


/**
 * CSV row for revenue export
 */
export interface RevenueCSVRow {
  date: string;
  amount: number;
  tier: string;
  paymentMethod: string;
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string | number | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert transactions to CSV rows
 */
export function transactionsToCSVRows(
  transactions: TransactionRecord[]
): RevenueCSVRow[] {
  return transactions
    .filter((t) => t.status === "completed")
    .map((t) => ({
      date: new Date(t.createdAt).toISOString().split("T")[0],
      amount: t.amount,
      tier: t.tier,
      paymentMethod: t.paymentMethod || "unknown",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate CSV string from revenue data
 */
export function generateRevenueCSV(rows: RevenueCSVRow[]): string {
  const headers = ["date", "amount", "tier", "payment_method"];
  const headerLine = headers.join(",");

  const dataLines = rows.map((row) =>
    [
      escapeCSVField(row.date),
      escapeCSVField(row.amount),
      escapeCSVField(row.tier),
      escapeCSVField(row.paymentMethod),
    ].join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

/**
 * Export revenue data as CSV for a date range
 */
export async function exportRevenueCSV(
  dateRange: AnalyticsDateRange
): Promise<{
  data: string | null;
  rowCount: number;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get completed transactions in date range
    const { data, error } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, amount, tier, status, payment_method, created_at, completed_at")
      .eq("status", "completed")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const transactions: TransactionRecord[] = (data || []).map((row) => ({
      id: row.id,
      amount: row.amount,
      tier: row.tier,
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));

    const csvRows = transactionsToCSVRows(transactions);
    const csv = generateRevenueCSV(csvRows);

    return {
      data: csv,
      rowCount: csvRows.length,
      error: null,
    };
  } catch (error) {
    console.error("Error exporting revenue CSV:", error);
    return {
      data: null,
      rowCount: 0,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// ============================================
// USER ANALYTICS
// ============================================

/**
 * User record from auth.users
 */
export interface UserRecord {
  id: string;
  email: string;
  createdAt: string;
}

/**
 * User subscription record
 */
export interface UserSubscriptionRecord {
  userId: string;
  tier: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
}

/**
 * User by tier breakdown
 */
export interface UsersByTier {
  tier: string;
  count: number;
}

/**
 * User analytics interface
 */
export interface UserAnalytics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  conversionRate: number;
  churnRate: number;
  dailyRegistrations: DailyDataPoint[];
  usersByTier: UsersByTier[];
}

/**
 * Calculate user distribution by tier
 * Returns count of users per tier
 */
export function calculateUsersByTier(
  subscriptions: UserSubscriptionRecord[],
  totalUsers: number
): UsersByTier[] {
  // Count users by tier from subscriptions
  const tierMap = new Map<string, number>();
  
  for (const sub of subscriptions) {
    const tier = sub.tier || "free";
    tierMap.set(tier, (tierMap.get(tier) || 0) + 1);
  }
  
  // Users without subscription are "free"
  const subscribedUsers = subscriptions.length;
  const freeUsers = totalUsers - subscribedUsers;
  
  if (freeUsers > 0) {
    tierMap.set("free", (tierMap.get("free") || 0) + freeUsers);
  }
  
  return Array.from(tierMap.entries())
    .map(([tier, count]) => ({ tier, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate conversion rate
 * Percentage of free users who upgraded to premium in the period
 */
export function calculateConversionRate(
  premiumUpgrades: number,
  totalFreeUsers: number
): number {
  if (totalFreeUsers === 0) {
    return 0;
  }
  return Math.round((premiumUpgrades / totalFreeUsers) * 100 * 100) / 100;
}

/**
 * Calculate churn rate
 * Percentage of premium users who did not renew their subscription
 */
export function calculateChurnRate(
  expiredPremiumUsers: number,
  totalPremiumUsers: number
): number {
  if (totalPremiumUsers === 0) {
    return 0;
  }
  return Math.round((expiredPremiumUsers / totalPremiumUsers) * 100 * 100) / 100;
}

/**
 * Aggregate daily registrations from users
 */
export function aggregateDailyRegistrations(
  users: UserRecord[],
  dateFrom: string,
  dateTo: string
): DailyDataPoint[] {
  // Create a map of date -> count
  const dailyMap = new Map<string, number>();
  
  // Initialize all dates in range with 0
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, 0);
  }
  
  // Count registrations by date
  for (const user of users) {
    const dateStr = new Date(user.createdAt).toISOString().split("T")[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    }
  }
  
  // Convert to array sorted by date
  return Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

/**
 * Filter users by date range
 */
export function filterUsersByDateRange(
  users: UserRecord[],
  dateFrom: string,
  dateTo: string
): UserRecord[] {
  return users.filter((u) =>
    isWithinDateRange(u.createdAt, dateFrom, dateTo)
  );
}

/**
 * Get user analytics for a date range
 */
export async function getUserAnalytics(
  dateRange: AnalyticsDateRange
): Promise<{
  data: UserAnalytics | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get all users from auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 10000,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const allUsers: UserRecord[] = (authData?.users || []).map((user) => ({
      id: user.id,
      email: user.email || "",
      createdAt: user.created_at,
    }));

    // Filter users registered in date range for daily registrations
    const usersInRange = filterUsersByDateRange(allUsers, from, to);

    // Get current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthStartStr = monthStart.toISOString().split("T")[0];
    const monthEndStr = monthEnd.toISOString().split("T")[0];

    // Count new users this month
    const newUsersThisMonth = allUsers.filter((u) =>
      isWithinDateRange(u.createdAt, monthStartStr, monthEndStr)
    ).length;

    // Get all subscriptions
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id, tier, subscription_start_date, subscription_end_date");

    if (subError) {
      throw new Error(subError.message);
    }

    const subscriptions: UserSubscriptionRecord[] = (subscriptionData || []).map((row) => ({
      userId: row.user_id,
      tier: row.tier,
      subscriptionStartDate: row.subscription_start_date,
      subscriptionEndDate: row.subscription_end_date,
    }));

    // Calculate active users (users with active premium subscription)
    const activeSubscriptions = subscriptions.filter((s) => {
      if (s.tier === "free") return false;
      if (!s.subscriptionEndDate) return true;
      return new Date(s.subscriptionEndDate) >= now;
    });
    const activeUsers = activeSubscriptions.length;

    // Calculate user distribution by tier
    const usersByTier = calculateUsersByTier(subscriptions, allUsers.length);

    // Calculate conversion rate
    // Count users who upgraded to premium in the period
    const premiumUpgrades = subscriptions.filter((s) => {
      if (s.tier === "free") return false;
      return isWithinDateRange(s.subscriptionStartDate, from, to);
    }).length;

    // Count free users (users without premium subscription)
    const totalFreeUsers = allUsers.length - activeSubscriptions.length;
    const conversionRate = calculateConversionRate(premiumUpgrades, totalFreeUsers);

    // Calculate churn rate
    // Count premium users whose subscription expired in the period
    const expiredPremiumUsers = subscriptions.filter((s) => {
      if (s.tier === "free") return false;
      if (!s.subscriptionEndDate) return false;
      return isWithinDateRange(s.subscriptionEndDate, from, to);
    }).length;

    // Total premium users (current + expired)
    const totalPremiumUsers = subscriptions.filter((s) => s.tier !== "free").length;
    const churnRate = calculateChurnRate(expiredPremiumUsers, totalPremiumUsers);

    // Calculate daily registrations
    const dailyRegistrations = aggregateDailyRegistrations(usersInRange, from, to);

    return {
      data: {
        totalUsers: allUsers.length,
        newUsersThisMonth,
        activeUsers,
        conversionRate,
        churnRate,
        dailyRegistrations,
        usersByTier,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting user analytics:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// ============================================
// USER GROWTH CSV EXPORT
// ============================================

/**
 * CSV row for user growth export
 */
export interface UserGrowthCSVRow {
  date: string;
  newUsers: number;
  tier: string;
}

/**
 * Convert user data to CSV rows
 */
export function usersToCSVRows(
  users: UserRecord[],
  subscriptions: UserSubscriptionRecord[]
): UserGrowthCSVRow[] {
  // Create a map of userId -> tier
  const userTierMap = new Map<string, string>();
  for (const sub of subscriptions) {
    userTierMap.set(sub.userId, sub.tier);
  }

  return users
    .map((u) => ({
      date: new Date(u.createdAt).toISOString().split("T")[0],
      newUsers: 1,
      tier: userTierMap.get(u.id) || "free",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate CSV string from user growth data
 */
export function generateUserGrowthCSV(rows: UserGrowthCSVRow[]): string {
  const headers = ["date", "new_users", "tier"];
  const headerLine = headers.join(",");

  const dataLines = rows.map((row) =>
    [
      escapeCSVFieldInternal(row.date),
      escapeCSVFieldInternal(row.newUsers),
      escapeCSVFieldInternal(row.tier),
    ].join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

/**
 * Internal CSV field escaper (to avoid duplicate function)
 */
function escapeCSVFieldInternal(value: string | number | null): string {
  if (value === null || value === undefined) {
    return "";
  }
  const stringValue = String(value);
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Export user growth data as CSV for a date range
 */
export async function exportUserGrowthCSV(
  dateRange: AnalyticsDateRange
): Promise<{
  data: string | null;
  rowCount: number;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get all users from auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 10000,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const allUsers: UserRecord[] = (authData?.users || []).map((user) => ({
      id: user.id,
      email: user.email || "",
      createdAt: user.created_at,
    }));

    // Filter users in date range
    const usersInRange = filterUsersByDateRange(allUsers, from, to);

    // Get subscriptions for these users
    const userIds = usersInRange.map((u) => u.id);
    const { data: subscriptionData, error: subError } = await supabaseAdmin
      .from("user_subscriptions")
      .select("user_id, tier, subscription_start_date, subscription_end_date")
      .in("user_id", userIds.length > 0 ? userIds : ["no-match"]);

    if (subError) {
      throw new Error(subError.message);
    }

    const subscriptions: UserSubscriptionRecord[] = (subscriptionData || []).map((row) => ({
      userId: row.user_id,
      tier: row.tier,
      subscriptionStartDate: row.subscription_start_date,
      subscriptionEndDate: row.subscription_end_date,
    }));

    const csvRows = usersToCSVRows(usersInRange, subscriptions);
    const csv = generateUserGrowthCSV(csvRows);

    return {
      data: csv,
      rowCount: csvRows.length,
      error: null,
    };
  } catch (error) {
    console.error("Error exporting user growth CSV:", error);
    return {
      data: null,
      rowCount: 0,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// ============================================
// INVOICE ANALYTICS
// ============================================

/**
 * Invoice record for analytics
 */
export interface InvoiceRecord {
  id: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: "draft" | "pending" | "synced";
  createdAt: string;
}

/**
 * Invoice by status breakdown
 */
export interface InvoicesByStatus {
  status: string;
  count: number;
}

/**
 * Top user by invoice count
 */
export interface TopUserByInvoiceCount {
  userEmail: string;
  count: number;
}

/**
 * Invoice analytics interface
 */
export interface InvoiceAnalytics {
  totalInvoices: number;
  invoicesThisMonth: number;
  averageInvoicesPerUser: number;
  averageInvoiceValue: number;
  totalInvoiceValue: number;
  dailyInvoices: DailyDataPoint[];
  invoicesByStatus: InvoicesByStatus[];
  topUsersByInvoiceCount: TopUserByInvoiceCount[];
}

/**
 * Calculate invoice distribution by status
 * Returns count of invoices per status
 */
export function calculateInvoicesByStatus(
  invoices: InvoiceRecord[]
): InvoicesByStatus[] {
  const statusMap = new Map<string, number>();

  for (const invoice of invoices) {
    const status = invoice.status || "unknown";
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  }

  return Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregate daily invoice count
 */
export function aggregateDailyInvoices(
  invoices: InvoiceRecord[],
  dateFrom: string,
  dateTo: string
): DailyDataPoint[] {
  // Create a map of date -> count
  const dailyMap = new Map<string, number>();

  // Initialize all dates in range with 0
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    dailyMap.set(dateStr, 0);
  }

  // Count invoices by date
  for (const invoice of invoices) {
    const dateStr = new Date(invoice.createdAt).toISOString().split("T")[0];
    if (dailyMap.has(dateStr)) {
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    }
  }

  // Convert to array sorted by date
  return Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value }));
}

/**
 * Filter invoices by date range
 */
export function filterInvoicesByDateRange(
  invoices: InvoiceRecord[],
  dateFrom: string,
  dateTo: string
): InvoiceRecord[] {
  return invoices.filter((i) =>
    isWithinDateRange(i.createdAt, dateFrom, dateTo)
  );
}

/**
 * Calculate average invoice value
 */
export function calculateAverageInvoiceValue(
  invoices: InvoiceRecord[]
): number {
  if (invoices.length === 0) return 0;
  const total = invoices.reduce((sum, i) => sum + i.total, 0);
  return Math.round(total / invoices.length);
}

/**
 * Calculate total invoice value
 */
export function calculateTotalInvoiceValue(invoices: InvoiceRecord[]): number {
  return invoices.reduce((sum, i) => sum + i.total, 0);
}

/**
 * Get invoice analytics for a date range
 */
export async function getInvoiceAnalytics(
  dateRange: AnalyticsDateRange
): Promise<{
  data: InvoiceAnalytics | null;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get invoices in date range
    const { data: invoiceData, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("id, user_id, invoice_number, customer_name, total, status, created_at")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`);

    if (invoiceError) {
      throw new Error(invoiceError.message);
    }

    const invoicesInRange: InvoiceRecord[] = (invoiceData || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name,
      total: row.total,
      status: row.status,
      createdAt: row.created_at,
    }));

    // Get current month boundaries
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Count invoices this month
    const { count: invoicesThisMonth, error: monthError } = await supabaseAdmin
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString());

    if (monthError) {
      throw new Error(monthError.message);
    }

    // Get total users count for average calculation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 10000,
    });

    if (authError) {
      throw new Error(authError.message);
    }

    const totalUsers = authData?.users?.length || 1;

    // Calculate average invoices per user
    const averageInvoicesPerUser =
      totalUsers > 0
        ? Math.round((invoicesInRange.length / totalUsers) * 100) / 100
        : 0;

    // Calculate invoice distribution by status
    const invoicesByStatus = calculateInvoicesByStatus(invoicesInRange);

    // Calculate daily invoices
    const dailyInvoices = aggregateDailyInvoices(invoicesInRange, from, to);

    // Calculate average and total invoice value
    const averageInvoiceValue = calculateAverageInvoiceValue(invoicesInRange);
    const totalInvoiceValue = calculateTotalInvoiceValue(invoicesInRange);

    // Get top users by invoice count
    const userInvoiceCount = new Map<string, number>();
    for (const invoice of invoicesInRange) {
      userInvoiceCount.set(
        invoice.userId,
        (userInvoiceCount.get(invoice.userId) || 0) + 1
      );
    }

    // Get user emails for top users
    const topUserIds = Array.from(userInvoiceCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId);

    const userEmailMap = new Map<string, string>();
    for (const user of authData?.users || []) {
      if (topUserIds.includes(user.id)) {
        userEmailMap.set(user.id, user.email || "Unknown");
      }
    }

    const topUsersByInvoiceCount: TopUserByInvoiceCount[] = Array.from(
      userInvoiceCount.entries()
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({
        userEmail: userEmailMap.get(userId) || "Unknown",
        count,
      }));

    return {
      data: {
        totalInvoices: invoicesInRange.length,
        invoicesThisMonth: invoicesThisMonth || 0,
        averageInvoicesPerUser,
        averageInvoiceValue,
        totalInvoiceValue,
        dailyInvoices,
        invoicesByStatus,
        topUsersByInvoiceCount,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error getting invoice analytics:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

// ============================================
// INVOICE CSV EXPORT
// ============================================

/**
 * CSV row for invoice export
 */
export interface InvoiceCSVRow {
  date: string;
  invoiceNumber: string;
  customer: string;
  total: number;
  status: string;
}

/**
 * Convert invoices to CSV rows
 */
export function invoicesToCSVRows(invoices: InvoiceRecord[]): InvoiceCSVRow[] {
  return invoices
    .map((i) => ({
      date: new Date(i.createdAt).toISOString().split("T")[0],
      invoiceNumber: i.invoiceNumber,
      customer: i.customerName,
      total: i.total,
      status: i.status,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate CSV string from invoice data
 */
export function generateInvoiceCSV(rows: InvoiceCSVRow[]): string {
  const headers = ["date", "invoice_number", "customer", "total", "status"];
  const headerLine = headers.join(",");

  const dataLines = rows.map((row) =>
    [
      escapeCSVFieldInternal(row.date),
      escapeCSVFieldInternal(row.invoiceNumber),
      escapeCSVFieldInternal(row.customer),
      escapeCSVFieldInternal(row.total),
      escapeCSVFieldInternal(row.status),
    ].join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

/**
 * Export invoice data as CSV for a date range
 */
export async function exportInvoiceCSV(
  dateRange: AnalyticsDateRange
): Promise<{
  data: string | null;
  rowCount: number;
  error: Error | null;
}> {
  try {
    const supabaseAdmin = createAdminClient();
    const { from, to } = dateRange;

    // Get invoices in date range
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("id, user_id, invoice_number, customer_name, total, status, created_at")
      .gte("created_at", `${from}T00:00:00`)
      .lte("created_at", `${to}T23:59:59`)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    const invoices: InvoiceRecord[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      invoiceNumber: row.invoice_number,
      customerName: row.customer_name,
      total: row.total,
      status: row.status,
      createdAt: row.created_at,
    }));

    const csvRows = invoicesToCSVRows(invoices);
    const csv = generateInvoiceCSV(csvRows);

    return {
      data: csv,
      rowCount: csvRows.length,
      error: null,
    };
  } catch (error) {
    console.error("Error exporting invoice CSV:", error);
    return {
      data: null,
      rowCount: 0,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
