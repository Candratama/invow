import { describe, it, expect } from 'vitest'
import {
  calculateGrowthRate,
  calculateAOV,
  calculateCustomerTypeBreakdown,
  calculateSalesTypeBreakdown,
  generateComparisonData,
  generateInsights,
} from '../reports'

describe('Reports Calculations', () => {
  describe('calculateGrowthRate', () => {
    it('calculates positive growth correctly', () => {
      expect(calculateGrowthRate(125000000, 108000000)).toBeCloseTo(15.7, 1)
    })

    it('calculates negative growth correctly', () => {
      expect(calculateGrowthRate(90000000, 100000000)).toBeCloseTo(-10, 1)
    })

    it('handles zero previous period', () => {
      expect(calculateGrowthRate(100000, 0)).toBe(100)
    })

    it('handles zero current period', () => {
      expect(calculateGrowthRate(0, 100000)).toBe(-100)
    })
  })

  describe('calculateAOV', () => {
    it('calculates average order value', () => {
      expect(calculateAOV(125000000, 45)).toBeCloseTo(2777778, 0)
    })

    it('handles zero invoices', () => {
      expect(calculateAOV(100000, 0)).toBe(0)
    })
  })

  describe('calculateCustomerTypeBreakdown', () => {
    it('calculates breakdown with percentages', () => {
      const invoices = [
        { customer_status: 'Distributor', total: 45000000 },
        { customer_status: 'Distributor', total: 55000000 },
        { customer_status: 'Reseller', total: 25000000 },
      ]

      const breakdown = calculateCustomerTypeBreakdown(invoices)

      expect(breakdown).toHaveLength(2)

      const distributor = breakdown.find((b) => b.type === 'Distributor')
      expect(distributor?.count).toBe(2)
      expect(distributor?.revenue).toBe(100000000)
      expect(distributor?.percentage).toBeCloseTo(80, 1)
    })
  })

  describe('generateInsights', () => {
    it('generates insight for revenue up, count down', () => {
      const comparisons = [
        { metric: 'Total Revenue', changePercentage: 15.7 } as any,
        { metric: 'Invoice Count', changePercentage: -10 } as any,
      ]

      const insights = generateInsights(comparisons)
      expect(insights[0]).toContain('Higher average order value')
    })
  })

  describe('calculateSalesTypeBreakdown', () => {
    it('separates buyback and regular revenue correctly', () => {
      const invoices = [
        { total: 50000000, has_buyback: false },
        { total: 30000000, has_buyback: true },
        { total: 20000000, has_buyback: false },
      ]

      const breakdown = calculateSalesTypeBreakdown(invoices)

      expect(breakdown.regularRevenue).toBe(70000000)
      expect(breakdown.buybackRevenue).toBe(30000000)
      expect(breakdown.regularPercentage).toBeCloseTo(70, 1)
      expect(breakdown.buybackPercentage).toBeCloseTo(30, 1)
    })

    it('handles all buyback invoices', () => {
      const invoices = [
        { total: 100000, has_buyback: true },
        { total: 200000, has_buyback: true },
      ]

      const breakdown = calculateSalesTypeBreakdown(invoices)

      expect(breakdown.buybackRevenue).toBe(300000)
      expect(breakdown.regularRevenue).toBe(0)
      expect(breakdown.buybackPercentage).toBe(100)
    })

    it('handles empty invoice array', () => {
      const breakdown = calculateSalesTypeBreakdown([])

      expect(breakdown.regularRevenue).toBe(0)
      expect(breakdown.buybackRevenue).toBe(0)
      expect(breakdown.regularPercentage).toBe(0)
      expect(breakdown.buybackPercentage).toBe(0)
    })
  })

  describe('generateComparisonData', () => {
    it('generates all three comparison metrics', () => {
      const current = { revenue: 125000000, count: 45, aov: 2777778 }
      const previous = { revenue: 108000000, count: 50, aov: 2160000 }

      const comparisons = generateComparisonData(current, previous)

      expect(comparisons).toHaveLength(3)
      expect(comparisons.map(c => c.metric)).toEqual([
        'Total Revenue',
        'Invoice Count',
        'Avg Order Value'
      ])
    })

    it('calculates changes correctly', () => {
      const current = { revenue: 125000000, count: 45, aov: 2777778 }
      const previous = { revenue: 108000000, count: 50, aov: 2160000 }

      const comparisons = generateComparisonData(current, previous)
      const revenueComparison = comparisons[0]

      expect(revenueComparison.current).toBe(125000000)
      expect(revenueComparison.previous).toBe(108000000)
      expect(revenueComparison.change).toBe(17000000)
      expect(revenueComparison.changePercentage).toBeCloseTo(15.7, 1)
    })
  })
})
