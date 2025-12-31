# Revenue Card Buyback Separation Design

**Date:** 2025-12-31
**Status:** Approved for Implementation
**Context:** Separate buyback expenses from sales revenue for accurate financial tracking

---

## Problem Statement

Current revenue card treats buyback invoices as revenue, which is incorrect:
- **Regular invoices**: User sells items → receives money → REVENUE (+)
- **Buyback invoices**: User buys items (gold) → pays money → EXPENSE (-)
- Both stored in same `invoices` table with `is_buyback` flag
- Current `calculateRevenueMetrics()` sums all invoice totals regardless of type

**Impact:** Inflated revenue numbers, inaccurate profit tracking, misleading business metrics.

---

## Design Decisions

### 1. Display Strategy: Separate Cards ✅
Three distinct cards for clear financial tracking:
1. **Sales Revenue Card** (Green) - Regular invoice revenue
2. **Buyback Expenses Card** (Amber) - Buyback invoice expenses
3. **Net Profit Card** (Blue/Purple) - Calculated profit

**Rationale:** Clear separation of revenue streams, easier to understand financial health.

### 2. Layout: Horizontal Scroll (Mobile) + Grid (Desktop) ✅
- **Mobile**: Horizontal scroll with snap points, swipe between cards
- **Desktop**: 3-column grid, all visible at once
- **Min-width**: 280px per card for consistency

**Rationale:** Optimal use of screen real estate, familiar mobile UX pattern.

### 3. Calculation: Filter by `is_buyback` Flag ✅
Use existing `is_buyback` field without new migrations:
- Sales: `WHERE is_buyback = false OR is_buyback IS NULL`
- Buyback: `WHERE is_buyback = true`
- Transaction type computed at runtime

**Rationale:** No database changes needed, production-safe, backward compatible.

### 4. Net Profit: Include All Costs ✅
```
Net Profit = Sales Revenue - Buyback Expenses - Shipping Costs
```
- Shipping costs from both invoice types counted as expenses
- Profit margin = (Net Profit / Sales Revenue) × 100

**Rationale:** Accurate profit calculation including operational costs.

---

## Data Model

### New Interface: FinancialMetrics

```typescript
export interface FinancialMetrics {
  // Sales (Regular Invoices - is_buyback = false/null)
  sales: {
    totalRevenue: number;
    monthlyRevenue: number;
    invoiceCount: number;
    monthlyInvoiceCount: number;
    averageOrderValue: number;
  };

  // Buyback (Buyback Invoices - is_buyback = true)
  buyback: {
    totalExpenses: number;
    monthlyExpenses: number;
    invoiceCount: number;
    monthlyInvoiceCount: number;
    averageExpense: number;
  };

  // Other Costs (from all invoices)
  costs: {
    totalShippingCost: number;
    monthlyShippingCost: number;
  };

  // Net Profit (calculated)
  profit: {
    totalNetProfit: number;      // sales - buyback - shipping
    monthlyNetProfit: number;    // monthly calculation
    profitMargin: number;        // (netProfit / revenue) * 100
  };
}
```

---

## UI Components

### Card 1: Sales Revenue Card
```typescript
<div className="min-w-[280px] snap-center">
  <div className="bg-green-600 text-white rounded-lg p-6 shadow-lg">
    <TrendingUp className="w-8 h-8 mb-3" />
    <p className="text-sm opacity-90">Sales Revenue</p>
    <h3 className="text-3xl font-bold">
      {formatCurrency(sales.monthlyRevenue)}
    </h3>
    <p className="text-sm mt-1">
      {sales.monthlyInvoiceCount} invoices this month
    </p>

    <div className="border-t border-white/20 pt-3 mt-4">
      <div className="flex justify-between text-sm">
        <span className="opacity-80">Total Revenue</span>
        <span>{formatCurrency(sales.totalRevenue)}</span>
      </div>
    </div>
  </div>
</div>
```

**Features:**
- Green theme (positive/revenue indicator)
- TrendingUp icon
- Monthly revenue prominent
- Total revenue in footer
- Invoice count for context

### Card 2: Buyback Expenses Card
```typescript
<div className="min-w-[280px] snap-center">
  <div className="bg-amber-600 text-white rounded-lg p-6 shadow-lg">
    <ShoppingCart className="w-8 h-8 mb-3" />
    <p className="text-sm opacity-90">Buyback Expenses</p>
    <h3 className="text-3xl font-bold">
      {formatCurrency(buyback.monthlyExpenses)}
    </h3>
    <p className="text-sm mt-1">
      {buyback.monthlyInvoiceCount} purchases this month
    </p>

    <div className="border-t border-white/20 pt-3 mt-4">
      <div className="flex justify-between text-sm">
        <span className="opacity-80">Total Expenses</span>
        <span>{formatCurrency(buyback.totalExpenses)}</span>
      </div>
    </div>
  </div>
</div>
```

**Features:**
- Amber theme (warning/expense indicator)
- ShoppingCart icon
- Monthly expenses prominent
- Total expenses in footer
- Purchase count instead of "invoices"

### Card 3: Net Profit Card
```typescript
<div className="min-w-[280px] snap-center">
  <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-lg p-6 shadow-lg">
    <DollarSign className="w-8 h-8 mb-3" />
    <p className="text-sm opacity-90">Net Profit</p>
    <h3 className="text-3xl font-bold">
      {formatCurrency(profit.monthlyNetProfit)}
    </h3>
    <p className="text-sm mt-1">
      {profit.profitMargin.toFixed(1)}% margin this month
    </p>

    <div className="border-t border-white/20 pt-3 mt-4">
      <div className="flex justify-between text-sm">
        <span className="opacity-80">Total Profit</span>
        <span>{formatCurrency(profit.totalNetProfit)}</span>
      </div>
    </div>
  </div>
</div>
```

**Features:**
- Gradient theme (featured card)
- DollarSign icon
- Monthly net profit prominent
- Profit margin percentage
- Total profit in footer

### Container Layout
```typescript
<div className="mb-8 lg:mb-12">
  {/* Eye toggle button (applies to all cards) */}
  <div className="flex justify-end mb-4">
    <button onClick={toggleVisibility}>
      {isVisible ? <EyeOff /> : <Eye />}
    </button>
  </div>

  {/* Cards container */}
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4
                  scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
    <SalesRevenueCard />
    <BuybackExpensesCard />
    <NetProfitCard />
  </div>

  {/* Scroll indicator (mobile only) */}
  <div className="flex justify-center gap-2 mt-4 lg:hidden">
    <div className="w-2 h-2 rounded-full bg-primary" />
    <div className="w-2 h-2 rounded-full bg-gray-300" />
    <div className="w-2 h-2 rounded-full bg-gray-300" />
  </div>
</div>
```

---

## Calculation Logic

### Main Function: `calculateFinancialMetrics()`

```typescript
export function calculateFinancialMetrics(invoices: Invoice[]): FinancialMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter completed invoices only
  const completedInvoices = invoices.filter(i => i.status === 'completed');

  // Separate by type (backward compatible)
  const salesInvoices = completedInvoices.filter(invoice => {
    // NULL or false = regular sales invoice
    return invoice.is_buyback !== true;
  });

  const buybackInvoices = completedInvoices.filter(invoice => {
    // Only TRUE = buyback invoice
    return invoice.is_buyback === true;
  });

  // Calculate sales metrics
  const sales = calculateSalesMetrics(salesInvoices, currentMonth, currentYear);

  // Calculate buyback metrics
  const buyback = calculateBuybackMetrics(buybackInvoices, currentMonth, currentYear);

  // Calculate costs from all invoices
  const costs = calculateCosts(completedInvoices, currentMonth, currentYear);

  // Calculate net profit
  const profit = calculateNetProfit(sales, buyback, costs);

  return { sales, buyback, costs, profit };
}
```

### Helper: `calculateSalesMetrics()`

```typescript
function calculateSalesMetrics(
  salesInvoices: Invoice[],
  currentMonth: number,
  currentYear: number
) {
  const monthlyInvoices = salesInvoices.filter(invoice => {
    const date = new Date(invoice.invoiceDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalRevenue = salesInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return {
    totalRevenue,
    monthlyRevenue,
    invoiceCount: salesInvoices.length,
    monthlyInvoiceCount: monthlyInvoices.length,
    averageOrderValue: salesInvoices.length > 0
      ? totalRevenue / salesInvoices.length
      : 0,
  };
}
```

### Helper: `calculateBuybackMetrics()`

```typescript
function calculateBuybackMetrics(
  buybackInvoices: Invoice[],
  currentMonth: number,
  currentYear: number
) {
  const monthlyInvoices = buybackInvoices.filter(invoice => {
    const date = new Date(invoice.invoiceDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalExpenses = buybackInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const monthlyExpenses = monthlyInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return {
    totalExpenses,
    monthlyExpenses,
    invoiceCount: buybackInvoices.length,
    monthlyInvoiceCount: monthlyInvoices.length,
    averageExpense: buybackInvoices.length > 0
      ? totalExpenses / buybackInvoices.length
      : 0,
  };
}
```

### Helper: `calculateCosts()`

```typescript
function calculateCosts(
  allInvoices: Invoice[],
  currentMonth: number,
  currentYear: number
) {
  const monthlyInvoices = allInvoices.filter(invoice => {
    const date = new Date(invoice.invoiceDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalShippingCost = allInvoices.reduce(
    (sum, inv) => sum + (inv.shippingCost || 0),
    0
  );

  const monthlyShippingCost = monthlyInvoices.reduce(
    (sum, inv) => sum + (inv.shippingCost || 0),
    0
  );

  return {
    totalShippingCost,
    monthlyShippingCost,
  };
}
```

### Helper: `calculateNetProfit()`

```typescript
function calculateNetProfit(
  sales: SalesMetrics,
  buyback: BuybackMetrics,
  costs: CostMetrics
) {
  const totalNetProfit =
    sales.totalRevenue - buyback.totalExpenses - costs.totalShippingCost;

  const monthlyNetProfit =
    sales.monthlyRevenue - buyback.monthlyExpenses - costs.monthlyShippingCost;

  const profitMargin = sales.monthlyRevenue > 0
    ? (monthlyNetProfit / sales.monthlyRevenue) * 100
    : 0;

  return {
    totalNetProfit,
    monthlyNetProfit,
    profitMargin,
  };
}
```

---

## Backward Compatibility & Production Safety

### Database Compatibility

**Existing invoices without `is_buyback` field:**
```typescript
// NULL or undefined treated as regular sales
const salesInvoices = completedInvoices.filter(invoice => {
  return invoice.is_buyback !== true;  // Includes NULL, undefined, false
});
```

**Migration status:**
- ✅ Existing invoices: `is_buyback` is NULL → counted as sales
- ✅ New regular invoices: `is_buyback = false` → counted as sales
- ✅ New buyback invoices: `is_buyback = true` → counted as buyback

### Item-Level Safety

```typescript
// Handle both invoice-level and item-level flags
const getItemTotal = (item: InvoiceItem) => {
  if (item.is_buyback) {
    return item.total || 0;  // Buyback items use 'total'
  }
  return item.subtotal || 0;  // Regular items use 'subtotal'
};
```

### Shipping Cost Handling

```typescript
// Shipping cost exists in both invoice types, count as expense
const totalShippingCost = completedInvoices.reduce((sum, invoice) => {
  return sum + (invoice.shippingCost || 0);
}, 0);
```

### Edge Cases

**Zero invoices:**
```typescript
// Return safe defaults
if (salesInvoices.length === 0) {
  return {
    totalRevenue: 0,
    monthlyRevenue: 0,
    invoiceCount: 0,
    monthlyInvoiceCount: 0,
    averageOrderValue: 0,
  };
}
```

**Negative profit:**
```typescript
// Display negative values correctly
const displayProfit = profit.monthlyNetProfit < 0
  ? `-${formatCurrency(Math.abs(profit.monthlyNetProfit))}`
  : formatCurrency(profit.monthlyNetProfit);
```

**Very low profit margin:**
```typescript
// Handle division edge cases
const profitMargin = sales.monthlyRevenue > 0
  ? (monthlyNetProfit / sales.monthlyRevenue) * 100
  : 0;  // Avoid division by zero
```

---

## Implementation Steps

### Step 1: Update Types & Calculation Logic
**File:** `lib/utils/revenue.ts`

1. Create new `FinancialMetrics` interface
2. Rename `calculateRevenueMetrics` → `calculateFinancialMetrics`
3. Implement helper functions:
   - `calculateSalesMetrics()`
   - `calculateBuybackMetrics()`
   - `calculateCosts()`
   - `calculateNetProfit()`
4. Add comprehensive JSDoc comments
5. Export both old and new functions for transition period

**Verification:**
- Unit test with sample invoices (sales only, buyback only, mixed)
- Test edge cases (zero invoices, negative profit)
- Verify backward compatibility with NULL `is_buyback`

### Step 2: Create New UI Component
**File:** `components/features/dashboard/financial-cards.tsx`

1. Create `FinancialCards` component
2. Create three card sub-components:
   - `SalesRevenueCard`
   - `BuybackExpensesCard`
   - `NetProfitCard`
3. Implement horizontal scroll container
4. Add eye toggle functionality (applies to all cards)
5. Add scroll indicators for mobile
6. Responsive layout (scroll → grid)

**Verification:**
- Test on mobile (horizontal scroll, snap points)
- Test on desktop (3-column grid)
- Test eye toggle (all cards hide/show together)
- Test with very long numbers (overflow handling)

### Step 3: Update Dashboard Page
**File:** `app/dashboard/page.tsx`

1. Replace `RevenueCards` with `FinancialCards`
2. Update data fetching to use `calculateFinancialMetrics()`
3. Maintain premium gating:
   - Free users: See invoice count only
   - Premium users: See full financial metrics
4. Handle loading states
5. Handle error states

**Verification:**
- Test as free user (premium locked)
- Test as premium user (all data visible)
- Test loading skeleton
- Test error handling

### Step 4: Update Skeleton Component
**File:** `components/skeletons/revenue-card-skeleton.tsx`

1. Update to show 3 card skeletons
2. Match new card dimensions
3. Horizontal scroll layout on mobile

**Verification:**
- Skeleton matches actual cards
- Smooth transition when data loads

### Step 5: Deprecate Old Component (Optional)
**File:** `components/features/dashboard/revenue-cards.tsx`

1. Add deprecation comment
2. Export wrapper that redirects to new component
3. Plan removal in future version

---

## Testing Strategy

### Unit Tests
**File:** `lib/utils/__tests__/revenue.test.ts`

```typescript
describe('calculateFinancialMetrics', () => {
  it('should separate sales and buyback invoices', () => {
    const invoices = [
      { is_buyback: false, total: 1000000, status: 'completed' },
      { is_buyback: true, total: 500000, status: 'completed' },
    ];

    const metrics = calculateFinancialMetrics(invoices);

    expect(metrics.sales.totalRevenue).toBe(1000000);
    expect(metrics.buyback.totalExpenses).toBe(500000);
    expect(metrics.profit.totalNetProfit).toBe(500000);
  });

  it('should treat NULL is_buyback as sales invoice', () => {
    const invoices = [
      { is_buyback: null, total: 1000000, status: 'completed' },
    ];

    const metrics = calculateFinancialMetrics(invoices);

    expect(metrics.sales.totalRevenue).toBe(1000000);
    expect(metrics.buyback.totalExpenses).toBe(0);
  });

  it('should calculate net profit including shipping costs', () => {
    const invoices = [
      { is_buyback: false, total: 1000000, shippingCost: 50000, status: 'completed' },
      { is_buyback: true, total: 500000, shippingCost: 30000, status: 'completed' },
    ];

    const metrics = calculateFinancialMetrics(invoices);

    expect(metrics.profit.totalNetProfit).toBe(1000000 - 500000 - 80000);
  });
});
```

### Integration Tests

1. **Dashboard rendering with real data**
   - Load dashboard with mixed invoices
   - Verify all three cards display correct numbers
   - Verify calculations match expected values

2. **Responsive behavior**
   - Test horizontal scroll on mobile viewport
   - Test grid layout on desktop viewport
   - Test scroll snap behavior

3. **Premium gating**
   - Verify free users see locked state
   - Verify premium users see all data
   - Test upgrade modal trigger

### Manual Testing Checklist

- [ ] Sales card shows only regular invoices
- [ ] Buyback card shows only buyback invoices
- [ ] Net profit = sales - buyback - shipping
- [ ] Profit margin calculated correctly
- [ ] Horizontal scroll works on mobile
- [ ] Grid layout works on desktop
- [ ] Eye toggle hides/shows all cards
- [ ] Free users see invoice count only
- [ ] Premium users see full metrics
- [ ] Negative profit displays correctly
- [ ] Zero invoices handled gracefully
- [ ] Very large numbers don't break layout
- [ ] Existing invoices (NULL is_buyback) counted as sales

---

## Rollback Plan

If issues occur in production:

1. **Immediate rollback (UI only):**
   ```bash
   git revert <commit-hash>
   npm run build
   pm2 restart invow
   ```
   - No database changes to revert
   - Old component still available as fallback

2. **Gradual rollback:**
   - Keep new calculation logic
   - Revert to single revenue card temporarily
   - Debug issue
   - Redeploy fixed version

3. **Feature flag approach (future):**
   ```typescript
   const USE_NEW_FINANCIAL_CARDS = process.env.NEXT_PUBLIC_USE_FINANCIAL_CARDS === 'true';

   return USE_NEW_FINANCIAL_CARDS
     ? <FinancialCards metrics={financialMetrics} />
     : <RevenueCards metrics={revenueMetrics} />;
   ```

---

## Success Criteria

✅ **Functionality:**
- Sales and buyback invoices calculated separately
- Net profit includes all costs (shipping)
- All three cards display correct metrics
- Premium gating works correctly

✅ **User Experience:**
- Horizontal scroll smooth on mobile
- Grid layout clear on desktop
- Eye toggle works for all cards
- Loading states handled gracefully

✅ **Production Safety:**
- No database migrations required
- Backward compatible with existing data
- NULL `is_buyback` treated as sales
- No breaking changes to API

✅ **Performance:**
- Calculation completes in <100ms
- UI renders without jank
- Horizontal scroll performant on low-end devices

---

## Future Enhancements

**Phase 2: Additional Metrics**
- Daily/weekly revenue charts
- Profit trend visualization
- Top selling items vs top buyback items
- Cost breakdown (shipping, other expenses)

**Phase 3: Export & Reporting**
- CSV export of financial metrics
- PDF financial reports
- Email summaries (monthly)
- Tax calculation support

**Phase 4: Advanced Analytics**
- Profit forecasting
- Seasonal trend analysis
- Customer lifetime value
- Inventory valuation (for buyback items)

---

## References

- [Original Buyback Feature Design](./2025-01-01-buyback-invoice-design.md)
- [Database Schema Documentation](../database-schema.md)
- [Premium Feature Gating Strategy](../premium-features.md)
