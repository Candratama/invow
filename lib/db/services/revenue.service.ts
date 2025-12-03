import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  invoiceCount: number;
  monthlyInvoiceCount: number;
  averageOrderValue: number;
  monthlyAverageOrderValue: number;
}

/**
 * Service for revenue-related database operations
 * Uses database function for efficient aggregation
 */
export class RevenueService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get revenue metrics calculated directly in database
   * Much faster than fetching all invoices and calculating in JS
   */
  async getRevenueMetrics(userId: string): Promise<{
    data: RevenueMetrics | null;
    error: Error | null;
  }> {
    try {
      // Cast to any because get_revenue_metrics is a custom function not in generated types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any).rpc(
        "get_revenue_metrics",
        { p_user_id: userId }
      );

      if (error) {
        console.error("Error fetching revenue metrics:", error);
        return { data: null, error: new Error(error.message) };
      }

      return {
        data: data as RevenueMetrics,
        error: null,
      };
    } catch (error) {
      console.error("Error in getRevenueMetrics:", error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }
}
