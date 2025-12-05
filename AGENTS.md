# AGENTS.md - Project Guidelines

## ⚠️ IMPORTANT: Documentation Rules

**DO NOT create summary/documentation MD files unless explicitly requested by user.**

Examples of files to AVOID creating:
- ❌ SUMMARY.md
- ❌ CHANGES.md
- ❌ IMPLEMENTATION_NOTES.md
- ❌ CACHE_INVALIDATION_STATUS.md (unless user asks)
- ❌ Any other documentation files

**Only create MD files when:**
- ✅ User explicitly asks: "create documentation", "make a summary file", etc.
- ✅ It's part of the project structure (README.md, CONTRIBUTING.md)
- ✅ User requests specific documentation

**Instead:**
- ✅ Provide summary in chat response
- ✅ Update existing documentation if needed
- ✅ Keep responses concise

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

### 🎨 Admin Features
- **Template Management** (`/admin/templates`) - Manage invoice templates
  - View all 8 templates dengan preview images dari `public/template/`
  - Toggle enable/disable templates dengan Switch
  - Preview full-size template images
  - **Access Control Settings:**
    - Free (All Users) - Available untuk semua user
    - Premium Only - Hanya untuk premium subscribers
    - Whitelist - Hanya untuk email tertentu
  - Email whitelist management per template
  - Badge untuk Premium/Free/Whitelist templates
  - Templates: Classic, Simple, Modern, Elegant, Bold, Compact, Creative, Corporate
  - Template data dari `components/features/invoice/templates/`

### 🔒 Template Access Control
- **Enforcement** (`lib/utils/template-access.ts`)
  - Filter templates berdasarkan user tier (free/premium)
  - Filter templates berdasarkan email whitelist
  - Hide whitelist templates dari non-whitelisted users
  - Only show enabled templates
  - Integrated dengan invoice settings tab

### 🎯 Next Improvements (Optional)
- Search functionality di dashboard
- Bulk actions untuk admin pages
- Offline support dengan service worker
- Web Vitals monitoring

---

# AGENTS.md - Project Guidelines

## General Rules
- **NEVER create MD files for summaries/documentation unless user explicitly requests it**
- Always use related MCP tools to answer questions, do not speculate
- Kill node service after running tests
- Prioritize simple approaches over complex solutions
- Provide concise summaries in chat, not in new files

## Tech Stack
- Next.js 16 (App Router + Cache Components)
- React 19
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

## Data Fetching Pattern (Next.js 16 + React Query)

Pattern ini mengoptimalkan navigasi dengan client-side caching via React Query.
Page server component hanya render shell, data fetching dilakukan di client.

### 1. Page Component (Static Shell)
```typescript
// app/[feature]/page.tsx
import { FeatureClient } from './feature-client'

// Page hanya render client component dengan initialData null
// Data fetching dilakukan di client via React Query
export default function FeaturePage() {
  return <FeatureClient initialData={null} />
}
```

### 2. Loading State (loading.tsx)
```typescript
// app/[feature]/loading.tsx
import { FeatureSkeleton } from '@/components/skeletons/feature-skeleton'

export default function FeatureLoading() {
  return <FeatureSkeleton />
}
```

### 3. React Query Hook dengan Cache Check
```typescript
// lib/hooks/use-feature-data.ts
'use client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'

export const featureKeys = {
  all: ['feature'] as const,
  data: () => [...featureKeys.all, 'data'] as const,
}

export function useFeatureData<T>(initialData?: T) {
  const queryClient = useQueryClient()
  
  // Check if cache exists - don't overwrite with initialData
  const existingData = queryClient.getQueryData<T>(featureKeys.data())
  const initialDataRef = useRef(existingData ? undefined : initialData)
  
  return useQuery({
    queryKey: featureKeys.data(),
    queryFn: async () => {
      const { getFeatureDataAction } = await import('@/app/actions/feature')
      const result = await getFeatureDataAction()
      if (!result.success) throw new Error(result.error)
      return result.data as T
    },
    initialData: initialDataRef.current,
    staleTime: 5 * 60 * 1000, // 5 menit
    gcTime: 10 * 60 * 1000, // 10 menit
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useInvalidateFeature() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: featureKeys.all })
}
```

### 4. Client Component (PENTING: Hooks Order)
```typescript
// app/[feature]/feature-client.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useFeatureData, useInvalidateFeature } from '@/lib/hooks/use-feature-data'
import { useAuth } from '@/lib/auth/auth-context'
import { FeatureSkeleton } from '@/components/skeletons/feature-skeleton'

interface FeatureClientProps {
  initialData: FeatureData | null
}

export function FeatureClient({ initialData }: FeatureClientProps) {
  // ⚠️ SEMUA HOOKS HARUS DIPANGGIL DULU sebelum conditional return
  const { data, isLoading } = useFeatureData(initialData ?? undefined)
  const { user, loading: authLoading } = useAuth()
  const invalidate = useInvalidateFeature()
  
  // State hooks
  const [someState, setSomeState] = useState(false)
  
  // Effect hooks
  useEffect(() => {
    // side effects
  }, [])
  
  // Callback hooks
  const handleAction = useCallback(() => {
    // action logic
  }, [])

  // ✅ Conditional return SETELAH semua hooks
  if (authLoading || (isLoading && !data)) {
    return <FeatureSkeleton />
  }

  if (!user) {
    return null
  }

  // Extract data setelah loading check
  const featureData = data || initialData

  return (
    // ... render UI
  )
}
```

### 5. Server Action untuk Data Fetching
```typescript
// app/actions/feature.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function getFeatureDataAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Unauthorized' }
    }
    
    // ... fetch logic
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Failed to fetch' }
  }
}
```

### 6. Mutation dengan Cache Invalidation
```typescript
const invalidate = useInvalidateFeature()

const handleSave = async () => {
  const result = await saveFeatureAction(data)
  if (result.success) {
    invalidate() // Invalidate React Query cache
  }
}
```

### 7. Proxy untuk Session Management (proxy.ts)
```typescript
// proxy.ts (Next.js 16 - replaces middleware.ts)
import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  // Only refresh session cookies - no auth checks
  const response = await updateSession(request)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### ⚠️ ATURAN PENTING

1. **Hooks Order**: Semua hooks (useState, useEffect, useCallback, useQuery, dll) 
   HARUS dipanggil sebelum conditional return apapun. Ini adalah aturan React.

2. **No Server Fetch di Page**: Jangan fetch data di server component untuk pages 
   yang butuh auth. Biarkan client component handle via React Query.

3. **Cache Check**: Gunakan `useRef` untuk menyimpan initialData hanya sekali,
   cek `getQueryData` untuk menghindari overwrite cache yang sudah ada.

4. **Loading State**: Tampilkan skeleton jika `authLoading` atau `(isLoading && !data)`.
   Kondisi `!data` penting agar tidak flash skeleton saat ada cache.

5. **Static Pages**: Dengan pattern ini, pages menjadi Static (○) di build output,
   memungkinkan instant navigation tanpa server round-trip.

6. **Proxy vs Middleware**: Next.js 16 menggunakan `proxy.ts` (bukan `middleware.ts`).
   Proxy hanya refresh session, auth check dilakukan di server actions.

### 🔒 Security Layers

Pattern ini aman dengan 3 layer security:

1. **Proxy (proxy.ts)** - Refresh Supabase session cookies
2. **Server Actions** - Validate auth sebelum return data (`getUser()` check)
3. **Client Components** - Redirect unauthenticated users untuk UX

Trade-off:
- ✅ Mengurangi Supabase calls (tidak ada auth check di setiap request)
- ✅ Instant navigation dengan static pages
- ✅ React Query caching mengurangi repeated fetches
- ⚠️ User bisa lihat page shell sebelum redirect (tapi tidak ada data)

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