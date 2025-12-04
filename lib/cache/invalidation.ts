'use server'

import { revalidateTag } from 'next/cache'
import { CacheTags } from './tags'

/**
 * Invalidate the pricing cache.
 * Call this after admin updates to pricing plans (create/update/delete).
 * This will trigger re-render of all components tagged with 'pricing'.
 * Uses 'max' profile for stale-while-revalidate semantics.
 */
export async function invalidatePricingCache(): Promise<void> {
  revalidateTag(CacheTags.PRICING, 'max')
}

/**
 * Invalidate the templates cache.
 * Call this after admin updates to invoice templates.
 * This will trigger re-render of all components tagged with 'templates'.
 * Uses 'max' profile for stale-while-revalidate semantics.
 */
export async function invalidateTemplatesCache(): Promise<void> {
  revalidateTag(CacheTags.TEMPLATES, 'max')
}

/**
 * Invalidate the dashboard cache.
 * Call this when dashboard shell components need to be refreshed.
 * Uses 'max' profile for stale-while-revalidate semantics.
 */
export async function invalidateDashboardCache(): Promise<void> {
  revalidateTag(CacheTags.DASHBOARD, 'max')
}
