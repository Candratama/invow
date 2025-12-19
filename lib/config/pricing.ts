/**
 * Pricing Configuration
 * Defines tier features and limits for subscription plans
 */

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
  hasCustomerManagement: boolean;
}

export type FeatureName = keyof TierFeatures;

/**
 * Tier features configuration
 * Maps tier names to their feature sets
 */
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
    hasCustomerManagement: false,
  },
  premium: {
    invoiceLimit: 200, // Premium tier limit
    templateCount: 8,
    hasLogo: true,
    hasSignature: true,
    hasCustomColors: true,
    historyLimit: 30,
    historyType: 'days',
    hasDashboardTotals: true,
    exportQualities: ['standard', 'high', 'print-ready'],
    hasMonthlyReport: true,
    hasCustomerManagement: true,
  },
} as const;

/**
 * Get features for a specific tier
 * @param tier - Tier name ('free' or 'premium')
 * @returns TierFeatures for the specified tier
 */
export function getTierFeatures(tier: string): TierFeatures {
  return TIER_FEATURES[tier] || TIER_FEATURES.free;
}

/**
 * Check if a tier has access to a specific feature
 * @param tier - Tier name
 * @param feature - Feature name to check
 * @returns Boolean indicating if the tier has access
 */
export function tierHasFeature(tier: string, feature: FeatureName): boolean {
  const features = getTierFeatures(tier);
  const value = features[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}
