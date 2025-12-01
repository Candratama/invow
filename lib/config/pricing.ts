/**
 * Pricing Configuration
 * Central location for all subscription pricing and feature access
 */

export interface TierConfig {
  name: string;
  price: number;
  priceFormatted: string;
  invoiceLimit: number;
  duration: number; // in days
  features: string[];
}

export interface TierFeatures {
  invoiceLimit: number;
  templateCount: number;
  hasLogo: boolean;
  hasSignature: boolean;
  hasCustomColors: boolean;
  historyLimit: number;
  historyType: 'count' | 'days';
  hasDashboardTotals: boolean;
  exportQualities: string[];
  hasMonthlyReport: boolean;
}

export const TIER_PRICES = {
  premium: 1000,
} as const;

export const TIER_LIMITS = {
  free: 10,
  premium: 200,
} as const;

export const TIER_FEATURES: Record<string, TierFeatures> = {
  free: {
    invoiceLimit: 10,
    templateCount: 1,
    hasLogo: false,
    hasSignature: false,
    hasCustomColors: false,
    historyLimit: 10,
    historyType: 'count',
    hasDashboardTotals: false,
    exportQualities: ['standard'],
    hasMonthlyReport: false,
  },
  premium: {
    invoiceLimit: 200,
    templateCount: 3,
    hasLogo: true,
    hasSignature: true,
    hasCustomColors: true,
    historyLimit: 30,
    historyType: 'days',
    hasDashboardTotals: true,
    exportQualities: ['standard', 'high', 'print-ready'],
    hasMonthlyReport: true,
  },
};

export const TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    name: "Free",
    price: 0,
    priceFormatted: "Rp 0",
    invoiceLimit: TIER_LIMITS.free,
    duration: 0, // Forever
    features: [
      "10 invoices per month",
      "1 basic invoice template",
      "Standard quality PDF export",
      "View last 10 transactions",
    ],
  },
  premium: {
    name: "Premium",
    price: TIER_PRICES.premium,
    priceFormatted: `Rp ${TIER_PRICES.premium.toLocaleString("id-ID")}`,
    invoiceLimit: TIER_LIMITS.premium,
    duration: 30, // 30 days
    features: [
      "200 invoices per month",
      "All Free features",
      "Custom logo & signature",
      "Custom brand colors",
      "3+ premium templates",
      "High & print-ready export quality",
      "30 days transaction history",
      "Monthly reports",
      "Dashboard totals & revenue",
    ],
  },
};

/**
 * Get price for a tier
 */
export function getTierPrice(tier: string): number {
  return TIER_PRICES[tier as keyof typeof TIER_PRICES] || 0;
}

/**
 * Get formatted price for a tier
 */
export function getFormattedPrice(tier: string): string {
  const price = getTierPrice(tier);
  return `Rp ${price.toLocaleString("id-ID")}`;
}

/**
 * Get invoice limit for a tier
 */
export function getTierLimit(tier: string): number {
  return TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || 0;
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: string): TierConfig | null {
  return TIER_CONFIGS[tier] || null;
}

/**
 * Get tier features
 */
export function getTierFeatures(tier: string): TierFeatures | null {
  return TIER_FEATURES[tier] || null;
}

/**
 * Check if a tier has access to a specific feature
 */
export function hasFeatureAccess(tier: string, feature: keyof TierFeatures): boolean {
  const features = TIER_FEATURES[tier];
  if (!features) return false;
  
  const value = features[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
