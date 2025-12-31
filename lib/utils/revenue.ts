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
 * Determines if an invoice is a buyback invoice
 * An invoice is buyback if ALL items have is_buyback = true
 */
function isBuybackInvoice(invoice: Invoice): boolean {
  if (!invoice.items || invoice.items.length === 0) {
    return false;
  }
  return invoice.items.every(item => item.is_buyback === true);
}

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

  // Separate by type based on items
  const salesInvoices = completedInvoices.filter(invoice => !isBuybackInvoice(invoice));
  const buybackInvoices = completedInvoices.filter(invoice => isBuybackInvoice(invoice));

  // Calculate metrics for each category
  const sales = calculateSalesMetrics(salesInvoices, currentMonth, currentYear);
  const buyback = calculateBuybackMetrics(buybackInvoices, currentMonth, currentYear);
  const costs = calculateCosts(completedInvoices, currentMonth, currentYear);
  const profit = calculateNetProfit(sales, buyback, costs);

  return { sales, buyback, costs, profit };
}