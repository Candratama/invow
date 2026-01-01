/**
 * Reports Page Type Definitions
 */

/**
 * Customer status classification values
 * Note: Defined independently from customer.ts for type-level decoupling.
 * Must stay in sync with CUSTOMER_STATUS_VALUES.
 */
export type CustomerStatus = 'Distributor' | 'Reseller' | 'Customer'

/**
 * Date range selection for report filtering
 * @property start - ISO 8601 date string (YYYY-MM-DD)
 * @property end - ISO 8601 date string (YYYY-MM-DD)
 */
export interface DateRange {
  start: string // ISO date string (YYYY-MM-DD)
  end: string
}

/**
 * Aggregate revenue metrics for a specific period
 * @property totalRevenue - Sum of all invoice amounts in the period
 * @property invoiceCount - Total number of invoices created
 * @property avgOrderValue - Average invoice amount (totalRevenue / invoiceCount)
 * @property totalBuyback - Sum of all buyback invoice amounts in the period
 * @property growthRate - Percentage change vs previous period (can be negative, unbounded)
 * @property period - Date range for these metrics
 */
export interface RevenueMetrics {
  totalRevenue: number
  invoiceCount: number
  avgOrderValue: number
  totalBuyback: number
  growthRate: number // Percentage vs previous period
  period: DateRange
}

/**
 * Revenue breakdown by customer type classification
 * @property type - Customer classification level
 * @property count - Number of customers of this type
 * @property revenue - Total revenue from this customer type
 * @property percentage - Share of total revenue (0-100 range)
 */
export interface CustomerTypeBreakdown {
  type: CustomerStatus
  count: number
  revenue: number
  percentage: number
}

/**
 * Revenue segmentation between regular and buyback sales
 * @property regularRevenue - Revenue from standard sales invoices
 * @property buybackRevenue - Revenue from buyback/return invoices
 * @property regularPercentage - Share of regular sales (0-100 range)
 * @property buybackPercentage - Share of buyback sales (0-100 range)
 */
export interface SalesTypeBreakdown {
  regularRevenue: number
  buybackRevenue: number
  regularPercentage: number
  buybackPercentage: number
}

/**
 * Time-based revenue breakdown with optional customer segmentation
 * @property period - Period identifier: "YYYY-MM" (monthly) or "YYYY-Www" (weekly, e.g., "2026-W01")
 * @property periodStart - ISO 8601 date string marking period start
 * @property periodEnd - ISO 8601 date string marking period end
 * @property invoiceCount - Number of invoices in this period
 * @property totalRevenue - Sum of all invoice amounts
 * @property avgOrderValue - Average invoice amount for the period
 * @property growthRate - Percentage change vs previous period (can be negative, unbounded)
 * @property customerTypeBreakdown - Optional customer type segmentation for this period
 */
export interface PeriodBreakdown {
  period: string // "2026-01" (monthly) or "2026-W01" (weekly)
  periodStart: string // ISO date
  periodEnd: string
  invoiceCount: number
  totalRevenue: number
  avgOrderValue: number
  growthRate: number // vs previous period
  customerTypeBreakdown?: CustomerTypeBreakdown[]
}

/**
 * Comparison metrics for a single KPI between two periods
 * @property metric - KPI name (e.g., "Total Revenue", "Invoice Count", "Average Order Value")
 * @property current - Value in the current period
 * @property previous - Value in the comparison period
 * @property change - Absolute difference (current - previous)
 * @property changePercentage - Relative change as percentage (can be negative, unbounded)
 */
export interface ComparisonData {
  metric: string // "Total Revenue", "Invoice Count", etc.
  current: number
  previous: number
  change: number // Absolute difference
  changePercentage: number
}

/**
 * Period-over-period comparison analysis with insights
 * @property currentPeriod - Date range being analyzed
 * @property previousPeriod - Date range used for comparison baseline
 * @property comparisons - Array of KPI comparisons between periods
 * @property insights - Auto-generated analysis strings highlighting key trends
 */
export interface ComparisonMetrics {
  currentPeriod: DateRange
  previousPeriod: DateRange
  comparisons: ComparisonData[]
  insights: string[] // Auto-generated insights
}

/**
 * Export configuration for generating report files
 * @property tab - Export scope (differs from ReportsTab: uses specific detail views instead of generic 'details')
 * @property dateRange - Date range to include in export
 * @property format - Output file format
 */
export interface ExportOptions {
  tab: 'overview' | 'details-monthly' | 'details-weekly' | 'comparison'
  dateRange: DateRange
  format: 'csv' | 'xlsx'
}

/**
 * Complete dataset for the Reports page
 * @property revenueMetrics - Aggregate metrics for selected period
 * @property customerTypeBreakdown - Revenue distribution by customer classification
 * @property salesTypeBreakdown - Revenue split between regular and buyback sales
 * @property periodBreakdown - Time-series data (monthly or weekly)
 * @property comparisonMetrics - Optional period comparison analysis
 */
export interface ReportsData {
  revenueMetrics: RevenueMetrics
  customerTypeBreakdown: CustomerTypeBreakdown[]
  salesTypeBreakdown: SalesTypeBreakdown
  periodBreakdown: PeriodBreakdown[]
  comparisonMetrics?: ComparisonMetrics
}

/**
 * Time granularity for period breakdowns
 */
export type PeriodView = 'monthly' | 'weekly'

/**
 * Available tab views in the Reports interface
 */
export type ReportsTab = 'overview' | 'details' | 'comparison'
