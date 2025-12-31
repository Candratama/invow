# Revenue Card Buyback Separation - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate sales revenue from buyback expenses with 3 distinct financial cards

**Architecture:** Update calculation logic to separate invoices by `is_buyback` flag, create new 3-card UI component with horizontal scroll (mobile) and grid (desktop), maintain backward compatibility with production data

**Tech Stack:** TypeScript, React, Next.js 16, Tailwind CSS, Lucide Icons

**Design Reference:** `docs/plans/2025-12-31-revenue-card-buyback-separation.md`

---

## Task 1: Update Financial Calculation Logic

**Files:**
- Modify: `lib/utils/revenue.ts`

### Step 1: Add new FinancialMetrics interface

At the top of `lib/utils/revenue.ts` after the `RevenueMetrics` interface, add:

```typescript
export interface FinancialMetrics {
  sales: {
    totalRevenue: number;
    monthlyRevenue: number;
    invoiceCount: number;
    monthlyInvoiceCount: number;
    averageOrderValue: number;
  };
  buyback: {
    totalExpenses: number;
    monthlyExpenses: number;
    invoiceCount: number;
    monthlyInvoiceCount: number;
    averageExpense: number;
  };
  costs: {
    totalShippingCost: number;
    monthlyShippingCost: number;
  };
  profit: {
    totalNetProfit: number;
    monthlyNetProfit: number;
    profitMargin: number;
  };
}
```

### Step 2: Add helper function - calculateSalesMetrics

After the `calculateRevenueMetrics` function, add:

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

### Step 3: Add helper function - calculateBuybackMetrics

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

### Step 4: Add helper function - calculateCosts

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

### Step 5: Add helper function - calculateNetProfit

```typescript
function calculateNetProfit(
  sales: { totalRevenue: number; monthlyRevenue: number },
  buyback: { totalExpenses: number; monthlyExpenses: number },
  costs: { totalShippingCost: number; monthlyShippingCost: number }
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

### Step 6: Add main calculateFinancialMetrics function

```typescript
export function calculateFinancialMetrics(invoices: Invoice[]): FinancialMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter completed invoices only
  const completedInvoices = invoices.filter(i => i.status === 'completed');

  // Separate by type (backward compatible - NULL/false treated as sales)
  const salesInvoices = completedInvoices.filter(invoice => {
    return invoice.is_buyback !== true;
  });

  const buybackInvoices = completedInvoices.filter(invoice => {
    return invoice.is_buyback === true;
  });

  // Calculate metrics
  const sales = calculateSalesMetrics(salesInvoices, currentMonth, currentYear);
  const buyback = calculateBuybackMetrics(buybackInvoices, currentMonth, currentYear);
  const costs = calculateCosts(completedInvoices, currentMonth, currentYear);
  const profit = calculateNetProfit(sales, buyback, costs);

  return { sales, buyback, costs, profit };
}
```

### Step 7: Verify compilation

Run: `npm run type-check`
Expected: No TypeScript errors

### Step 8: Commit calculation logic

```bash
git add lib/utils/revenue.ts
git commit -m "feat(revenue): add financial metrics calculation with buyback separation

- Add FinancialMetrics interface with sales/buyback/costs/profit
- Add helper functions for calculating each metric type
- Separate invoices by is_buyback flag (backward compatible)
- Include shipping costs in net profit calculation
- Maintain existing calculateRevenueMetrics for backward compatibility"
```

---

## Task 2: Create Financial Cards Component

**Files:**
- Create: `components/features/dashboard/financial-cards.tsx`

### Step 1: Create base component file with imports

```typescript
"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { FinancialMetrics } from "@/lib/utils/revenue";
import { formatCurrency } from "@/lib/utils";

interface FinancialCardsProps {
  metrics: FinancialMetrics;
  subscriptionStatus: {
    tier: string;
  } | null;
  isLoading?: boolean;
}

function formatCurrencyWithDots(amount: number): string {
  const formatted = formatCurrency(amount);
  const normalizedFormatted = formatted.replace(/[\u00A0\s]+/, " ");
  const rpMatch = normalizedFormatted.match(/^Rp\s?(.+)$/);
  if (rpMatch) {
    const number = rpMatch[1];
    return `Rp ${"*".repeat(number.replace(/\s/g, "").length)}`;
  }
  return formatted;
}

export function FinancialCards({
  metrics,
  subscriptionStatus,
  isLoading = false,
}: FinancialCardsProps) {
  const [isAmountVisible, setIsAmountVisible] = useState(true);

  const toggleVisibility = () => {
    setIsAmountVisible(!isAmountVisible);
  };

  const isPremium = subscriptionStatus?.tier === "premium";

  // TODO: Add card components

  return null;
}
```

### Step 2: Add SalesRevenueCard component

Before the `FinancialCards` component, add:

```typescript
function SalesRevenueCard({
  sales,
  isVisible,
  isPremium,
}: {
  sales: FinancialMetrics["sales"];
  isVisible: boolean;
  isPremium: boolean;
}) {
  const displayMonthly = isVisible
    ? formatCurrency(sales.monthlyRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(sales.monthlyRevenue);

  const displayTotal = isVisible
    ? formatCurrency(sales.totalRevenue).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(sales.totalRevenue);

  return (
    <div className="min-w-[280px] snap-center">
      <div className="relative overflow-hidden rounded-md p-6 text-white shadow-lg transition-transform hover:scale-105 bg-green-600">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full opacity-10 bg-white" />

        {/* Content */}
        <div className="relative z-10 text-left">
          <div className="flex justify-start mb-3">
            <TrendingUp className="w-8 h-8 text-white/60" />
          </div>
          <p className="text-base lg:text-lg font-semibold text-white/90 mb-2">
            Sales Revenue
          </p>
          <div className="mb-4">
            {isPremium ? (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {displayMonthly}
                </h3>
                <p className="text-sm text-white/80">
                  {sales.monthlyInvoiceCount} invoices this month
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {sales.monthlyInvoiceCount} invoices
                </h3>
                <p className="text-sm text-white/80">
                  Created this month
                </p>
              </>
            )}
          </div>

          {isPremium && (
            <div className="border-t border-white/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Total Revenue</span>
                <span className="text-sm font-medium text-white/80">
                  {displayTotal}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 3: Add BuybackExpensesCard component

```typescript
function BuybackExpensesCard({
  buyback,
  isVisible,
  isPremium,
}: {
  buyback: FinancialMetrics["buyback"];
  isVisible: boolean;
  isPremium: boolean;
}) {
  const displayMonthly = isVisible
    ? formatCurrency(buyback.monthlyExpenses).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(buyback.monthlyExpenses);

  const displayTotal = isVisible
    ? formatCurrency(buyback.totalExpenses).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(buyback.totalExpenses);

  return (
    <div className="min-w-[280px] snap-center">
      <div className="relative overflow-hidden rounded-md p-6 text-white shadow-lg transition-transform hover:scale-105 bg-amber-600">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full opacity-10 bg-white" />

        {/* Content */}
        <div className="relative z-10 text-left">
          <div className="flex justify-start mb-3">
            <ShoppingCart className="w-8 h-8 text-white/60" />
          </div>
          <p className="text-base lg:text-lg font-semibold text-white/90 mb-2">
            Buyback Expenses
          </p>
          <div className="mb-4">
            {isPremium ? (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {displayMonthly}
                </h3>
                <p className="text-sm text-white/80">
                  {buyback.monthlyInvoiceCount} purchases this month
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {buyback.monthlyInvoiceCount} purchases
                </h3>
                <p className="text-sm text-white/80">
                  Made this month
                </p>
              </>
            )}
          </div>

          {isPremium && (
            <div className="border-t border-white/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Total Expenses</span>
                <span className="text-sm font-medium text-white/80">
                  {displayTotal}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 4: Add NetProfitCard component

```typescript
function NetProfitCard({
  profit,
  isVisible,
  isPremium,
}: {
  profit: FinancialMetrics["profit"];
  isVisible: boolean;
  isPremium: boolean;
}) {
  const displayMonthly = isVisible
    ? formatCurrency(profit.monthlyNetProfit).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(profit.monthlyNetProfit);

  const displayTotal = isVisible
    ? formatCurrency(profit.totalNetProfit).replace(/[\u00A0]+/, " ")
    : formatCurrencyWithDots(profit.totalNetProfit);

  return (
    <div className="min-w-[280px] snap-center">
      <div className="relative overflow-hidden rounded-md p-6 text-white shadow-lg transition-transform hover:scale-105 bg-gradient-to-br from-blue-600 to-purple-600">
        {/* Background pattern */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full opacity-10 bg-white" />

        {/* Content */}
        <div className="relative z-10 text-left">
          <div className="flex justify-start mb-3">
            <DollarSign className="w-8 h-8 text-white/60" />
          </div>
          <p className="text-base lg:text-lg font-semibold text-white/90 mb-2">
            Net Profit
          </p>
          <div className="mb-4">
            {isPremium ? (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  {displayMonthly}
                </h3>
                <p className="text-sm text-white/80">
                  {profit.profitMargin.toFixed(1)}% margin this month
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl lg:text-3xl font-bold mb-1">
                  Premium Only
                </h3>
                <p className="text-sm text-white/80">
                  Upgrade to see profit
                </p>
              </>
            )}
          </div>

          {isPremium && (
            <div className="border-t border-white/20 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/80">Total Profit</span>
                <span className="text-sm font-medium text-white/80">
                  {displayTotal}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Step 5: Complete FinancialCards main component

Replace the `return null;` in FinancialCards with:

```typescript
  return (
    <div className="mb-8 lg:mb-12">
      {/* Toggle eye button */}
      <button
        onClick={toggleVisibility}
        className="ml-auto mb-4 flex justify-center items-center transition-colors hover:bg-gray-100 rounded-full p-2"
        aria-label={isAmountVisible ? "Hide amounts" : "Show amounts"}
      >
        {isAmountVisible ? (
          <EyeOff className="w-4 h-4 text-gray-600" />
        ) : (
          <Eye className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* Cards container */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
        <SalesRevenueCard
          sales={metrics.sales}
          isVisible={isAmountVisible}
          isPremium={isPremium}
        />
        <BuybackExpensesCard
          buyback={metrics.buyback}
          isVisible={isAmountVisible}
          isPremium={isPremium}
        />
        <NetProfitCard
          profit={metrics.profit}
          isVisible={isAmountVisible}
          isPremium={isPremium}
        />
      </div>

      {/* Scroll indicators for mobile */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
      </div>
    </div>
  );
```

### Step 6: Add scrollbar-hide to globals.css

Add to `app/globals.css`:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

### Step 7: Verify compilation

Run: `npm run type-check`
Expected: No TypeScript errors

### Step 8: Commit component

```bash
git add components/features/dashboard/financial-cards.tsx app/globals.css
git commit -m "feat(dashboard): add financial cards component with 3-card layout

- Create FinancialCards component with sales/buyback/profit cards
- Add SalesRevenueCard (green theme, TrendingUp icon)
- Add BuybackExpensesCard (amber theme, ShoppingCart icon)
- Add NetProfitCard (blue/purple gradient, DollarSign icon)
- Implement horizontal scroll for mobile with snap points
- Implement 3-column grid for desktop
- Add eye toggle to hide/show amounts across all cards
- Add premium gating for financial details"
```

---

## Task 3: Update Dashboard to Use New Component

**Files:**
- Modify: `app/dashboard/page.tsx`

### Step 1: Find and read current dashboard implementation

Run: `cat app/dashboard/page.tsx | grep -A 5 "RevenueCards"`
Expected: See current usage of RevenueCards component

### Step 2: Update imports

Find the import for `RevenueCards` and replace with:

```typescript
import { FinancialCards } from "@/components/features/dashboard/financial-cards";
import { calculateFinancialMetrics } from "@/lib/utils/revenue";
```

### Step 3: Update metrics calculation

Find where `calculateRevenueMetrics` is called and replace with:

```typescript
const financialMetrics = calculateFinancialMetrics(invoices);
```

### Step 4: Replace component usage

Find `<RevenueCards />` and replace with:

```typescript
<FinancialCards
  metrics={financialMetrics}
  subscriptionStatus={subscriptionStatus}
  isLoading={isLoading}
/>
```

### Step 5: Verify compilation

Run: `npm run type-check`
Expected: No TypeScript errors

### Step 6: Test in dev mode

Run: `npm run dev`
Expected: App starts without errors
Then visit: `http://localhost:3000/dashboard`
Expected: See 3 cards (sales, buyback, profit)

### Step 7: Commit dashboard update

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): integrate financial cards with buyback separation

- Replace RevenueCards with FinancialCards component
- Use calculateFinancialMetrics instead of calculateRevenueMetrics
- Maintain loading states and premium gating
- Display sales, buyback, and net profit separately"
```

---

## Task 4: Update Skeleton Component

**Files:**
- Modify: `components/skeletons/revenue-card-skeleton.tsx`

### Step 1: Read current skeleton

```bash
cat components/skeletons/revenue-card-skeleton.tsx
```

### Step 2: Update to 3-card skeleton

Replace content with:

```typescript
export function RevenueCardSkeleton() {
  return (
    <div className="mb-8 lg:mb-12">
      {/* Eye button skeleton */}
      <div className="ml-auto mb-4 w-8 h-8 bg-gray-200 rounded-full animate-pulse" />

      {/* Cards skeleton container */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide lg:grid lg:grid-cols-3 lg:overflow-visible">
        {/* Card 1 skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="rounded-md p-6 shadow-lg bg-gray-200 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded mb-3" />
            <div className="w-32 h-4 bg-gray-300 rounded mb-2" />
            <div className="w-40 h-8 bg-gray-300 rounded mb-1" />
            <div className="w-36 h-4 bg-gray-300 rounded mb-4" />
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between">
                <div className="w-20 h-3 bg-gray-300 rounded" />
                <div className="w-24 h-3 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="rounded-md p-6 shadow-lg bg-gray-200 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded mb-3" />
            <div className="w-32 h-4 bg-gray-300 rounded mb-2" />
            <div className="w-40 h-8 bg-gray-300 rounded mb-1" />
            <div className="w-36 h-4 bg-gray-300 rounded mb-4" />
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between">
                <div className="w-20 h-3 bg-gray-300 rounded" />
                <div className="w-24 h-3 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 skeleton */}
        <div className="min-w-[280px] snap-center">
          <div className="rounded-md p-6 shadow-lg bg-gray-200 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded mb-3" />
            <div className="w-32 h-4 bg-gray-300 rounded mb-2" />
            <div className="w-40 h-8 bg-gray-300 rounded mb-1" />
            <div className="w-36 h-4 bg-gray-300 rounded mb-4" />
            <div className="border-t border-gray-300 pt-3">
              <div className="flex justify-between">
                <div className="w-20 h-3 bg-gray-300 rounded" />
                <div className="w-24 h-3 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicators skeleton */}
      <div className="flex justify-center gap-2 mt-4 lg:hidden">
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
        <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
      </div>
    </div>
  );
}
```

### Step 3: Verify skeleton matches actual cards

Run: `npm run dev`
Visit: `http://localhost:3000/dashboard`
Refresh and observe loading state
Expected: 3 skeleton cards matching actual card layout

### Step 4: Commit skeleton update

```bash
git add components/skeletons/revenue-card-skeleton.tsx
git commit -m "feat(skeleton): update revenue skeleton to match 3-card layout

- Update to show 3 card skeletons instead of 1
- Match financial cards dimensions and layout
- Add horizontal scroll skeleton for mobile
- Add scroll indicator skeletons"
```

---

## Task 5: Manual Testing & Verification

### Step 1: Test with sales invoices only

1. Open dashboard in browser
2. Verify Sales Revenue card shows correct amount
3. Verify Buyback Expenses card shows Rp 0
4. Verify Net Profit equals Sales Revenue (minus shipping if any)

### Step 2: Test with buyback invoices only

1. Create a test buyback invoice
2. Refresh dashboard
3. Verify Buyback Expenses card shows correct amount
4. Verify Sales Revenue shows previous sales (not buyback)
5. Verify Net Profit is negative or reduced

### Step 3: Test with mixed invoices

1. Have both sales and buyback invoices
2. Refresh dashboard
3. Verify each card shows correct separated amounts
4. Verify Net Profit = Sales - Buyback - Shipping

### Step 4: Test responsive behavior

1. Resize browser to mobile width (< 768px)
2. Verify horizontal scroll works
3. Verify snap points work (cards snap to center)
4. Verify scroll indicators show
5. Resize to desktop width (> 1024px)
6. Verify 3-column grid layout
7. Verify scroll indicators hidden

### Step 5: Test eye toggle

1. Click eye icon
2. Verify all 3 cards hide amounts (show asterisks)
3. Click again
4. Verify all 3 cards show amounts

### Step 6: Test premium gating

1. Test as free user
2. Verify only invoice/purchase counts shown
3. Verify revenue details locked
4. Test as premium user
5. Verify all financial details visible

### Step 7: Test edge cases

1. Test with zero invoices
   Expected: All cards show Rp 0 gracefully
2. Test with very large numbers
   Expected: Format doesn't break layout
3. Test with negative profit
   Expected: Displays correctly with minus sign

### Step 8: Document test results

Create file: `docs/testing/revenue-cards-test-results.md`

```markdown
# Revenue Cards Testing Results

**Date:** 2025-12-31
**Tester:** [Name]

## Test Results

- [ ] Sales invoices separated correctly
- [ ] Buyback invoices separated correctly
- [ ] Net profit calculation accurate
- [ ] Horizontal scroll works on mobile
- [ ] Grid layout works on desktop
- [ ] Eye toggle hides/shows all cards
- [ ] Premium gating works
- [ ] Zero invoices handled
- [ ] Large numbers handled
- [ ] Negative profit displayed correctly
- [ ] Backward compatibility (NULL is_buyback)

## Issues Found

[List any issues]

## Production Ready

- [ ] Yes
- [ ] No (explain)
```

### Step 9: Commit test documentation

```bash
git add docs/testing/revenue-cards-test-results.md
git commit -m "docs: add revenue cards testing results template"
```

---

## Task 6: Final Integration & Deployment

### Step 1: Run full build

```bash
npm run build
```

Expected: Build succeeds with no errors

### Step 2: Run type check

```bash
npm run type-check
```

Expected: No TypeScript errors

### Step 3: Check for console errors

1. Start dev server: `npm run dev`
2. Open browser console
3. Navigate to dashboard
4. Expected: No errors in console

### Step 4: Create final commit

```bash
git add -A
git commit -m "feat: complete revenue card buyback separation

Summary of changes:
- Separate sales revenue from buyback expenses
- Add 3-card layout: Sales, Buyback, Net Profit
- Calculate net profit including all costs
- Backward compatible with existing data
- Responsive design (mobile scroll, desktop grid)
- Premium gating maintained
- Eye toggle for privacy

Closes: revenue-card-buyback-separation"
```

### Step 5: Push to repository

```bash
git push origin add_buyback
```

### Step 6: Create pull request (if applicable)

Title: "feat: Separate sales revenue from buyback expenses with 3-card layout"

Description:
```
## Changes

- **Calculation Logic**: Separate invoices by `is_buyback` flag
- **UI Component**: 3 distinct cards (Sales, Buyback, Net Profit)
- **Layout**: Horizontal scroll (mobile) + Grid (desktop)
- **Premium Gating**: Maintained existing access control
- **Backward Compatible**: NULL `is_buyback` treated as sales

## Testing

- ✅ Sales and buyback separated correctly
- ✅ Net profit = sales - buyback - shipping
- ✅ Responsive layout works
- ✅ Premium gating works
- ✅ Eye toggle works
- ✅ Production safe (no database changes)

## Design

See: `docs/plans/2025-12-31-revenue-card-buyback-separation.md`

## Screenshots

[Add screenshots of 3-card layout]
```

---

## Success Criteria

✅ **Functionality:**
- Sales and buyback invoices calculated separately
- Net profit includes shipping costs
- All three cards display correct metrics
- Premium gating works

✅ **User Experience:**
- Horizontal scroll smooth on mobile
- Grid layout clear on desktop
- Eye toggle works for all cards
- Loading skeleton matches cards

✅ **Production Safety:**
- No database migrations needed
- Backward compatible with NULL is_buyback
- No breaking changes
- Build succeeds

✅ **Code Quality:**
- TypeScript types correct
- No console errors
- Code follows existing patterns
- Commits are atomic and descriptive

---

## Rollback Plan

If issues occur:

1. **Quick Rollback:**
   ```bash
   git revert HEAD~6..HEAD  # Revert last 6 commits
   npm run build
   ```

2. **Selective Rollback:**
   - Keep calculation logic
   - Revert to old component
   - Debug and redeploy

3. **Database Safety:**
   - No migrations to rollback
   - Data remains intact
   - Can switch between implementations

---

## Notes

- This plan assumes `add_buyback` branch is active
- All file paths are relative to project root
- Commit messages follow conventional commits format
- Design reference: `docs/plans/2025-12-31-revenue-card-buyback-separation.md`
