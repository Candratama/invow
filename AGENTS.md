# AGENTS.md - Project Guidelines

## Recent Performance & UX Improvements (Dec 2024)

### ✅ Implemented Improvements
1. **Keyboard Shortcuts** - Ctrl+N untuk new invoice, Escape untuk back
2. **Better Loading States** - Separate loading untuk invoices vs updating
3. **Improved Toast Notifications** - Dengan descriptions yang lebih informatif
4. **Enhanced Empty States** - Visual yang lebih engaging dengan CTA
5. **Smooth Page Transitions** - Fade-in animations untuk form/preview
6. **Optimized Bundle** - Package imports optimization untuk lucide-react
7. **Better Touch Feedback** - Active states dan touch-action optimization
8. **Image Optimization** - WebP/AVIF support dengan 30-day cache
9. **Tooltip Hints** - Keyboard shortcuts hints di buttons
10. **Error Boundary** - Graceful error handling dengan fallback UI

### 📦 New Utilities
- `lib/hooks/use-debounce.ts` - Debouncing untuk auto-save
- `lib/hooks/use-pull-to-refresh.ts` - Pull-to-refresh untuk mobile
- `lib/hooks/use-keyboard-shortcuts.ts` - Reusable keyboard shortcuts
- `components/ui/error-boundary.tsx` - Error boundary component

### 🎯 Next Improvements (Optional)
- Search functionality di dashboard
- Bulk actions untuk admin pages
- Offline support dengan service worker
- Web Vitals monitoring

---

# AGENTS.md - Project Guidelines

## General Rules
- Never create useless md files like summary or documentation unless explicitly requested
- Always use related MCP tools to answer questions, do not speculate
- Kill node service after running tests
- Prioritize simple approaches over complex solutions

## Tech Stack
- Next.js 15 (App Router)
- React 18
- TypeScript (strict mode)
- Supabase (auth + database)
- Tailwind CSS + shadcn/ui (new-york style)
- Vitest + Testing Library for testing
- Zod for validation
- Zustand for client state
- React Hook Form for forms

## UI Components
- Always use shadcn/ui for consistent UI components
- Use `npx shadcn@latest add <component>` to add new components
- Components are in `components/ui/`
- Feature components are in `components/features/`
- Use Lucide icons (already configured)

## Data Fetching Pattern
Ikuti pola untuk optimasi navigasi dan caching:

### 1. Server Component dengan Suspense (page.tsx)
```typescript
// app/[feature]/page.tsx
import { Suspense } from 'react'
import { headers } from 'next/headers'
import { getFeatureDataAction } from '@/app/actions/feature'
import { FeatureClient } from './feature-client'
import { FeatureSkeleton } from '@/components/skeletons/feature-skeleton'

async function FeatureContent() {
  // Deteksi client-side navigation untuk skip server fetch
  const headersList = await headers()
  const referer = headersList.get('referer') || ''
  const host = headersList.get('host') || ''
  const isClientNavigation = referer.includes(host) && referer.includes('/dashboard')

  // Skip fetch jika client navigation - React Query akan gunakan cache
  let initialData = null
  if (!isClientNavigation) {
    const result = await getFeatureDataAction()
    initialData = result.success && result.data ? result.data : null
  }

  return <FeatureClient initialData={initialData} />
}

export default function FeaturePage() {
  return (
    <Suspense fallback={<FeatureSkeleton />}>
      <FeatureContent />
    </Suspense>
  )
}
```

### 2. Server Action untuk Data Fetching
```typescript
// app/actions/feature.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function getFeatureDataAction() {
  try {
    const supabase = await createClient()
    // ... fetch logic
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch' }
  }
}
```

### 3. React Query Hook untuk Client-Side Caching
```typescript
// lib/hooks/use-feature-data.ts
'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const featureKeys = {
  all: ['feature'] as const,
  data: () => [...featureKeys.all, 'data'] as const,
}

export function useFeatureData<T>(initialData?: T) {
  return useQuery({
    queryKey: featureKeys.data(),
    queryFn: async () => {
      const { getFeatureDataAction } = await import('@/app/actions/feature')
      const result = await getFeatureDataAction()
      if (!result.success) throw new Error(result.error)
      return result.data as T
    },
    initialData,
    staleTime: 5 * 60 * 1000, // 5 menit
  })
}

export function useInvalidateFeature() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: featureKeys.all })
}
```

### 4. Client Component dengan React Query
```typescript
// app/[feature]/feature-client.tsx
'use client'
import { useFeatureData, useInvalidateFeature } from '@/lib/hooks/use-feature-data'

interface FeatureClientProps {
  initialData: FeatureData | null
}

export function FeatureClient({ initialData }: FeatureClientProps) {
  const { data, isLoading } = useFeatureData(initialData || undefined)
  const invalidate = useInvalidateFeature()

  // Gunakan data dari React Query (dengan fallback ke initialData)
  const featureData = data || initialData

  // Panggil invalidate() setelah mutation
}
```

### 5. Mutation dengan Cache Invalidation
```typescript
// Di client component setelah mutation berhasil
const invalidate = useInvalidateFeature()

const handleSave = async () => {
  const result = await saveFeatureAction(data)
  if (result.success) {
    invalidate() // Invalidate React Query cache
  }
}
```

### PENTING: Aturan Data Fetching
- **Gunakan Suspense** di page.tsx untuk streaming dan menghindari blocking
- **Deteksi client navigation** via `headers()` untuk skip server fetch
- **React Query** untuk client-side caching (staleTime 5 menit)
- **Server Actions** untuk fetch dan mutations (bukan API routes)
- **Invalidate cache** setelah mutation dengan `useInvalidateFeature()`
- **Auth check** di middleware, bukan di page.tsx
- **User data** dari `useAuth()` hook di client, bukan server fetch

### Contoh Implementasi
- Dashboard: `app/dashboard/page.tsx` + `lib/hooks/use-dashboard-data.ts`
- Settings: `app/dashboard/settings/page.tsx` + `lib/hooks/use-settings-data.ts`
- Admin: `app/admin/*/page.tsx` + `lib/hooks/use-admin-data.ts`

## File Structure
```
app/
├── actions/          # Server actions
├── api/              # API routes
├── dashboard/        # Protected routes
│   └── [feature]/
│       ├── page.tsx           # Server component
│       └── feature-client.tsx # Client component
lib/
├── db/
│   ├── data-access/  # Data fetching functions + cache tags
│   └── services/     # Database service classes
├── supabase/
│   ├── client.ts     # Browser client
│   ├── server.ts     # Server client
│   └── middleware.ts # Auth middleware
├── stores/           # Zustand stores
└── utils/            # Utility functions
components/
├── ui/               # shadcn/ui components
└── features/         # Feature-specific components
```

## Authentication
- Use `createClient()` from `@/lib/supabase/server` for server-side
- Protected routes are under `/dashboard/*`
- Admin routes are under `/admin/*` (requires `is_admin` metadata)
- Auth pages: `/dashboard/login`, `/dashboard/signup`, `/dashboard/forgot-password`

## Testing
- Use Vitest with `--run` flag for single execution
- Test files: `*.test.ts` or `*.test.tsx`
- Property-based tests use `fast-check`
- Mock `server-only` package via `vitest.server-only-mock.ts`
- Run tests: `npm run test`

## Server Actions Pattern
```typescript
'use server'

export async function myAction(data: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // ... action logic

  revalidateTag(CACHE_TAGS.feature)
  revalidatePath('/dashboard/feature')
  return { success: true, data: result }
}
```

## Form Handling
- Use React Hook Form + Zod for validation
- Use shadcn/ui form components
- Handle loading and error states properly

## Environment Variables
- Public vars: `NEXT_PUBLIC_*`
- Server vars: defined in `.env.local`
- Example: `.env.example`