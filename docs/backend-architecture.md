# Backend Architecture - Invow App

Dokumentasi lengkap arsitektur backend aplikasi Invow untuk pembelajaran.

---

## Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Struktur Folder Backend](#2-struktur-folder-backend)
3. [Database Schema](#3-database-schema)
4. [Supabase Setup](#4-supabase-setup)
5. [Architecture Layers](#5-architecture-layers)
6. [Data Access Layer](#6-data-access-layer)
7. [Services Layer](#7-services-layer)
8. [Server Actions](#8-server-actions)
9. [API Routes](#9-api-routes)
10. [Authentication](#10-authentication)
11. [Authorization](#11-authorization)
12. [Caching Strategy](#12-caching-strategy)
13. [Row Level Security (RLS)](#13-row-level-security-rls)

---

## 1. Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16.1.1** | Framework (App Router) |
| **Supabase** | Database (PostgreSQL) + Auth |
| **@supabase/ssr** | Server-side Supabase client |
| **TanStack Query** | Client-side data fetching & caching |
| **TypeScript** | Type safety |
| **Zod** | Runtime validation |

---

## 2. Struktur Folder Backend

```
invow/
├── lib/
│   ├── supabase/              # Supabase client setup
│   │   ├── server.ts          # Server-side client (SSR)
│   │   ├── client.ts          # Browser client
│   │   └── middleware.ts      # Session refresh middleware
│   │
│   ├── db/
│   │   ├── database.types.ts  # Auto-generated Supabase types
│   │   ├── data-access/       # Data fetching layer (cached)
│   │   │   ├── invoices.ts
│   │   │   ├── customers.ts
│   │   │   ├── store.ts
│   │   │   ├── settings.ts
│   │   │   ├── subscription.ts
│   │   │   ├── report.ts
│   │   │   └── admin.ts
│   │   └── services/          # Business logic layer
│   │       ├── invoices.service.ts
│   │       ├── customers.service.ts
│   │       ├── stores.service.ts
│   │       ├── subscription.service.ts
│   │       ├── tier.service.ts
│   │       └── admin.service.ts
│   │
│   ├── auth/
│   │   └── auth-context.tsx   # Client-side auth context
│   │
│   ├── hooks/                 # React Query hooks
│   │   ├── use-dashboard-data.ts
│   │   ├── use-customers-data.ts
│   │   ├── use-premium-status.ts
│   │   └── use-report-data.ts
│   │
│   └── types/                 # TypeScript types
│       └── report.ts
│
├── app/
│   ├── actions/               # Server Actions
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── invoices.ts
│   │   ├── customers.ts
│   │   ├── store.ts
│   │   ├── subscription.ts
│   │   ├── report.ts
│   │   ├── preferences.ts
│   │   ├── payments.ts
│   │   └── admin*.ts
│   │
│   ├── api/                   # API Routes
│   │   ├── payments/
│   │   │   ├── create-invoice/route.ts
│   │   │   ├── verify/route.ts
│   │   │   └── lookup/route.ts
│   │   └── invalidate-cache/route.ts
│   │
│   └── auth/
│       ├── callback/route.ts  # PKCE callback
│       └── reset-password/page.tsx
│
└── supabase/
    └── migrations/            # Database migrations
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  auth.users  │────<│    stores    │────<│store_contacts│
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│user_preferences│   │   customers  │
└──────────────┘     └──────────────┘
       │                    │
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│user_subscriptions│ │   invoices   │────<│invoice_items │
└──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│payment_transactions│
└──────────────┘
```

### 3.2 Tabel-Tabel Utama

#### `stores` - Profil Toko
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  invoice_prefix TEXT DEFAULT 'INV',
  invoice_start_number INTEGER DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `customers` - Pelanggan
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'Customer',  -- Customer/Reseller/Distributor
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `invoices` - Invoice/Nota
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  store_id UUID REFERENCES stores(id),
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'draft',  -- draft/pending/synced
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `invoice_items` - Item Invoice
```sql
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  -- Regular item fields
  product_name TEXT,
  weight DECIMAL,
  price_per_gram DECIMAL,
  subtotal DECIMAL,
  -- Buyback fields
  is_buyback BOOLEAN DEFAULT FALSE,
  gram DECIMAL,
  buyback_rate DECIMAL,
  total DECIMAL,
  created_at TIMESTAMP
);
```

#### `user_subscriptions` - Langganan
```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  tier TEXT DEFAULT 'free',  -- free/premium
  status TEXT DEFAULT 'active',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  accumulated_invoice_credits INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `user_preferences` - Preferensi User
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  default_store_id UUID REFERENCES stores(id),
  selected_template TEXT,
  tax_enabled BOOLEAN DEFAULT FALSE,
  tax_percentage DECIMAL DEFAULT 0,
  export_quality_kb INTEGER DEFAULT 100,
  buyback_price_per_gram DECIMAL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 4. Supabase Setup

### 4.1 Server Client (`lib/supabase/server.ts`)

Digunakan di Server Components dan Server Actions.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 4.2 Browser Client (`lib/supabase/client.ts`)

Digunakan di Client Components.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  )
}
```

### 4.3 Middleware (`lib/supabase/middleware.ts`)

Refresh session di setiap request.

```typescript
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(/* ... */)

  // Refresh session if expired
  await supabase.auth.getUser()

  return response
}
```

---

## 5. Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│              (React Server/Client Components)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    React Hooks                           │
│   lib/hooks/use-*.ts                                    │
│   - Wraps server actions dengan TanStack Query          │
│   - Handles loading, error, caching                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Server Actions / API Routes                │
│   app/actions/*.ts    |    app/api/*/route.ts           │
│   - Entry point dari client                             │
│   - Auth checks                                         │
│   - Input validation                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Access Layer                       │
│              lib/db/data-access/*.ts                     │
│   - Request caching dengan cache()                      │
│   - Tier gating (hide premium features)                 │
│   - Data aggregation                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Services Layer                         │
│              lib/db/services/*.service.ts                │
│   - Business logic                                      │
│   - CRUD operations                                     │
│   - Query building                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Client                         │
│   - Query execution                                     │
│   - Transaction handling                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                Supabase/PostgreSQL                       │
│   - Row Level Security (RLS)                            │
│   - Data storage                                        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Data Access Layer

**Lokasi:** `lib/db/data-access/`

Data Access Layer adalah wrapper di atas Services yang menambahkan:
- Request caching
- Tier gating (sembunyikan fitur premium untuk free users)
- Data aggregation

### 6.1 Pattern Dasar

```typescript
// lib/db/data-access/invoices.ts
import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoicesService } from '@/lib/db/services/invoices.service'

export const getInvoices = cache(async (userId: string) => {
  const supabase = await createClient()
  const service = new InvoicesService(supabase)
  return service.getInvoices(userId)
})
```

### 6.2 Contoh dengan Tier Gating

```typescript
// lib/db/data-access/store.ts
export async function getStoreData(userId: string) {
  const supabase = await createClient()
  const storesService = new StoresService(supabase)
  const tierService = new TierService(supabase)

  const store = await storesService.getStore(userId)
  const isPremium = await tierService.isPremium(userId)

  // Hide logo for free users
  if (!isPremium && store) {
    store.logo_url = null
  }

  return store
}
```

### 6.3 Files dalam Data Access

| File | Fungsi |
|------|--------|
| `invoices.ts` | Fetch invoices dengan history limit |
| `customers.ts` | Fetch customers |
| `store.ts` | Store data dengan tier gating |
| `settings.ts` | Agregasi store + contacts + preferences |
| `subscription.ts` | Status langganan |
| `tier.ts` | Premium feature checks |
| `report.ts` | Report data (overview, buyback, detail) |
| `admin.ts` | Admin data dengan unstable_cache |

---

## 7. Services Layer

**Lokasi:** `lib/db/services/`

Services Layer berisi business logic dan CRUD operations.

### 7.1 Pattern Dasar

```typescript
// lib/db/services/customers.service.ts
export class CustomersService {
  constructor(private supabase: SupabaseClient) {}

  async getCustomers(storeId: string) {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_deleted', false)
      .order('name')

    if (error) throw error
    return data
  }

  async createCustomer(data: CustomerInsert) {
    const { data: customer, error } = await this.supabase
      .from('customers')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return customer
  }

  async updateCustomer(id: string, data: CustomerUpdate) {
    const { data: customer, error } = await this.supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return customer
  }

  async deleteCustomer(id: string) {
    // Soft delete
    const { error } = await this.supabase
      .from('customers')
      .update({ is_deleted: true })
      .eq('id', id)

    if (error) throw error
  }
}
```

### 7.2 Services yang Ada

| Service | Responsibility |
|---------|---------------|
| `invoices.service.ts` | CRUD invoices dan items |
| `customers.service.ts` | CRUD customers |
| `stores.service.ts` | CRUD stores |
| `store-contacts.service.ts` | CRUD store contacts |
| `user-preferences.service.ts` | CRUD preferences |
| `subscription.service.ts` | Subscription logic, limits |
| `tier.service.ts` | Premium checks, feature gating |
| `revenue.service.ts` | Revenue calculations |
| `admin.service.ts` | Admin access checks |

---

## 8. Server Actions

**Lokasi:** `app/actions/`

Server Actions adalah entry point dari client ke backend.

### 8.1 Pattern Dasar

```typescript
// app/actions/customers.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomerAction(data: CustomerInput) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Premium check (customers is premium-only)
  const subscriptionService = new SubscriptionService(supabase)
  const status = await subscriptionService.getSubscriptionStatus(user.id)

  if (status.tier !== 'premium') {
    return { success: false, error: 'Premium feature' }
  }

  // 3. Ownership check
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!store) {
    return { success: false, error: 'Store not found' }
  }

  // 4. Validation (Zod)
  const validated = customerInsertSchema.safeParse(data)
  if (!validated.success) {
    return { success: false, error: validated.error.message }
  }

  // 5. Create
  try {
    const service = new CustomersService(supabase)
    const customer = await service.createCustomer({
      ...validated.data,
      store_id: store.id,
    })

    // 6. Revalidate cache
    revalidatePath('/dashboard/customers')

    return { success: true, data: customer }
  } catch (error) {
    return { success: false, error: 'Failed to create customer' }
  }
}
```

### 8.2 Server Actions yang Ada

| File | Actions |
|------|---------|
| `auth.ts` | `updatePasswordAction` |
| `dashboard.ts` | `getDashboardDataAction` |
| `invoices.ts` | CRUD invoices, `upsertInvoiceWithItemsAction` |
| `customers.ts` | CRUD customers (premium-only) |
| `store.ts` | Update store, CRUD contacts |
| `subscription.ts` | Status, upgrade, reports |
| `report.ts` | Overview, buyback, detail data |
| `preferences.ts` | Update preferences |
| `payments.ts` | Create Mayar invoice |
| `admin*.ts` | Admin operations |

---

## 9. API Routes

**Lokasi:** `app/api/`

API Routes digunakan untuk external callbacks dan operasi yang tidak bisa dilakukan via Server Actions.

### 9.1 Payment Routes

```
/api/payments/
├── create-invoice/route.ts   # Create Mayar invoice (POST)
├── verify/route.ts           # Verify payment after redirect (POST)
├── lookup/route.ts           # Find payment by Mayar ID (GET)
├── clear-cache/route.ts      # Clear verification cache (POST/GET)
└── debug-mayar/route.ts      # Debug (dev only)
```

### 9.2 Pattern API Route

```typescript
// app/api/payments/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // 2. Parse & validate body
  const body = await request.json()
  const { paymentId } = body

  if (!paymentId || typeof paymentId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Invalid payment ID' },
      { status: 400 }
    )
  }

  // 3. Process
  try {
    const result = await MayarPaymentService.verifyPayment(user.id, paymentId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 10. Authentication

### 10.1 Auth Context (Client-side)

```typescript
// lib/auth/auth-context.tsx
'use client'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 10.2 Auth Flows

#### Signup Flow
```
1. User fills signup form
2. AuthContext.signUp() called
3. Supabase sends verification email
4. User clicks email link
5. Redirects to /auth/callback
6. Callback exchanges PKCE code for session
7. Redirects to /dashboard
```

#### Login Flow
```
1. User fills login form
2. AuthContext.signIn() called
3. Supabase sets session cookie
4. Hard redirect to /dashboard
```

#### Password Reset Flow
```
1. User enters email on forgot-password page
2. AuthContext.resetPassword() called
3. Supabase sends reset email
4. User clicks email link
5. Redirects to /auth/reset-password
6. Page listens for PASSWORD_RECOVERY event
7. User enters new password
8. supabase.auth.updateUser() called
```

### 10.3 Auth Callback Route

```typescript
// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

---

## 11. Authorization

### 11.1 User Authorization

Setiap server action memverifikasi:
1. User authenticated
2. User owns the resource

```typescript
// Pattern: Ownership check
const { data: store } = await supabase
  .from('stores')
  .select('id')
  .eq('user_id', user.id)  // User owns store
  .single()

if (!store) {
  return { success: false, error: 'Store not found' }
}
```

### 11.2 Premium Authorization

```typescript
// lib/hooks/use-premium-status.ts
export function usePremiumStatus() {
  return useQuery({
    queryKey: ['premium-status'],
    queryFn: async () => {
      const { data } = await getSubscriptionStatusAction()
      return data?.tier === 'premium'
    },
  })
}

// Server-side check
async function validatePremiumAccess(userId: string) {
  const subscriptionService = new SubscriptionService(supabase)
  const status = await subscriptionService.getSubscriptionStatus(userId)

  if (status.tier !== 'premium') {
    throw new Error('Premium feature')
  }
}
```

### 11.3 Admin Authorization

```typescript
// lib/db/services/admin.service.ts
export async function isAdmin(userId: string): Promise<boolean> {
  // Use service role client to bypass RLS
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
  return data?.user?.user_metadata?.is_admin === true
}

// app/actions/admin.ts
async function verifyAdminAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const admin = await isAdmin(user.id)
  if (!admin) {
    throw new Error('Admin access required')
  }

  return user
}
```

---

## 12. Caching Strategy

### 12.1 Request Memoization (`cache()`)

Prevent duplicate fetches dalam satu request.

```typescript
import { cache } from 'react'

export const getUser = cache(async (userId: string) => {
  // This will only run once per request,
  // even if called multiple times
  const supabase = await createClient()
  return supabase.from('users').select().eq('id', userId).single()
})
```

### 12.2 Persistent Cache (`unstable_cache`)

Cache data across requests dengan tags.

```typescript
import { unstable_cache } from 'next/cache'

export const getAdminUsers = unstable_cache(
  async () => {
    const supabase = await createClient()
    return supabase.from('users').select()
  },
  ['admin-users'],  // Cache key
  {
    tags: ['admin-users'],
    revalidate: 300,  // 5 minutes
  }
)
```

### 12.3 Cache Invalidation

```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// After mutation
export async function updateStoreAction(data: StoreInput) {
  // ... update logic

  // Invalidate specific paths
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')

  // Invalidate by tag
  revalidateTag('store-settings')
}
```

### 12.4 Cache Tags

```typescript
// lib/cache-tags.ts
export const SETTINGS_CACHE_TAGS = {
  store: 'settings-store',
  contacts: 'settings-contacts',
  preferences: 'settings-preferences',
  subscription: 'settings-subscription',
}
```

---

## 13. Row Level Security (RLS)

### 13.1 User Data Policies

```sql
-- Users can only see their own stores
CREATE POLICY "Users can view own stores"
ON stores FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own stores
CREATE POLICY "Users can update own stores"
ON stores FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only insert their own stores
CREATE POLICY "Users can insert own stores"
ON stores FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 13.2 Admin Policies

```sql
-- Admins can view all data
CREATE POLICY "Admins can view all stores"
ON stores FOR SELECT
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
);
```

### 13.3 Cascading Policies

```sql
-- Customers belong to stores owned by user
CREATE POLICY "Users can view customers of own stores"
ON customers FOR SELECT
USING (
  store_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);
```

---

## Summary

Backend Invow mengikuti arsitektur berlapis yang clean:

1. **UI** memanggil **React Hooks** (TanStack Query)
2. **Hooks** memanggil **Server Actions**
3. **Server Actions** melakukan auth check, validation, lalu memanggil **Data Access**
4. **Data Access** menerapkan caching dan tier gating, lalu memanggil **Services**
5. **Services** mengeksekusi query via **Supabase Client**
6. **Supabase/PostgreSQL** menerapkan **RLS** untuk security tambahan

Pattern ini memisahkan concerns dengan baik dan memudahkan maintenance.
