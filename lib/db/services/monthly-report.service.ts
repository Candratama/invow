/**
 * Monthly Report Service
 * Generates monthly reports of invoicing activity for premium users
 * 
 * Requirements: 10.2, 10.3, 10.4
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Invoice } from "@/lib/db/database.types";
import { TierService } from "./tier.service";

export interface MonthlyReportSummary {
  /** Report period in YYYY-MM format */
  monthYear: string;
  /** Display name for the month (e.g., "January 2025") */
  monthDisplay: string;
  /** Total number of invoices created */
  totalInvoices: number;
  /** Total revenue from all invoices */
  totalRevenue: number;
  /** Average invoice value */
  averageInvoiceValue: number;
  /** Highest invoice value */
  highestInvoice: number;
  /** Lowest invoice value */
  lowestInvoice: number;
  /** Number of unique customers */
  uniqueCustomers: number;
  /** Revenue by customer status */
  revenueByCustomerStatus: {
    distributor: number;
    reseller: number;
    customer: number;
  };
  /** Invoice count by customer status */
  invoicesByCustomerStatus: {
    distributor: number;
    reseller: number;
    customer: number;
  };
  /** Daily breakdown of invoices */
  dailyBreakdown: DailyInvoiceData[];
  /** Top customers by revenue */
  topCustomers: CustomerSummary[];
  /** Trend compared to previous month */
  trend: {
    revenueChange: number;
    invoiceCountChange: number;
    isPositive: boolean;
  } | null;
}

export interface DailyInvoiceData {
  date: string;
  count: number;
  revenue: number;
}

export interface CustomerSummary {
  name: string;
  invoiceCount: number;
  totalRevenue: number;
}

export interface MonthlyReportResult {
  data: MonthlyReportSummary | null;
  error: Error | null;
}

export interface AvailableReportsResult {
  data: string[] | null;
  error: Error | null;
}

export class MonthlyReportService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get the previous month in YYYY-MM format
   */
  private getPreviousMonth(date: Date = new Date()): string {
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get display name for a month (e.g., "January 2025")
   */
  private getMonthDisplay(monthYear: string): string {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Check if user can access monthly reports (premium feature)
   */
  async canAccessReports(userId: string): Promise<{
    data: boolean;
    error: Error | null;
  }> {
    try {
      const tierService = new TierService(this.supabase);
      const { data: features, error } = await tierService.getUserFeatures(userId);

      if (error) {
        return { data: false, error };
      }

      return { data: features.hasMonthlyReport, error: null };
    } catch (error) {
      return {
        data: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Get list of available report months for a user
   * Returns months that have at least one invoice
   */
  async getAvailableReportMonths(userId: string): Promise<AvailableReportsResult> {
    try {
      // Check premium access first
      const { data: canAccess, error: accessError } = await this.canAccessReports(userId);
      
      if (accessError) {
        return { data: null, error: accessError };
      }

      if (!canAccess) {
        return { 
          data: null, 
          error: new Error("Monthly reports require Premium subscription") 
        };
      }

      // Get distinct months from invoices
      const { data: invoices, error } = await this.supabase
        .from("invoices")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Extract unique months
      const months = new Set<string>();
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      for (const invoice of invoices || []) {
        const date = new Date(invoice.created_at);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        // Only include completed months (not current month)
        if (monthYear !== currentMonth) {
          months.add(monthYear);
        }
      }

      return { 
        data: Array.from(months).sort().reverse(), 
        error: null 
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Generate monthly report for a specific month
   * Requirements: 10.2, 10.3
   */
  async generateMonthlyReport(
    userId: string,
    monthYear?: string
  ): Promise<MonthlyReportResult> {
    try {
      // Check premium access first
      const { data: canAccess, error: accessError } = await this.canAccessReports(userId);
      
      if (accessError) {
        return { data: null, error: accessError };
      }

      if (!canAccess) {
        return { 
          data: null, 
          error: new Error("Monthly reports require Premium subscription") 
        };
      }

      // Default to previous month if not specified
      const targetMonth = monthYear || this.getPreviousMonth();
      const [year, month] = targetMonth.split('-').map(Number);

      // Calculate date range for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);

      // Fetch invoices for the month
      const { data: invoices, error: invoicesError } = await this.supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });

      if (invoicesError) {
        throw new Error(invoicesError.message);
      }

      const invoiceList = invoices as Invoice[] || [];

      // Calculate summary statistics
      const summary = this.calculateSummary(invoiceList, targetMonth);

      // Get previous month data for trend calculation
      const prevMonth = this.getPreviousMonth(startDate);
      const [prevYear, prevMonthNum] = prevMonth.split('-').map(Number);
      const prevStartDate = new Date(prevYear, prevMonthNum - 1, 1);
      const prevEndDate = new Date(prevYear, prevMonthNum, 0, 23, 59, 59, 999);

      const { data: prevInvoices } = await this.supabase
        .from("invoices")
        .select("total")
        .eq("user_id", userId)
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString());

      // Calculate trend
      if (prevInvoices && prevInvoices.length > 0) {
        const prevRevenue = prevInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const prevCount = prevInvoices.length;

        const revenueChange = prevRevenue > 0 
          ? ((summary.totalRevenue - prevRevenue) / prevRevenue) * 100 
          : summary.totalRevenue > 0 ? 100 : 0;
        
        const invoiceCountChange = prevCount > 0 
          ? ((summary.totalInvoices - prevCount) / prevCount) * 100 
          : summary.totalInvoices > 0 ? 100 : 0;

        summary.trend = {
          revenueChange: Math.round(revenueChange * 10) / 10,
          invoiceCountChange: Math.round(invoiceCountChange * 10) / 10,
          isPositive: revenueChange >= 0,
        };
      }

      return { data: summary, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Calculate summary statistics from invoice list
   */
  private calculateSummary(invoices: Invoice[], monthYear: string): MonthlyReportSummary {
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
    
    const invoiceTotals = invoices.map(inv => inv.total || 0);
    const highestInvoice = invoiceTotals.length > 0 ? Math.max(...invoiceTotals) : 0;
    const lowestInvoice = invoiceTotals.length > 0 ? Math.min(...invoiceTotals) : 0;

    // Unique customers
    const uniqueCustomerNames = new Set(invoices.map(inv => inv.customer_name.toLowerCase()));
    const uniqueCustomers = uniqueCustomerNames.size;

    // Revenue and count by customer status
    const revenueByCustomerStatus = { distributor: 0, reseller: 0, customer: 0 };
    const invoicesByCustomerStatus = { distributor: 0, reseller: 0, customer: 0 };

    for (const invoice of invoices) {
      const status = (invoice.customer_status?.toLowerCase() || 'customer') as keyof typeof revenueByCustomerStatus;
      if (status in revenueByCustomerStatus) {
        revenueByCustomerStatus[status] += invoice.total || 0;
        invoicesByCustomerStatus[status] += 1;
      } else {
        revenueByCustomerStatus.customer += invoice.total || 0;
        invoicesByCustomerStatus.customer += 1;
      }
    }

    // Daily breakdown
    const dailyMap = new Map<string, { count: number; revenue: number }>();
    for (const invoice of invoices) {
      const date = new Date(invoice.created_at).toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { count: 0, revenue: 0 };
      dailyMap.set(date, {
        count: existing.count + 1,
        revenue: existing.revenue + (invoice.total || 0),
      });
    }

    const dailyBreakdown: DailyInvoiceData[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top customers by revenue
    const customerMap = new Map<string, { invoiceCount: number; totalRevenue: number }>();
    for (const invoice of invoices) {
      const name = invoice.customer_name;
      const existing = customerMap.get(name) || { invoiceCount: 0, totalRevenue: 0 };
      customerMap.set(name, {
        invoiceCount: existing.invoiceCount + 1,
        totalRevenue: existing.totalRevenue + (invoice.total || 0),
      });
    }

    const topCustomers: CustomerSummary[] = Array.from(customerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return {
      monthYear,
      monthDisplay: this.getMonthDisplay(monthYear),
      totalInvoices,
      totalRevenue,
      averageInvoiceValue: Math.round(averageInvoiceValue),
      highestInvoice,
      lowestInvoice,
      uniqueCustomers,
      revenueByCustomerStatus,
      invoicesByCustomerStatus,
      dailyBreakdown,
      topCustomers,
      trend: null,
    };
  }

  /**
   * Generate report data formatted for PDF export
   * Requirements: 10.4
   */
  async generateReportForPDF(
    userId: string,
    monthYear?: string
  ): Promise<{
    data: {
      summary: MonthlyReportSummary;
      storeName: string;
      generatedAt: string;
    } | null;
    error: Error | null;
  }> {
    try {
      // Get the report summary
      const { data: summary, error: summaryError } = await this.generateMonthlyReport(userId, monthYear);

      if (summaryError || !summary) {
        return { data: null, error: summaryError };
      }

      // Get store name for the report header
      const { data: store, error: storeError } = await this.supabase
        .from("stores")
        .select("name")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (storeError && storeError.code !== 'PGRST116') {
        throw new Error(storeError.message);
      }

      return {
        data: {
          summary,
          storeName: store?.name || "Your Business",
          generatedAt: new Date().toISOString(),
        },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
