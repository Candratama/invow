import { Invoice } from '../types';

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  invoiceCount: number;
  monthlyInvoiceCount: number;
  averageOrderValue: number;
  monthlyAverageOrderValue: number;
}

// New comprehensive financial metrics interface
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

export function calculateRevenueMetrics(invoices: Invoice[]): RevenueMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const completedInvoices = invoices.filter(invoice =>
    invoice.status === 'completed' || invoice.status === 'synced'
  );

  const totalRevenue = completedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const invoiceCount = completedInvoices.length;

  const monthlyInvoices = completedInvoices.filter(invoice => {
    const invoiceDate = new Date(invoice.invoiceDate);
    return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
  });

  const monthlyRevenue = monthlyInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const monthlyInvoiceCount = monthlyInvoices.length;

  const averageOrderValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
  const monthlyAverageOrderValue = monthlyInvoiceCount > 0 ? monthlyRevenue / monthlyInvoiceCount : 0;

  return {
    totalRevenue,
    monthlyRevenue,
    invoiceCount,
    monthlyInvoiceCount,
    averageOrderValue,
    monthlyAverageOrderValue,
  };
}

/**
 * Determines if an invoice has any buyback item.
 * An invoice is classified as buyback if at least one of its items is a
 * buyback item. This matches the report-page classification so the count
 * shown on both pages is consistent.
 *
 * For mixed invoices (regular + buyback items), the invoice itself is
 * counted under "buyback" but the *revenue* contributed to each card is
 * split per item (see sumBuybackItems / invoice.total - buyback portion).
 */
function hasBuybackItems(invoice: Invoice): boolean {
  if (!invoice.items || invoice.items.length === 0) {
    return false;
  }
  return invoice.items.some(item => item.is_buyback === true);
}

/**
 * Sum the per-item `total` of every buyback line on an invoice.
 * Buyback items use the schema column `total` (gram × buyback_rate);
 * regular items use `subtotal` (price × quantity).
 */
function sumBuybackItems(invoice: Invoice): number {
  if (!invoice.items) return 0;
  return invoice.items.reduce((sum, item) => {
    if (item.is_buyback === true) {
      return sum + (item.total ?? 0);
    }
    return sum;
  }, 0);
}

/**
 * Sales contribution for an invoice = invoice.total minus the buyback
 * items' portion. That way:
 *  - pure-sales invoice → contributes its full invoice total (subtotals + shipping)
 *  - pure-buyback invoice → contributes 0 to sales
 *  - mixed invoice → contributes regular items + shipping (NOT the buyback portion)
 */
function salesContribution(invoice: Invoice): number {
  return invoice.total - sumBuybackItems(invoice);
}

function calculateSalesMetrics(
  allInvoices: Invoice[],
  currentMonth: number,
  currentYear: number
) {
  // Sales revenue is the *pure* sales side of every invoice — regardless of
  // whether the invoice also has buyback items. Counts the invoice in the
  // sales bucket only when no buyback items are present (mutually exclusive
  // with the buyback bucket so totals match the report-page convention).
  const salesInvoices = allInvoices.filter(inv => !hasBuybackItems(inv));
  const monthlyInvoices = salesInvoices.filter(invoice => {
    const date = new Date(invoice.invoiceDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalRevenue = allInvoices.reduce(
    (sum, inv) => sum + salesContribution(inv),
    0
  );
  const monthlyRevenue = allInvoices
    .filter(invoice => {
      const date = new Date(invoice.invoiceDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, inv) => sum + salesContribution(inv), 0);

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

function calculateBuybackMetrics(
  allInvoices: Invoice[],
  currentMonth: number,
  currentYear: number
) {
  // Buyback expense is the *pure* buyback side of every invoice — sum of
  // buyback items' totals. Invoice count uses some(is_buyback) so mixed
  // invoices are counted as buyback (matching the report page).
  const buybackInvoices = allInvoices.filter(hasBuybackItems);
  const monthlyInvoices = buybackInvoices.filter(invoice => {
    const date = new Date(invoice.invoiceDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalExpenses = allInvoices.reduce(
    (sum, inv) => sum + sumBuybackItems(inv),
    0
  );
  const monthlyExpenses = allInvoices
    .filter(invoice => {
      const date = new Date(invoice.invoiceDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, inv) => sum + sumBuybackItems(inv), 0);

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

/**
 * Calculate comprehensive financial metrics separating sales and buyback
 * @param invoices - All invoices (completed only will be filtered)
 * @returns Financial metrics with sales, buyback, costs, and profit
 */
export function calculateFinancialMetrics(invoices: Invoice[]): FinancialMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter completed invoices only (including synced status)
  const completedInvoices = invoices.filter(i => i.status === 'completed' || i.status === 'synced');

  // Each card now aggregates over EVERY completed invoice and splits the
  // contribution per item type. That way mixed invoices are no longer
  // silently lost from the dashboard — their regular items count toward
  // Sales Revenue and their buyback items count toward Buyback Expense.
  const sales = calculateSalesMetrics(completedInvoices, currentMonth, currentYear);
  const buyback = calculateBuybackMetrics(completedInvoices, currentMonth, currentYear);
  const costs = calculateCosts(completedInvoices, currentMonth, currentYear);
  const profit = calculateNetProfit(sales, buyback, costs);

  return { sales, buyback, costs, profit };
}