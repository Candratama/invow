import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type {
  DateRange,
  ReportOverviewData,
  ReportBuybackData,
  ReportDetailData,
  ReportSummary,
  BuybackSummary,
  RevenueDataPoint,
  BuybackDataPoint,
  TopCustomer,
  TopCustomersByStatus,
  BuybackTransaction,
  InvoiceRow
} from '@/lib/types/report'

/**
 * Helper function to format date as "3 Jan" style
 */
function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  return `${day} ${month}`
}

/**
 * Get report overview data for a user
 * Returns summary stats, revenue chart, and top customers
 */
export async function getReportOverviewData(
  userId: string,
  dateRange: DateRange
): Promise<ReportOverviewData> {
  const supabase = await createClient()

  // Get user's store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return {
      summary: {
        totalRevenue: 0,
        totalInvoices: 0,
        activeCustomers: 0,
        averageInvoiceValue: 0,
        regularInvoices: 0,
        buybackInvoices: 0
      },
      revenueChart: [],
      topCustomers: [],
      topCustomersByStatus: {
        customer: [],
        reseller: [],
        distributor: []
      }
    }
  }

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

  if (!invoices || invoices.length === 0) {
    return {
      summary: {
        totalRevenue: 0,
        totalInvoices: 0,
        activeCustomers: 0,
        averageInvoiceValue: 0,
        regularInvoices: 0,
        buybackInvoices: 0
      },
      revenueChart: [],
      topCustomers: [],
      topCustomersByStatus: {
        customer: [],
        reseller: [],
        distributor: []
      }
    }
  }

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

  // Calculate summary stats
  const uniqueCustomers = new Set<string>()
  let totalRevenue = 0
  let regularInvoicesCount = 0
  let buybackInvoicesCount = 0
  const customerTotals: Map<string, {
    id: string;
    name: string;
    total: number;
    count: number;
    status: string;
  }> = new Map()
  const revenueByDate: Map<string, number> = new Map()

  invoices.forEach((invoice) => {
    const items = invoice.invoice_items || []
    const hasBuybackItems = items.some((item: any) => item.is_buyback)

    if (hasBuybackItems) {
      buybackInvoicesCount++
      // For buyback invoices, subtract the buyback expense
      const buybackTotal = items
        .filter((item: any) => item.is_buyback)
        .reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      totalRevenue -= buybackTotal
    } else {
      regularInvoicesCount++
      // For regular invoices, add the revenue
      totalRevenue += invoice.total
    }

    // Track unique customers
    uniqueCustomers.add(invoice.customer_name)

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

    // Track revenue by date
    const dateKey = invoice.invoice_date
    const currentRevenue = revenueByDate.get(dateKey) || 0
    if (hasBuybackItems) {
      const buybackTotal = items
        .filter((item: any) => item.is_buyback)
        .reduce((sum: number, item: any) => sum + (item.total || 0), 0)
      revenueByDate.set(dateKey, currentRevenue - buybackTotal)
    } else {
      revenueByDate.set(dateKey, currentRevenue + invoice.total)
    }
  })

  const summary: ReportSummary = {
    totalRevenue,
    totalInvoices: invoices.length,
    activeCustomers: uniqueCustomers.size,
    averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0,
    regularInvoices: regularInvoicesCount,
    buybackInvoices: buybackInvoicesCount
  }

  // Build revenue chart data
  const revenueChart: RevenueDataPoint[] = Array.from(revenueByDate.entries())
    .map(([date, value]) => ({
      date,
      displayDate: formatDisplayDate(date),
      value
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

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

  const topCustomersByStatus = {
    customer: getTop5ByStatus('Customer'),
    reseller: getTop5ByStatus('Reseller'),
    distributor: getTop5ByStatus('Distributor')
  }

  return {
    summary,
    revenueChart,
    topCustomers,
    topCustomersByStatus
  }
}

/**
 * Get buyback report data for a user
 * Returns buyback summary, trend chart, and transactions list
 */
export async function getReportBuybackData(
  userId: string,
  dateRange: DateRange
): Promise<ReportBuybackData> {
  const supabase = await createClient()

  // Get user's store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return {
      summary: {
        totalGram: 0,
        totalValue: 0,
        averageRatePerGram: 0,
        transactionCount: 0,
        customerCount: 0
      },
      trendChart: [],
      transactions: []
    }
  }

  // Fetch invoices with buyback items
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      customer_name,
      invoice_date,
      invoice_items!inner (
        id,
        is_buyback,
        gram,
        buyback_rate,
        total
      )
    `)
    .eq('store_id', store.id)
    .eq('invoice_items.is_buyback', true)
    .gte('invoice_date', dateRange.from)
    .lte('invoice_date', dateRange.to)
    .order('invoice_date', { ascending: true })

  if (!invoices || invoices.length === 0) {
    return {
      summary: {
        totalGram: 0,
        totalValue: 0,
        averageRatePerGram: 0,
        transactionCount: 0,
        customerCount: 0
      },
      trendChart: [],
      transactions: []
    }
  }

  // Calculate buyback summary
  let totalGram = 0
  let totalValue = 0
  const uniqueCustomers = new Set<string>()
  const trendByDate: Map<string, { gram: number; value: number }> = new Map()
  const transactions: BuybackTransaction[] = []

  invoices.forEach((invoice) => {
    const buybackItems = (invoice.invoice_items || []).filter((item: any) => item.is_buyback)

    buybackItems.forEach((item: any) => {
      const gram = item.gram || 0
      const rate = item.buyback_rate || 0
      const total = item.total || 0

      totalGram += gram
      totalValue += total

      // Track unique customers
      uniqueCustomers.add(invoice.customer_name)

      // Track trend by date
      const dateKey = invoice.invoice_date
      const current = trendByDate.get(dateKey) || { gram: 0, value: 0 }
      trendByDate.set(dateKey, {
        gram: current.gram + gram,
        value: current.value + total
      })

      // Add to transactions list
      transactions.push({
        id: item.id,
        invoiceNumber: invoice.invoice_number,
        date: invoice.invoice_date,
        customerName: invoice.customer_name,
        gram,
        ratePerGram: rate,
        total
      })
    })
  })

  const summary: BuybackSummary = {
    totalGram,
    totalValue,
    averageRatePerGram: totalGram > 0 ? totalValue / totalGram : 0,
    transactionCount: transactions.length,
    customerCount: uniqueCustomers.size
  }

  // Build trend chart
  const trendChart: BuybackDataPoint[] = Array.from(trendByDate.entries())
    .map(([date, data]) => ({
      date,
      displayDate: formatDisplayDate(date),
      gram: data.gram,
      value: data.value
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    summary,
    trendChart,
    transactions
  }
}

/**
 * Get detailed invoice report data with pagination and filters
 */
export async function getReportDetailData(
  userId: string,
  dateRange: DateRange,
  page: number = 1,
  pageSize: number = 20,
  typeFilter: 'all' | 'regular' | 'buyback' = 'all',
  search: string = ''
): Promise<ReportDetailData> {
  const supabase = await createClient()

  // Get user's store
  const { data: store } = await supabase
    .from('stores')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (!store) {
    return {
      invoices: [],
      totalCount: 0
    }
  }

  // Build base query
  let query = supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      invoice_date,
      customer_name,
      total,
      invoice_items (
        id,
        is_buyback
      )
    `, { count: 'exact' })
    .eq('store_id', store.id)
    .gte('invoice_date', dateRange.from)
    .lte('invoice_date', dateRange.to)

  // Apply search filter
  if (search) {
    query = query.or(`customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`)
  }

  // Fetch all invoices first for type filtering (since we need to check items)
  const { data: allInvoices, count } = await query

  if (!allInvoices) {
    return {
      invoices: [],
      totalCount: 0
    }
  }

  // Filter by type and transform to InvoiceRow
  let filteredInvoices = allInvoices.map((invoice) => {
    const items = invoice.invoice_items || []
    const hasBuybackItems = items.some((item: any) => item.is_buyback)
    const type: 'regular' | 'buyback' = hasBuybackItems ? 'buyback' : 'regular'

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      date: invoice.invoice_date,
      customerName: invoice.customer_name,
      type,
      itemCount: items.length,
      total: invoice.total
    }
  })

  // Apply type filter
  if (typeFilter !== 'all') {
    filteredInvoices = filteredInvoices.filter((inv) => inv.type === typeFilter)
  }

  // Sort by date descending
  filteredInvoices.sort((a, b) => b.date.localeCompare(a.date))

  // Apply pagination
  const totalCount = filteredInvoices.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedInvoices = filteredInvoices.slice(start, end)

  return {
    invoices: paginatedInvoices,
    totalCount
  }
}
