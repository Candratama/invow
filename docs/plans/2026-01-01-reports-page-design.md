# Reports Page Design Document

**Date:** January 1, 2026
**Feature:** Business Reports Dashboard
**Status:** Ready for Implementation
**Priority:** Premium Feature (Subscription-gated)

---

## Executive Summary

This document outlines the design for a comprehensive Reports page that enables premium users to analyze their business performance through revenue & sales analytics. The feature includes dashboard-style tabs (Overview, Details, Comparison), mobile-first responsive design, and flexible export to spreadsheet functionality.

**Key Features:**
- Premium-only access (drives subscription conversions)
- 3 tabs: Overview (charts + metrics), Details (tables), Comparison (period analysis)
- Mobile-first with bottom tab navigation
- Smart default period (adaptive based on date)
- Flexible export (CSV/Excel with customizable date ranges)
- 1 year historical data access

---

## 1. Architecture & Routing

### Route Structure

**Path:** `/app/dashboard/reports/page.tsx`

**File Organization:**
```
app/dashboard/reports/
├── page.tsx                    # Server component with auth & subscription check
├── reports-client.tsx          # Main client component (tab navigation)
└── components/
    ├── overview-tab.tsx
    ├── details-tab.tsx
    ├── comparison-tab.tsx
    ├── summary-card.tsx
    ├── revenue-chart.tsx
    ├── customer-breakdown-chart.tsx
    ├── comparison-chart.tsx
    ├── export-modal.tsx
    ├── date-range-selector.tsx
    └── premium-gate.tsx
```

### Access Control

**Server-Side Check (page.tsx):**
```typescript
export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/dashboard/login')

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .single()

  // Premium gate
  if (!subscription || subscription.tier === 'free') {
    return <PremiumUpgradePrompt feature="Reports" />
  }

  return <ReportsClient subscriptionStatus={subscription} />
}
```

### Data Fetching Strategy

**Pattern:** Same as dashboard (Server initial + Client refetch)

**Queries:**
1. **Revenue Metrics** (static, longer cache):
   - Total revenue, invoice count, AOV, growth rate
   - Customer type breakdown
   - Buyback vs regular sales
   - Cache: 5 minutes stale, 30 minutes total

2. **Weekly/Monthly Breakdown** (paginated, shorter cache):
   - Period-based aggregations
   - Paginated tables
   - Cache: 2 minutes stale, 10 minutes total
   - `keepPreviousData: true` for smooth pagination

**React Query Configuration:**
```typescript
// lib/hooks/use-reports-data.ts
export function useRevenueMetrics(storeId, dateRange) {
  return useQuery({
    queryKey: ['reports', 'revenue', storeId, dateRange],
    queryFn: () => fetchRevenueMetrics(storeId, dateRange),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  })
}

export function useBreakdownData(view, page, dateRange) {
  return useQuery({
    queryKey: ['reports', 'breakdown', view, page, dateRange],
    queryFn: () => fetchBreakdown(view, page, dateRange),
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    keepPreviousData: true,
  })
}
```

---

## 2. Tab Structure & Components

### Overview Tab

**Purpose:** High-level business insights dengan visual analytics

**Components:**

1. **Summary Cards** (2x2 grid mobile, 4 columns desktop):
   - Total Revenue (period)
   - Invoice Count
   - Average Order Value
   - Growth Rate (vs previous period) dengan badge visual

2. **Revenue Trend Chart:**
   - Type: Line chart (Recharts)
   - Data: Daily revenue dalam current period
   - Mobile: Horizontal scroll untuk banyak data points
   - Height: 250px mobile, 300px desktop

3. **Customer Type Breakdown:**
   - Type: Donut chart
   - Categories: Distributor, Reseller, Customer
   - Shows: Count & percentage contribution

4. **Quick Stats:**
   - Buyback vs Regular sales ratio
   - Simple percentage display

**Layout:**
```
┌─────────────────────────────────────┐
│  [Total Revenue]  [Invoice Count]   │
│  [Avg Order]      [Growth Rate]     │
├─────────────────────────────────────┤
│  Revenue Trend Chart                │
│  (Line chart - scrollable)          │
├─────────────────────────────────────┤
│  Customer Type    │  Quick Stats    │
│  (Donut chart)    │  (Buyback %)    │
└─────────────────────────────────────┘
```

### Details Tab

**Purpose:** Detailed breakdown dengan drill-down capability

**Components:**

1. **Date Range Selector** (sticky top):
   - Quick filters: "This Month", "Last Month", "Last 3 Months", "Custom Range"
   - Mobile: Bottom sheet modal dengan calendar
   - Desktop: Inline dropdown

2. **View Toggle:**
   - Monthly View / Weekly View
   - Switches aggregation level

3. **Data Table:**
   - **Columns:**
     - Period (Week 1-4 atau Jan, Feb)
     - Invoice Count
     - Total Revenue
     - Avg per Invoice
     - Growth % (vs previous period)
   - **Features:**
     - Sortable columns
     - Tap row → drill-down to invoice list untuk period tersebut
     - Pagination jika > 12 periods

**Mobile Layout:**
Card-based instead of table:
```
┌─────────────────────────────────┐
│ January 2026          ↑ +15.7% │
├─────────────────────────────────┤
│ Revenue: Rp 125,000,000         │
│ Invoices: 45                    │
│ Avg: Rp 2,777,778               │
└─────────────────────────────────┘
```

### Comparison Tab

**Purpose:** Period-over-period analysis

**Components:**

1. **Period Selector:**
   - Options: "This Month vs Last Month", "This Week vs Last Week"
   - Future: Custom period comparison

2. **Comparison Cards:**
   - Side-by-side metrics
   - Revenue (+/- %)
   - Invoice Count (+/- %)
   - Avg Order Value (+/- %)
   - Visual indicators: Green ↑ for positive, Red ↓ for negative

3. **Comparison Chart:**
   - Type: Dual-bar chart atau overlapping lines
   - X-axis: Metrics
   - Y-axis: Values
   - Legend: "This Period" vs "Last Period"

4. **Key Insights Box:**
   - Auto-generated insight
   - Example: "Revenue increased 25% but invoice count decreased 10% → Higher average order value"

**Layout:**
```
┌─────────────────────────────────────┐
│  This Month vs Last Month           │
├─────────────────────────────────────┤
│  Revenue:   Rp 125M  vs  Rp 108M    │
│             +15.7% ↑                │
├─────────────────────────────────────┤
│  Comparison Chart (Dual Bar)        │
├─────────────────────────────────────┤
│  💡 Key Insight:                    │
│  Revenue up 15.7% driven by...      │
└─────────────────────────────────────┘
```

### Mobile Navigation

**Bottom Tab Bar (Sticky):**
```tsx
<div className="fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
  <nav className="flex justify-around py-2">
    <TabButton icon={<BarChart3 />} label="Overview" />
    <TabButton icon={<List />} label="Details" />
    <TabButton icon={<TrendingUp />} label="Compare" />
  </nav>
</div>
```

**Safe area handling:**
```css
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 3. Data Calculations & Metrics

### Revenue Calculations

**Total Revenue:**
```sql
SUM(invoices.total)
WHERE status = 'synced'
  AND invoice_date BETWEEN $start AND $end
  AND user_id = $user_id
  AND store_id = $store_id
```

**Growth Rate:**
```typescript
function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 100 // 100% growth from zero
  return ((current - previous) / previous) * 100
}
```

**Average Order Value:**
```typescript
function calculateAOV(totalRevenue: number, invoiceCount: number): number {
  return invoiceCount > 0 ? totalRevenue / invoiceCount : 0
}
```

### Customer Type Breakdown

**Query:**
```sql
SELECT
  customer_status,
  COUNT(*) as count,
  SUM(total) as revenue,
  (SUM(total) / (SELECT SUM(total) FROM invoices WHERE ...) * 100) as percentage
FROM invoices
WHERE status = 'synced'
  AND invoice_date BETWEEN $start AND $end
  AND user_id = $user_id
GROUP BY customer_status
```

**Types:**
- Distributor
- Reseller
- Customer

### Buyback Detection

**Logic:**
Invoice dikategorikan sebagai "buyback invoice" jika memiliki minimal 1 item dengan `is_buyback = true`

**Query:**
```sql
SELECT
  i.id,
  i.total,
  EXISTS(
    SELECT 1 FROM invoice_items ii
    WHERE ii.invoice_id = i.id AND ii.is_buyback = true
  ) as has_buyback
FROM invoices i
WHERE i.status = 'synced' AND i.user_id = $user_id
```

**Calculation:**
```typescript
const buybackRevenue = invoices
  .filter(inv => inv.has_buyback)
  .reduce((sum, inv) => sum + inv.total, 0)

const regularRevenue = totalRevenue - buybackRevenue
const buybackPercentage = (buybackRevenue / totalRevenue) * 100
```

### Period Breakdown

**Weekly Aggregation:**
```sql
SELECT
  DATE_TRUNC('week', invoice_date) as week_start,
  COUNT(*) as invoice_count,
  SUM(total) as revenue,
  AVG(total) as avg_order_value
FROM invoices
WHERE invoice_date >= $start_date
  AND status = 'synced'
  AND user_id = $user_id
GROUP BY week_start
ORDER BY week_start DESC
LIMIT 52 -- 1 year of weeks
```

**Monthly Aggregation:**
```sql
SELECT
  DATE_TRUNC('month', invoice_date) as period,
  COUNT(*) as invoice_count,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  -- Customer type counts
  COUNT(*) FILTER (WHERE customer_status = 'Distributor') as distributor_count,
  COUNT(*) FILTER (WHERE customer_status = 'Reseller') as reseller_count,
  COUNT(*) FILTER (WHERE customer_status = 'Customer') as customer_count,
  -- Revenue by type
  SUM(total) FILTER (WHERE customer_status = 'Distributor') as distributor_revenue,
  SUM(total) FILTER (WHERE customer_status = 'Reseller') as reseller_revenue,
  SUM(total) FILTER (WHERE customer_status = 'Customer') as customer_revenue
FROM invoices
WHERE user_id = $1
  AND store_id = $2
  AND status = 'synced'
  AND invoice_date >= $3
  AND invoice_date <= $4
GROUP BY period
ORDER BY period DESC
LIMIT 12 -- 1 year of months
```

### Smart Default Period Logic

**Business Rule:**
- If day of month ≤ 7: Show last month (current month still has little data)
- If day of month > 7: Show current month

**Implementation:**
```typescript
function getSmartDefaultPeriod(today: Date = new Date()): DateRange {
  const dayOfMonth = today.getDate()

  if (dayOfMonth <= 7) {
    // Early in month: show last month
    const lastMonth = subMonths(today, 1)
    return {
      start: startOfMonth(lastMonth),
      end: endOfMonth(lastMonth),
    }
  } else {
    // Mid-late month: show current month
    return {
      start: startOfMonth(today),
      end: endOfDay(today), // Up to today
    }
  }
}
```

---

## 4. Export Functionality

### Export Options

**User Flow:**
1. Tap/click "Export" button (FAB di mobile, inline button di desktop)
2. Modal muncul dengan options:
   - **Select Tab:** Overview, Details - Monthly, Details - Weekly, Comparison
   - **Date Range:** Pre-filled dengan current view, bisa adjust
   - **Format:** CSV atau Excel (.xlsx)
3. Click "Export Report" → File downloads

### Export Data Formats

#### Details Tab Export (CSV)

**Columns:**
```csv
Period,Invoice Count,Total Revenue (IDR),Avg per Invoice (IDR),Growth vs Previous (%)
January 2026,45,125000000,2777778,+15.5%
December 2025,39,108000000,2769231,+8.2%
November 2025,42,98000000,2333333,-5.0%
```

#### Overview Tab Export (CSV)

**Multi-section format:**
```csv
SUMMARY
Total Revenue,125000000
Invoice Count,45
Average Order Value,2777778
Period,Jan 1 - Jan 31 2026

CUSTOMER TYPE BREAKDOWN
Type,Invoice Count,Revenue (IDR),Percentage
Distributor,12,45000000,36%
Reseller,18,55000000,44%
Customer,15,25000000,20%

SALES TYPE
Type,Revenue (IDR),Percentage
Regular Sales,100000000,80%
Buyback Sales,25000000,20%
```

#### Comparison Tab Export (CSV)

```csv
Metric,Current Period,Previous Period,Change (%),Change (IDR)
Total Revenue,125000000,108000000,+15.7%,+17000000
Invoice Count,45,39,+15.4%,+6
Avg Order Value,2777778,2769231,+0.3%,+8547
```

### Implementation

**Libraries:**
- **CSV:** `papaparse` (~30KB gzipped) - lightweight
- **Excel:** `exceljs` (~200KB) - lazy loaded only when export clicked

**Client-Side Generation:**
All processing happens in browser (no server round-trip):
```typescript
import Papa from 'papaparse'

function generateCSV(data: ReportData[], type: 'monthly' | 'weekly') {
  const csv = Papa.unparse({
    fields: ['Period', 'Invoice Count', 'Total Revenue (IDR)', 'Avg per Invoice (IDR)', 'Growth vs Previous (%)'],
    data: data.map(row => [
      row.period,
      row.invoice_count,
      row.total_revenue,
      row.avg_order_value,
      `${row.growth > 0 ? '+' : ''}${row.growth.toFixed(1)}%`
    ])
  })

  downloadFile(csv, `Invow_Report_${type}_${dateRange}_${timestamp}.csv`)
}
```

**File Naming Convention:**
```
Invow_Report_[TabName]_[DateRange]_[Timestamp].csv

Examples:
- Invow_Report_Monthly_Jan2026_20260115_143022.csv
- Invow_Report_Overview_Q4-2025_20260115_143022.xlsx
- Invow_Report_Comparison_ThisVsLast_20260115_143022.csv
```

### Security & Rate Limiting

**Cooldown:**
```typescript
const [lastExport, setLastExport] = useState<number>(0)

function handleExport() {
  const now = Date.now()
  if (now - lastExport < 5000) { // 5 second cooldown
    toast.error('Please wait before exporting again')
    return
  }

  setLastExport(now)
  performExport()
}
```

**Data Sanitization:**
```typescript
function sanitizeExportData(data: ReportData[]) {
  return data.map(row => ({
    ...row,
    user_id: undefined, // Remove sensitive fields
    customer_email: undefined, // Optional: protect customer privacy
    revenue: Number(row.revenue), // Format as number for Excel
  }))
}
```

---

## 5. Database Optimization

### Required Indexes

```sql
-- Index untuk filtering by date dan status
CREATE INDEX idx_invoices_date_status
ON invoices(invoice_date DESC, status)
WHERE status = 'synced';

-- Index untuk customer type analysis
CREATE INDEX idx_invoices_customer_status
ON invoices(customer_status, invoice_date)
WHERE status = 'synced';

-- Composite index untuk store-specific reports
CREATE INDEX idx_invoices_store_date
ON invoices(store_id, invoice_date DESC, status);
```

### Query Optimization

**Single Query Approach:**
Fetch all needed metrics dalam satu query untuk minimize round-trips

**Aggregation Query:**
```sql
-- lib/db/services/reports.service.ts
export async function fetchMonthlyBreakdown(
  userId: string,
  storeId: string,
  startDate: string,
  endDate: string
) {
  return supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .eq('status', 'synced')
    .gte('invoice_date', startDate)
    .lte('invoice_date', endDate)
    .order('invoice_date', { ascending: false })
}
```

**Post-Processing:**
Aggregate di client-side menggunakan JavaScript (lebih flexible untuk complex calculations)

### Performance Targets

- **Initial page load:** < 2s (with skeleton)
- **Tab switch:** < 300ms (cached data)
- **Chart render:** < 500ms
- **Export generation:** < 3s for 1 year data
- **Query execution:** < 1s for aggregations

---

## 6. Mobile UX & Interactions

### Responsive Layout

**Mobile (< 768px):**
- Bottom tab navigation (sticky)
- Single column layout
- Cards instead of tables
- Horizontal scroll untuk charts
- FAB untuk export button

**Desktop (≥ 768px):**
- Top/side tab navigation
- Multi-column grid
- Full data tables
- Larger charts
- Inline export button

### Touch Interactions

**Summary Cards:**
- Tap → subtle scale animation (transform: scale(0.98))
- Long press → detailed tooltip dengan breakdown
- Swipeable carousel di mobile

**Charts:**
- Touch-friendly tooltips (44px minimum hit area)
- Tap legend → toggle series visibility
- Horizontal scroll untuk line charts dengan banyak data points
- Optional: Pinch-to-zoom (advanced feature)

**Tables/Cards:**
- Tap row → drill-down to invoice list untuk period
- Swipe row → quick actions (future: share, bookmark)

### Pull-to-Refresh

**Implementation:**
```typescript
import { useGesture } from 'react-use-gesture'

function ReportsClient() {
  const bind = useGesture({
    onDrag: ({ movement: [, my], last }) => {
      if (my > 100 && last) {
        refetchData()
      }
    }
  })

  return <div {...bind()}>...</div>
}
```

**Visual Feedback:**
- Pull indicator dengan loading spinner
- Native feel untuk better UX

### Date Range Selector

**Mobile:**
Bottom sheet modal dengan:
- Quick filters (chips): This Month, Last Month, Last 3 Months, Custom
- Calendar picker (saat Custom selected)
- Apply/Cancel buttons

**Desktop:**
Inline dropdown dengan date picker

---

## 7. Chart Implementation

### Library: Recharts

**Why Recharts:**
- Declarative React components
- Responsive out-of-box
- Reasonable bundle size (~60KB gzipped)
- Good mobile support

**Lazy Loading:**
```typescript
const RevenueChart = lazy(() => import('./revenue-chart'))

// In component
<Suspense fallback={<ChartSkeleton />}>
  <RevenueChart data={data} />
</Suspense>
```

### Chart Types

#### 1. Revenue Trend Line Chart

**Component:**
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'dd MMM')}
          fontSize={11}
        />
        <YAxis
          tickFormatter={(value) => formatCurrency(value, 'compact')}
          fontSize={11}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#FFB300"
          strokeWidth={2}
          dot={false} // Cleaner look on mobile
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

#### 2. Customer Type Donut Chart

```tsx
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts'

const COLORS = {
  Distributor: '#3B82F6',
  Reseller: '#10B981',
  Customer: '#F59E0B',
}

export function CustomerBreakdownChart({ data }: { data: CustomerTypeData[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="revenue"
          label={({ percentage }) => `${percentage.toFixed(0)}%`}
        >
          {data.map((entry) => (
            <Cell key={entry.type} fill={COLORS[entry.type]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value)} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

#### 3. Comparison Dual-Bar Chart

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

export function ComparisonChart({ data }: { data: ComparisonData[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <XAxis dataKey="metric" fontSize={11} />
        <YAxis tickFormatter={(value) => formatCurrency(value, 'compact')} fontSize={11} />
        <Tooltip />
        <Legend />
        <Bar dataKey="current" fill="#FFB300" name="This Period" />
        <Bar dataKey="previous" fill="#9CA3AF" name="Last Period" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Color Palette

**Primary Colors:**
- Brand Primary: `#FFB300` (amber)
- Success/Growth: `#10B981` (green)
- Danger/Decline: `#EF4444` (red)
- Neutral: `#9CA3AF` (gray)

**Customer Types:**
- Distributor: `#3B82F6` (blue)
- Reseller: `#10B981` (green)
- Customer: `#F59E0B` (amber)

### Mobile Optimization

**Responsive Heights:**
```typescript
const chartHeight = {
  mobile: 250,
  desktop: 300,
}

const fontSize = {
  mobile: 11,
  desktop: 12,
}
```

**Horizontal Scroll:**
```tsx
<div className="overflow-x-auto">
  <div style={{ minWidth: '600px' }}>
    <LineChart width={600} height={250}>
      ...
    </LineChart>
  </div>
</div>
```

---

## 8. Security & Access Control

### Layer 1: Route Protection

**Middleware Check (page.tsx):**
```typescript
// Check authentication
if (!user) redirect('/dashboard/login')

// Check subscription tier
const subscription = await getSubscription(user.id)
if (subscription.tier === 'free') {
  return <PremiumUpgradePrompt />
}
```

### Layer 2: Row Level Security

**Existing RLS policies cover reports:**
```sql
-- Users can only query their own invoices
CREATE POLICY "Users can view own invoices"
ON invoices FOR SELECT
USING (auth.uid() = user_id AND status = 'synced');
```

**All queries MUST include:**
```typescript
.eq('user_id', user.id)
.eq('store_id', activeStoreId)
.eq('status', 'synced') // Never expose drafts in reports
```

### Layer 3: Export Security

**Client-Side Generation:**
- No data sent to external services
- All processing in browser
- File generated using Blob API

**Data Sanitization:**
```typescript
function sanitizeExportData(data: ReportData[]) {
  return data.map(row => ({
    period: row.period,
    invoice_count: row.invoice_count,
    total_revenue: Number(row.total_revenue),
    avg_order_value: Number(row.avg_order_value),
    growth_rate: row.growth_rate,
    // Remove sensitive fields
    user_id: undefined,
    store_id: undefined,
  }))
}
```

**Rate Limiting:**
- 5 second cooldown between exports
- Prevents abuse & excessive client processing

**Subscription Re-validation:**
```typescript
async function handleExport() {
  // Double-check premium access (prevent client manipulation)
  const isValid = await validatePremiumAccess()
  if (!isValid) {
    showUpgradeModal()
    return
  }

  generateExport()
}
```

### Layer 4: Error Logging

**Privacy-Safe Logging:**
```typescript
function logReportError(error: Error, context: string) {
  console.error({
    error: error.message,
    context,
    timestamp: new Date().toISOString(),
    // NO user_id, NO revenue amounts, NO customer data
  })
}
```

---

## 9. Testing Strategy

### Unit Tests

**Calculations:**
```typescript
// __tests__/reports/calculations.test.ts
describe('Revenue Calculations', () => {
  it('calculates growth rate correctly', () => {
    expect(calculateGrowthRate(125000000, 108000000)).toBeCloseTo(15.7, 1)
  })

  it('handles zero previous period', () => {
    expect(calculateGrowthRate(100000, 0)).toBe(100)
  })

  it('calculates customer type breakdown percentages', () => {
    const breakdown = calculateCustomerTypeBreakdown(mockInvoices)
    expect(breakdown.Distributor.percentage).toBe(36)
  })
})
```

**Smart Default Period:**
```typescript
describe('Smart Default Period', () => {
  it('returns last month when day <= 7', () => {
    const range = getSmartDefaultPeriod(new Date('2026-01-05'))
    expect(range.start).toBe('2025-12-01')
  })

  it('returns current month when day > 7', () => {
    const range = getSmartDefaultPeriod(new Date('2026-01-15'))
    expect(range.start).toBe('2026-01-01')
  })
})
```

### Integration Tests

**Data Fetching:**
```typescript
describe('Reports Data Fetching', () => {
  it('fetches revenue metrics with correct filters', async () => {
    const { result } = renderHook(() => useRevenueMetrics(storeId, dateRange))

    await waitFor(() => {
      expect(result.current.data.totalRevenue).toBeGreaterThan(0)
    })
  })
})
```

### Component Tests

**Tab Navigation:**
```typescript
describe('ReportsClient', () => {
  it('switches tabs correctly', () => {
    render(<ReportsClient subscriptionStatus={mockPremium} />)
    fireEvent.click(screen.getByText('Details'))
    expect(screen.getByText('Monthly View')).toBeInTheDocument()
  })
})
```

**Export:**
```typescript
describe('Export Functionality', () => {
  it('generates CSV with correct format', async () => {
    const csv = await generateCSV(mockData, 'monthly')
    expect(csv).toContain('Period, Invoice Count, Total Revenue')
  })

  it('enforces cooldown', async () => {
    render(<ExportButton />)
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('Export')) // Second click
    expect(toast.error).toHaveBeenCalledWith(/wait/i)
  })
})
```

### E2E Tests (Playwright)

```typescript
test('Premium user can access reports and export', async ({ page }) => {
  await loginAsPremium(page)
  await page.goto('/dashboard/reports')

  await expect(page.locator('h1')).toContainText('Reports')

  // Switch tabs
  await page.click('text=Details')
  await expect(page.locator('text=Monthly View')).toBeVisible()

  // Export
  await page.click('text=Export')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Export Report')
  ])

  expect(download.suggestedFilename()).toContain('Invow_Report')
})
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('loads within 2 seconds', async () => {
    const start = performance.now()
    render(<ReportsClient />)
    await waitFor(() => {
      expect(screen.getByText(/Total Revenue/i)).toBeInTheDocument()
    })
    expect(performance.now() - start).toBeLessThan(2000)
  })
})
```

---

## 10. Implementation Plan

### Phase 1: Foundation (Week 1)

**Tasks:**
- [ ] Add database indexes
- [ ] Create `lib/db/services/reports.service.ts`
- [ ] Create `lib/utils/reports.ts` (calculations)
- [ ] Create `lib/types/reports.ts`
- [ ] Setup route: `app/dashboard/reports/page.tsx`
- [ ] Create `PremiumUpgradePrompt` component
- [ ] Test subscription gate

### Phase 2: Core Features (Week 2)

**Tasks:**
- [ ] Create Overview Tab components:
  - [ ] Summary cards
  - [ ] Revenue trend chart (Recharts lazy load)
  - [ ] Customer type donut chart
- [ ] Implement smart default period logic
- [ ] Setup React Query hooks:
  - [ ] `useRevenueMetrics`
  - [ ] `useBreakdownData`
- [ ] Mobile-first responsive layout
- [ ] Bottom tab navigation

### Phase 3: Details & Comparison (Week 3)

**Tasks:**
- [ ] Details Tab:
  - [ ] Date range selector
  - [ ] Monthly/Weekly toggle
  - [ ] Responsive table (desktop) / cards (mobile)
  - [ ] Drill-down to invoice list
- [ ] Comparison Tab:
  - [ ] Period selector
  - [ ] Side-by-side metrics
  - [ ] Comparison chart
  - [ ] Growth indicators

### Phase 4: Export & Polish (Week 4)

**Tasks:**
- [ ] Export functionality:
  - [ ] Export modal
  - [ ] CSV generation (papaparse)
  - [ ] Excel generation (exceljs, lazy loaded)
  - [ ] Cooldown mechanism
- [ ] Loading states & skeletons
- [ ] Error handling & empty states
- [ ] Pull-to-refresh (mobile)

### Phase 5: Testing & Optimization (Week 5)

**Tasks:**
- [ ] Write unit tests (calculations, utilities)
- [ ] Write component tests
- [ ] Write E2E tests
- [ ] Performance optimization:
  - [ ] Bundle size analysis
  - [ ] Query optimization
  - [ ] Chart rendering performance
- [ ] Accessibility audit (axe, keyboard navigation)

---

## 11. Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "papaparse": "^5.4.1",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

**Bundle Impact:**
- Recharts: ~60KB gzipped (lazy loaded)
- Papaparse: ~30KB gzipped
- ExcelJS: ~200KB (lazy loaded only on export)
- Total initial: ~30KB (papaparse only)

---

## 12. Rollout Strategy

### Beta Testing

**Target:** Premium users only (already gated by subscription)

**Analytics to Track:**
- Most used tab (Overview vs Details vs Comparison)
- Export frequency & preferred format (CSV vs Excel)
- Date range preferences (current month vs custom)
- Chart interaction (hover, legend clicks)
- Mobile vs desktop usage ratio

### Success Metrics

**Business Metrics:**
- Premium conversion rate: +10% target
- User engagement: 60% of premium users access reports monthly
- Feature retention: 80% of users return to reports within 30 days

**Technical Metrics:**
- Page load time: < 2s (95th percentile)
- Chart render time: < 500ms
- Export success rate: > 95%
- Mobile usage: 70%+ (maintain good UX)

### Marketing

**Positioning:**
- Highlight reports as premium feature in pricing page
- Add "Business Reports" badge to premium tier
- Create demo video showing reports in action
- Email campaign to free users: "Unlock insights with Premium"

---

## 13. Future Enhancements (Post-MVP)

**Phase 2 Features:**
- [ ] Custom date ranges (arbitrary start/end)
- [ ] Email reports (scheduled weekly/monthly PDF)
- [ ] Multi-store comparison (for users with multiple stores)
- [ ] Forecasting (revenue predictions based on historical data)
- [ ] Customer insights tab (top customers, retention)
- [ ] Product insights (best selling items, inventory recommendations)
- [ ] Print-friendly view
- [ ] Shareable report links (with expiry)

**Advanced Analytics:**
- Cohort analysis
- Churn prediction
- Seasonal trends detection
- Anomaly detection (revenue drops/spikes)

---

## 14. Constraints & Assumptions

### Constraints

1. **Premium-only:** Feature is subscription-gated (no free tier access)
2. **1 year limit:** Historical data capped at 12 months
3. **Synced invoices only:** Draft/pending invoices excluded from reports
4. **Single store:** Reports scoped to active store (future: multi-store)
5. **Mobile-first:** Design prioritizes mobile UX (70%+ traffic)

### Assumptions

1. **Data volume:** Most users have < 500 invoices/year (queries remain fast)
2. **Export usage:** ~30% of report viewers will export data
3. **Tab preference:** Overview tab will be most used (~60% of views)
4. **Mobile context:** Users check reports on-the-go (quick insights > deep analysis)
5. **Upgrade motivation:** Reports feature will drive +10% premium conversions

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large dataset slows queries | High | Add pagination, implement data limits (1 year max) |
| Export fails on slow devices | Medium | Show loading indicator, add timeout warning |
| Low adoption rate | High | Promote feature via email, in-app banners, onboarding |
| Mobile chart rendering issues | Medium | Extensive mobile testing, fallback to table view |
| Premium churn after launch | High | Monitor engagement, iterate based on feedback |

---

## 15. Appendix

### File Structure

```
app/dashboard/reports/
├── page.tsx
├── reports-client.tsx
└── components/
    ├── overview-tab.tsx
    ├── details-tab.tsx
    ├── comparison-tab.tsx
    ├── summary-card.tsx
    ├── revenue-chart.tsx
    ├── customer-breakdown-chart.tsx
    ├── comparison-chart.tsx
    ├── export-modal.tsx
    ├── date-range-selector.tsx
    └── premium-gate.tsx

lib/
├── db/services/reports.service.ts
├── utils/
│   ├── reports.ts
│   └── export.ts
├── types/reports.ts
└── hooks/use-reports-data.ts

components/skeletons/
└── reports-skeleton.tsx

__tests__/reports/
├── calculations.test.ts
├── data-fetching.test.ts
├── export.test.ts
└── components.test.tsx
```

### Key TypeScript Types

```typescript
// lib/types/reports.ts

export interface RevenueMetrics {
  totalRevenue: number
  invoiceCount: number
  avgOrderValue: number
  growthRate: number
  period: DateRange
}

export interface CustomerTypeBreakdown {
  type: 'Distributor' | 'Reseller' | 'Customer'
  count: number
  revenue: number
  percentage: number
}

export interface PeriodBreakdown {
  period: string // "2026-01" or "2026-W01"
  invoiceCount: number
  totalRevenue: number
  avgOrderValue: number
  growthRate: number
}

export interface ComparisonData {
  metric: string
  current: number
  previous: number
  change: number
  changePercentage: number
}

export interface DateRange {
  start: string // ISO date
  end: string
}

export interface ExportOptions {
  tab: 'overview' | 'details-monthly' | 'details-weekly' | 'comparison'
  dateRange: DateRange
  format: 'csv' | 'xlsx'
}
```

---

## Document Control

**Version:** 1.0
**Author:** Claude (Brainstorming Skill)
**Last Updated:** January 1, 2026
**Status:** Ready for Implementation

**Change Log:**
- 2026-01-01: Initial design document created

**Approval:**
- [ ] Product Owner
- [ ] Tech Lead
- [ ] UX Designer

**Next Steps:**
1. Review & approval dari stakeholders
2. Setup git worktree untuk isolated development
3. Create implementation plan dengan detailed tasks
4. Begin Phase 1 development
