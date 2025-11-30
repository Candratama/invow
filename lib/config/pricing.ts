/**
 * Pricing Configuration
 * Central location for all subscription pricing
 */

export interface TierConfig {
  name: string;
  price: number;
  priceFormatted: string;
  invoiceLimit: number;
  duration: number; // in days
  features: string[];
}

export const TIER_PRICES = {
  starter: 15000,
} as const;

export const TIER_LIMITS = {
  free: 30,
  starter: 200,
} as const;

export const TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    name: "Free",
    price: 0,
    priceFormatted: "Rp 0",
    invoiceLimit: TIER_LIMITS.free,
    duration: 0, // Forever
    features: [
      "30 invoices per month",
      "Basic invoice templates",
      "PDF export",
      "Email delivery",
    ],
  },
  starter: {
    name: "Starter",
    price: TIER_PRICES.starter,
    priceFormatted: `Rp ${TIER_PRICES.starter.toLocaleString("id-ID")}`,
    invoiceLimit: TIER_LIMITS.starter,
    duration: 30, // 30 days
    features: [
      "200 invoices per month",
      "All Free features",
      "Custom branding",
      "Priority support",
      "Advanced templates",
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
