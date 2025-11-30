import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { TierService, type FeatureName, type HistoryLimit } from '@/lib/db/services/tier.service'
import type { TierFeatures } from '@/lib/config/pricing'

/**
 * Server-only data access layer for tier features
 * Uses React cache() for request memoization
 */

export const getUserTier = cache(async (userId: string): Promise<{
  data: string;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.getUserTier(userId)
})

export const getUserFeatures = cache(async (userId: string): Promise<{
  data: TierFeatures;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.getUserFeatures(userId)
})

export const canAccessFeature = cache(async (userId: string, feature: FeatureName): Promise<{
  data: boolean;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.canAccessFeature(userId, feature)
})

export const getHistoryLimit = cache(async (userId: string): Promise<{
  data: HistoryLimit;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.getHistoryLimit(userId)
})

export const isPremium = cache(async (userId: string): Promise<{
  data: boolean;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.isPremium(userId)
})

export const getAvailableTemplateCount = cache(async (userId: string): Promise<{
  data: number;
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.getAvailableTemplateCount(userId)
})

export const getAvailableExportQualities = cache(async (userId: string): Promise<{
  data: string[];
  error: Error | null;
}> => {
  const supabase = await createClient()
  const service = new TierService(supabase)
  return await service.getAvailableExportQualities(userId)
})
