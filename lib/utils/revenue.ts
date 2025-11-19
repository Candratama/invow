import { Invoice } from '../types';

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  invoiceCount: number;
  monthlyInvoiceCount: number;
  averageOrderValue: number;
  monthlyAverageOrderValue: number;
}

export function calculateRevenueMetrics(invoices: Invoice[]): RevenueMetrics {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const completedInvoices = invoices.filter(invoice =>
    invoice.status === 'completed'
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