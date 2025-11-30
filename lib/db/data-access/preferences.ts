import { cache } from 'react'
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { UserPreferencesService } from '@/lib/db/services/user-preferences.service'

/**
 * Server-only data access layer for user preferences
 * Uses React cache() for request memoization
 */

export const getUserPreferences = cache(async () => {
  const supabase = await createClient()
  const service = new UserPreferencesService(supabase)
  return await service.getPreferences()
})

export const getPreferencesWithDefaults = cache(async () => {
  const supabase = await createClient()
  const service = new UserPreferencesService(supabase)
  return await service.getUserPreferences()
})
