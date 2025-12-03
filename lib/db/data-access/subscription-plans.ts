import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Cache tags for subscription plans
export const SUBSCRIPTION_PLANS_CACHE_TAGS = {
  plans: "subscription-plans",
} as const;

// Types matching lib/config/pricing.ts structure
export interface TierFeatures {
  invoiceLimit: number;
  templateCount: number;
  hasLogo: boolean;
  hasSignature: boolean;
  hasCustomColors: boolean;
  historyLimit: number;
  historyType: "count" | "days";
  hasDashboardTotals: boolean;
  exportQualities: string[];
  hasMonthlyReport: boolean;
}

export interface SubscriptionPlan {
  id: string;
  tier: "free" | "premium" | "pro";
  name: string;
  description: string | null;
  price: number;
  priceFormatted: string;
  billingPeriod: "monthly" | "yearly";
  invoiceLimit: number;
  duration: number;
  features: string[];
  tierFeatures: TierFeatures;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInput {
  name: string;
  description?: string | null;
  price: number;
  invoiceLimit: number;
  duration: number;
  features: string[];
  templateCount: number;
  hasLogo: boolean;
  hasSignature: boolean;
  hasCustomColors: boolean;
  historyLimit: number;
  historyType: "count" | "days";
  hasDashboardTotals: boolean;
  exportQualities: string[];
  hasMonthlyReport: boolean;
  isActive?: boolean;
  isPopular?: boolean;
}

// Transform database row to SubscriptionPlan
function transformPlan(row: Record<string, unknown>): SubscriptionPlan {
  const price = row.price as number;
  return {
    id: row.id as string,
    tier: row.tier as "free" | "premium" | "pro",
    name: row.name as string,
    description: row.description as string | null,
    price,
    priceFormatted:
      price === 0 ? "Gratis" : `Rp ${price.toLocaleString("id-ID")}`,
    billingPeriod: row.billing_period as "monthly" | "yearly",
    invoiceLimit: row.invoice_limit as number,
    duration: row.duration as number,
    features: (row.features as string[]) || [],
    tierFeatures: {
      invoiceLimit: row.invoice_limit as number,
      templateCount: row.template_count as number,
      hasLogo: row.has_logo as boolean,
      hasSignature: row.has_signature as boolean,
      hasCustomColors: row.has_custom_colors as boolean,
      historyLimit: row.history_limit as number,
      historyType: row.history_type as "count" | "days",
      hasDashboardTotals: row.has_dashboard_totals as boolean,
      exportQualities: (row.export_qualities as string[]) || ["standard"],
      hasMonthlyReport: row.has_monthly_report as boolean,
    },
    isActive: row.is_active as boolean,
    isPopular: row.is_popular as boolean,
    sortOrder: row.sort_order as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Get all subscription plans
 * If includeInactive is true, uses service role to bypass RLS
 */
export async function getSubscriptionPlans(
  includeInactive = false
): Promise<{
  data: SubscriptionPlan[] | null;
  error: Error | null;
}> {
  try {
    let supabase;
    
    // Use service role to bypass RLS when including inactive plans
    if (includeInactive) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !serviceRoleKey) {
        return { data: null, error: new Error("Missing Supabase credentials") };
      }
      
      supabase = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    } else {
      supabase = await createClient();
    }

    let query = supabase
      .from("subscription_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("getSubscriptionPlans error:", error);
      return { data: null, error: new Error(error.message) };
    }

    const plans = (data || []).map(transformPlan);
    return { data: plans, error: null };
  } catch (error) {
    console.error("getSubscriptionPlans catch:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Get a single subscription plan by tier
 */
export async function getSubscriptionPlanByTier(tier: string): Promise<{
  data: SubscriptionPlan | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("tier", tier)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: transformPlan(data), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
