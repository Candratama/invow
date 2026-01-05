# Dashboard, Customers & Report Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove Net Profit Card, add status filter & pagination to Customers, add Top 5 tables by status in Overview Report.

**Architecture:**
- Task 1: Simple UI removal in financial-cards.tsx
- Task 2: Client-side filtering & pagination in customers-client.tsx
- Task 3: Modify report data access to group topCustomers by status, update UI to show 3 tables

**Tech Stack:** React, TypeScript, TanStack Query, Supabase, shadcn/ui

---

## Task 1: Remove Net Profit Card from Dashboard

**Files:**
- Modify: `components/features/dashboard/financial-cards.tsx:145-194` (remove NetProfitCard)
- Modify: `components/features/dashboard/financial-cards.tsx:257-261` (remove from grid)
- Modify: `components/features/dashboard/financial-cards.tsx:265-269` (update scroll indicators)

**Step 1: Remove NetProfitCard component**

Delete lines 145-194 (the entire `NetProfitCard` function).

**Step 2: Remove NetProfitCard from grid**

In `FinancialCards` component, remove:
```tsx
<NetProfitCard
  metrics={metrics}
  isPremium={isPremium}
  isVisible={isVisible}
/>
```

**Step 3: Update scroll indicators (mobile)**

Change from 3 dots to 2 dots:
```tsx
{/* Scroll indicators - mobile only */}
<div className="flex justify-center gap-2 mt-4 lg:hidden">
  <div className="w-2 h-2 rounded-full bg-primary" />
  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
</div>
```

**Step 4: Update loading skeleton**

Change `[1, 2, 3].map` to `[1, 2].map` in loading state.

**Step 5: Remove unused import**

Remove `DollarSign` from lucide-react imports (line 9).

**Step 6: Verify build**

Run: `npm run build`
Expected: No errors

**Step 7: Commit**

```bash
git add components/features/dashboard/financial-cards.tsx
git commit -m "feat(dashboard): remove Net Profit Card"
```

---

## Task 2: Add Status Filter & Pagination to Customers Page

**Files:**
- Modify: `app/dashboard/customers/customers-client.tsx`

### Step 1: Add state for status filter and pagination

Add after line 44 (after `deletingId` state):

```tsx
const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
  new Set(['Customer', 'Reseller', 'Distributor'])
);
const [currentPage, setCurrentPage] = useState(1);
const [pageSize, setPageSize] = useState(10);
```

### Step 2: Update filteredCustomers to include status filter

Replace the `filteredCustomers` useMemo (lines 95-106):

```tsx
const filteredCustomers = useMemo(() => {
  if (!customers) return [];

  let result = customers;

  // Filter by status
  result = result.filter((c) => selectedStatuses.has(c.status));

  // Filter by search query
  if (debouncedQuery.trim()) {
    const query = debouncedQuery.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.address.toLowerCase().includes(query)
    );
  }

  return result;
}, [customers, debouncedQuery, selectedStatuses]);
```

### Step 3: Add paginated customers memo

Add after `filteredCustomers`:

```tsx
const paginatedCustomers = useMemo(() => {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return filteredCustomers.slice(start, end);
}, [filteredCustomers, currentPage, pageSize]);

const totalPages = Math.ceil(filteredCustomers.length / pageSize);
```

### Step 4: Reset page when filters change

Add useEffect after the pagination memo:

```tsx
useEffect(() => {
  setCurrentPage(1);
}, [debouncedQuery, selectedStatuses]);
```

### Step 5: Add status toggle handler

Add after `handleBack`:

```tsx
const handleStatusToggle = useCallback((status: string) => {
  setSelectedStatuses((prev) => {
    const next = new Set(prev);
    if (next.has(status)) {
      // Don't allow deselecting if it's the last one
      if (next.size > 1) {
        next.delete(status);
      }
    } else {
      next.add(status);
    }
    return next;
  });
}, []);
```

### Step 6: Add StatusFilter component

Add before the main return, after error handling:

```tsx
const StatusFilter = () => (
  <div className="grid grid-cols-3 gap-2">
    {(['Customer', 'Reseller', 'Distributor'] as const).map((status) => (
      <Button
        key={status}
        variant={selectedStatuses.has(status) ? 'default' : 'outline'}
        size="sm"
        className="w-full text-xs h-9"
        onClick={() => handleStatusToggle(status)}
      >
        {status}
      </Button>
    ))}
  </div>
);
```

### Step 7: Add Pagination component

Add after StatusFilter:

```tsx
const Pagination = () => {
  if (filteredCustomers.length === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, filteredCustomers.length);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {start}-{end} of {filteredCustomers.length}
      </div>
      <div className="flex items-center gap-4">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </Button>
          <span className="px-3 text-sm">
            {currentPage} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            &gt;
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### Step 8: Add StatusFilter to UI

Insert after the Search Bar div (after line 296), before Customer List:

```tsx
{/* Status Filter */}
<div className="flex-shrink-0 bg-white border-b">
  <div className="max-w-4xl mx-auto px-4 lg:px-6 py-3">
    <StatusFilter />
  </div>
</div>
```

### Step 9: Update CustomerList to use paginatedCustomers

Change line 301-306:
```tsx
<CustomerList
  customers={paginatedCustomers}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isDeleting={deletingId || undefined}
/>
```

### Step 10: Add Pagination to UI

Insert after CustomerList closing div (after line 308):

```tsx
<div className="max-w-4xl mx-auto px-4 lg:px-6">
  <Pagination />
</div>
```

### Step 11: Verify build

Run: `npm run build`
Expected: No errors

### Step 12: Commit

```bash
git add app/dashboard/customers/customers-client.tsx
git commit -m "feat(customers): add status filter and pagination"
```

---

## Task 3: Add Top 5 Tables by Status in Overview Report

**Files:**
- Modify: `lib/types/report.ts` (add TopCustomersByStatus type)
- Modify: `lib/db/data-access/report.ts` (update getReportOverviewData)
- Modify: `app/dashboard/report/components/overview-tab.tsx` (render 3 tables)

### Step 1: Update report types

Add to `lib/types/report.ts` after TopCustomer interface (line 43):

```typescript
export interface TopCustomersByStatus {
  customer: TopCustomer[];
  reseller: TopCustomer[];
  distributor: TopCustomer[];
}
```

Update `ReportOverviewData` (lines 65-69):

```typescript
export interface ReportOverviewData {
  summary: ReportSummary;
  revenueChart: RevenueDataPoint[];
  topCustomers: TopCustomer[];  // Keep for backward compat
  topCustomersByStatus: TopCustomersByStatus;
}
```

### Step 2: Update data access to fetch customer status

In `lib/db/data-access/report.ts`, update the query (lines 60-78) to join with customers table:

```typescript
// Fetch invoices in date range with their items
const { data: invoices } = await supabase
  .from('invoices')
  .select(`
    id,
    invoice_number,
    customer_id,
    customer_name,
    total,
    invoice_date,
    invoice_items (
      id,
      is_buyback,
      subtotal,
      total
    )
  `)
  .eq('store_id', store.id)
  .gte('invoice_date', dateRange.from)
  .lte('invoice_date', dateRange.to)
  .order('invoice_date', { ascending: true })

// Fetch customer statuses
const customerIds = [...new Set(invoices?.map(inv => inv.customer_id).filter(Boolean) || [])]
const { data: customerData } = customerIds.length > 0
  ? await supabase
      .from('customers')
      .select('id, status')
      .in('id', customerIds)
  : { data: [] }

const customerStatusMap = new Map(
  (customerData || []).map(c => [c.id, c.status])
)
```

### Step 3: Update customer tracking to include status

Replace the customerTotals Map definition (line 100):

```typescript
const customerTotals: Map<string, {
  id: string;
  name: string;
  total: number;
  count: number;
  status: string;
}> = new Map()
```

Update the tracking logic inside invoices.forEach (lines 124-133):

```typescript
// Track customer totals for top customers
const customerId = invoice.customer_id || invoice.customer_name
const status = invoice.customer_id
  ? (customerStatusMap.get(invoice.customer_id) || 'Customer')
  : 'Customer'

const existing = customerTotals.get(customerId) || {
  id: customerId,
  name: invoice.customer_name,
  total: 0,
  count: 0,
  status
}
customerTotals.set(customerId, {
  ...existing,
  total: existing.total + invoice.total,
  count: existing.count + 1
})
```

### Step 4: Build topCustomersByStatus

Replace topCustomers calculation (lines 166-175):

```typescript
// Get top 5 customers by total value (all)
const allCustomers = Array.from(customerTotals.values())
  .sort((a, b) => b.total - a.total)

const topCustomers: TopCustomer[] = allCustomers
  .slice(0, 5)
  .map((customer) => ({
    id: customer.id,
    name: customer.name,
    invoiceCount: customer.count,
    totalValue: customer.total
  }))

// Group by status
const getTop5ByStatus = (status: string): TopCustomer[] =>
  allCustomers
    .filter(c => c.status === status)
    .slice(0, 5)
    .map((customer) => ({
      id: customer.id,
      name: customer.name,
      invoiceCount: customer.count,
      totalValue: customer.total
    }))

const topCustomersByStatus: TopCustomersByStatus = {
  customer: getTop5ByStatus('Customer'),
  reseller: getTop5ByStatus('Reseller'),
  distributor: getTop5ByStatus('Distributor')
}
```

### Step 5: Update return statement

Update return (lines 177-181):

```typescript
return {
  summary,
  revenueChart,
  topCustomers,
  topCustomersByStatus
}
```

Also update empty data returns (lines 46-56 and 80-92) to include:
```typescript
topCustomersByStatus: {
  customer: [],
  reseller: [],
  distributor: []
}
```

### Step 6: Update OverviewTab to show 3 tables

In `app/dashboard/report/components/overview-tab.tsx`, update destructuring (line 54):

```tsx
const { summary, revenueChart, topCustomersByStatus } = data
```

### Step 7: Create TopCustomersTable component

Add after formatCompactCurrency function (after line 37):

```tsx
interface TopCustomersTableProps {
  title: string;
  customers: TopCustomer[];
}

function TopCustomersTable({ title, customers }: TopCustomersTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Belum ada data
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 font-medium text-gray-700 w-8">
                  #
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-700">
                  Nama
                </th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 w-20">
                  Transaksi
                </th>
                <th className="text-right py-2 px-2 font-medium text-gray-700">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id} className="border-b last:border-0">
                  <td className="py-2 px-2 text-gray-500">{index + 1}</td>
                  <td className="py-2 px-2 text-gray-900">{customer.name}</td>
                  <td className="py-2 px-2 text-center text-gray-600">
                    {customer.invoiceCount}x
                  </td>
                  <td className="py-2 px-2 text-right text-gray-900 font-medium">
                    {formatCurrency(customer.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 8: Replace old top customers table

Replace lines 102-141 (the old Top Customers Table section):

```tsx
{/* Top Customers Tables by Status */}
<div className="space-y-4">
  <TopCustomersTable
    title="Top 5 Customer"
    customers={topCustomersByStatus.customer}
  />
  <TopCustomersTable
    title="Top 5 Reseller"
    customers={topCustomersByStatus.reseller}
  />
  <TopCustomersTable
    title="Top 5 Distributor"
    customers={topCustomersByStatus.distributor}
  />
</div>
```

### Step 9: Add TopCustomer import

Add to the imports from report types (line 8):

```tsx
import type { DateRange, TopCustomer } from '@/lib/types/report'
```

### Step 10: Update skeleton

In `OverviewTabSkeleton`, replace the single table skeleton (lines 169-185) with:

```tsx
{/* Top Customers Tables Skeleton */}
<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <Card key={i}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="flex justify-between">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

### Step 11: Verify build

Run: `npm run build`
Expected: No errors

### Step 12: Commit

```bash
git add lib/types/report.ts lib/db/data-access/report.ts app/dashboard/report/components/overview-tab.tsx
git commit -m "feat(report): add Top 5 tables by customer status"
```

---

## Final: Verify All Changes

**Step 1: Run full build**

Run: `npm run build`
Expected: No errors

**Step 2: Test manually**

1. Dashboard - verify Net Profit Card is gone, only 2 cards visible
2. Customers page - test status filter (multi-select), pagination
3. Report Overview - verify 3 tables (Customer, Reseller, Distributor)

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: dashboard, customers & report improvements

- Remove Net Profit Card from dashboard
- Add multi-select status filter to Customers page
- Add pagination with 10/25/50 options to Customers page
- Add Top 5 tables by status (Customer/Reseller/Distributor) to Overview Report"
```
