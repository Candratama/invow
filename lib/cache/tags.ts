/**
 * Cache tags for targeted invalidation across the application.
 * Use these constants when tagging cached content with cacheTag()
 * and when invalidating with revalidateTag().
 */
export const CacheTags = {
  /** Pricing plans displayed on landing page */
  PRICING: 'pricing',
  /** Invoice templates for preview pages */
  TEMPLATES: 'templates',
  /** Dashboard static shell components */
  DASHBOARD: 'dashboard',
} as const

export type CacheTag = typeof CacheTags[keyof typeof CacheTags]
