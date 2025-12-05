import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

const SETTINGS_CACHE_TAGS = {
  store: 'settings-store',
  contacts: 'settings-contacts',
  subscription: 'settings-subscription',
  preferences: 'settings-preferences',
} as const

export async function POST(_request: NextRequest) {
  try {
    // Invalidate both store and contacts cache
    revalidateTag(SETTINGS_CACHE_TAGS.store)
    revalidateTag(SETTINGS_CACHE_TAGS.contacts)
    
    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache invalidated successfully',
      tags: ['settings-store', 'settings-contacts'],
      paths: ['/dashboard', '/dashboard/settings']
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}