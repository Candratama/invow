// lib/types/report.ts

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
}

export interface ReportSummary {
  totalRevenue: number;
  totalInvoices: number;
  activeCustomers: number;
  averageInvoiceValue: number;
  regularInvoices: number;
  buybackInvoices: number;
}

export interface BuybackSummary {
  totalGram: number;
  totalValue: number;
  averageRatePerGram: number;
  transactionCount: number;
  customerCount: number;
}

export interface RevenueDataPoint {
  date: string;
  displayDate: string;
  value: number;
}

export interface BuybackDataPoint {
  date: string;
  displayDate: string;
  gram: number;
  value: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  invoiceCount: number;
  totalValue: number;
}

export interface BuybackTransaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  gram: number;
  ratePerGram: number;
  total: number;
}

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  type: 'regular' | 'buyback';
  itemCount: number;
  total: number;
}

export interface ReportOverviewData {
  summary: ReportSummary;
  revenueChart: RevenueDataPoint[];
  topCustomers: TopCustomer[];
}

export interface ReportBuybackData {
  summary: BuybackSummary;
  trendChart: BuybackDataPoint[];
  transactions: BuybackTransaction[];
}

export interface ReportDetailData {
  invoices: InvoiceRow[];
  totalCount: number;
}
