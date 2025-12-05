// Simple script to invalidate cache after database update
import { invalidateStoreCache } from './app/actions/store.ts'

async function main() {
  try {
    const result = await invalidateStoreCache()
    console.log('Cache invalidation result:', result)
  } catch (error) {
    console.error('Error invalidating cache:', error)
  }
}

main()