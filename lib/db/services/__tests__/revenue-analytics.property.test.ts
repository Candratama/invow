/**
 * Property-Based Tests for Revenue Analytics
 *
 * **Feature: admin-panel-phase2, Property 15: Revenue total calculation**
 * **Feature: admin-panel-phase2, Property 16: Daily revenue aggregation**
 * **Feature: admin-panel-phase2, Property 17: Revenue tier breakdown sum**
 * **Feature: admin-panel-phase2, Property 18: Analytics date range filtering**
 * **Feature: admin-panel-phase2, Property 19: Revenue period comparison calculation**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateTotalRevenue,
  aggregateDailyRevenue,
  calculateRevenueByTier,
  calculatePercentageChange,
  filterTransactionsByDateRange,
  isWithinDateRange,
  TransactionRecord,
} from "../admin-analytics.service";

// Generators
const statusArb = fc.constantFrom("pending", "completed", "failed");
const tierArb = fc.constantFrom("free", "premium", "enterprise");
const paymentMethodArb = fc.option(
  fc.constantFrom("bank_transfer", "credit_card", "e_wallet"),
  { nil: null }
);

// Generate timestamps within a reasonable range (last year)
const timestampArb = fc
  .integer({
    min: Date.now() - 365 * 24 * 60 * 60 * 1000,
    max: Date.now(),
  })
  .map((ts) => new Date(ts).toISOString());

// Generate date strings for date range testing
const dateStringArb = fc
  .integer({
    min: Date.now() - 180 * 24 * 60 * 60 * 1000,
    max: Date.now(),
  })
  .map((ts) => new Date(ts).toISOString().split("T")[0]);

// Transaction record generator
const transactionRecordArb: fc.Arbitrary<TransactionRecord> = fc.record({
  id: fc.uuid(),
  amount: fc.integer({ min: 10000, max: 1000000 }),
  tier: tierArb,
  status: statusArb,
  paymentMethod: paymentMethodArb,
  createdAt: timestampArb,
  completedAt: fc.option(timestampArb, { nil: null }),
});

// Generate list of transactions
const transactionsListArb = fc.array(transactionRecordArb, {
  minLength: 0,
  maxLength: 100,
});

// Generate completed transactions only
const completedTransactionArb: fc.Arbitrary<TransactionRecord> = fc.record({
  id: fc.uuid(),
  amount: fc.integer({ min: 10000, max: 1000000 }),
  tier: tierArb,
  status: fc.constant("completed"),
  paymentMethod: paymentMethodArb,
  createdAt: timestampArb,
  completedAt: fc.option(timestampArb, { nil: null }),
});

const completedTransactionsListArb = fc.array(completedTransactionArb, {
  minLength: 0,
  maxLength: 50,
});

describe("Property 15: Revenue total calculation", () => {
  /**
   * **Feature: admin-panel-phase2, Property 15: Revenue total calculation**
   * *For any* revenue analytics query, totalRevenue equals the sum of amount
   * for all completed payment transactions
   * **Validates: Requirements 7.1**
   */

  it("should calculate total revenue as sum of completed transaction amounts", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const totalRevenue = calculateTotalRevenue(transactions);

        // Calculate expected sum manually
        const expectedSum = transactions
          .filter((t) => t.status === "completed")
          .reduce((sum, t) => sum + t.amount, 0);

        // Property: totalRevenue equals sum of completed transaction amounts
        expect(totalRevenue).toBe(expectedSum);
      }),
      { numRuns: 100 }
    );
  });

  it("should return 0 when no completed transactions exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          transactionRecordArb.map((t) => ({
            ...t,
            status: fc.sample(fc.constantFrom("pending", "failed"), 1)[0],
          })),
          { minLength: 0, maxLength: 20 }
        ),
        async (transactions) => {
          // Ensure no completed transactions
          const nonCompleted = transactions.map((t) => ({
            ...t,
            status: t.status === "completed" ? "pending" : t.status,
          }));

          const totalRevenue = calculateTotalRevenue(nonCompleted);

          // Property: totalRevenue is 0 when no completed transactions
          expect(totalRevenue).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not include pending or failed transactions in total", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const totalRevenue = calculateTotalRevenue(transactions);

        // Sum of non-completed transactions
        const nonCompletedSum = transactions
          .filter((t) => t.status !== "completed")
          .reduce((sum, t) => sum + t.amount, 0);

        // Sum of all transactions
        const allSum = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Property: totalRevenue + nonCompletedSum should equal allSum
        // (if there are non-completed transactions)
        if (nonCompletedSum > 0) {
          expect(totalRevenue + nonCompletedSum).toBe(allSum);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 16: Daily revenue aggregation", () => {
  /**
   * **Feature: admin-panel-phase2, Property 16: Daily revenue aggregation**
   * *For any* revenue analytics query, each dailyRevenue data point value
   * equals the sum of completed transaction amounts for that specific date
   * **Validates: Requirements 7.2**
   */

  it("should aggregate daily revenue correctly for each date", async () => {
    await fc.assert(
      fc.asyncProperty(
        completedTransactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          // Ensure dateFrom <= dateTo
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          // Filter transactions to be within date range
          const filteredTransactions = transactions.filter((t) =>
            isWithinDateRange(t.createdAt, dateFrom, dateTo)
          );

          const dailyRevenue = aggregateDailyRevenue(
            filteredTransactions,
            dateFrom,
            dateTo
          );

          // For each data point, verify the sum is correct
          for (const dataPoint of dailyRevenue) {
            const expectedSum = filteredTransactions
              .filter(
                (t) =>
                  new Date(t.createdAt).toISOString().split("T")[0] ===
                  dataPoint.date
              )
              .reduce((sum, t) => sum + t.amount, 0);

            // Property: Each daily value equals sum of that day's transactions
            expect(dataPoint.value).toBe(expectedSum);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include all dates in range even with zero revenue", async () => {
    await fc.assert(
      fc.asyncProperty(
        dateStringArb,
        dateStringArb,
        async (date1, date2) => {
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          // Empty transactions
          const dailyRevenue = aggregateDailyRevenue([], dateFrom, dateTo);

          // Calculate expected number of days
          const start = new Date(dateFrom);
          const end = new Date(dateTo);
          const expectedDays =
            Math.floor(
              (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
            ) + 1;

          // Property: All dates in range are included
          expect(dailyRevenue.length).toBe(expectedDays);

          // Property: All values are 0 for empty transactions
          for (const dp of dailyRevenue) {
            expect(dp.value).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return data points sorted by date ascending", async () => {
    await fc.assert(
      fc.asyncProperty(
        completedTransactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          const dailyRevenue = aggregateDailyRevenue(
            transactions,
            dateFrom,
            dateTo
          );

          // Property: Data points are sorted by date ascending
          for (let i = 1; i < dailyRevenue.length; i++) {
            expect(dailyRevenue[i].date >= dailyRevenue[i - 1].date).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 17: Revenue tier breakdown sum", () => {
  /**
   * **Feature: admin-panel-phase2, Property 17: Revenue tier breakdown sum**
   * *For any* revenue analytics query, the sum of all revenueByTier amounts
   * equals totalRevenue
   * **Validates: Requirements 7.3**
   */

  it("should have tier breakdown sum equal to total revenue", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const totalRevenue = calculateTotalRevenue(transactions);
        const revenueByTier = calculateRevenueByTier(transactions);

        // Sum of all tier amounts
        const tierSum = revenueByTier.reduce((sum, t) => sum + t.amount, 0);

        // Property: Sum of tier breakdown equals total revenue
        expect(tierSum).toBe(totalRevenue);
      }),
      { numRuns: 100 }
    );
  });

  it("should group all completed transactions by their tier", async () => {
    await fc.assert(
      fc.asyncProperty(completedTransactionsListArb, async (transactions) => {
        const revenueByTier = calculateRevenueByTier(transactions);

        // Get unique tiers from transactions
        const uniqueTiers = new Set(transactions.map((t) => t.tier));

        // Property: Each unique tier appears in breakdown
        for (const tier of uniqueTiers) {
          const tierEntry = revenueByTier.find((r) => r.tier === tier);
          expect(tierEntry).toBeDefined();

          // Verify amount for this tier
          const expectedAmount = transactions
            .filter((t) => t.tier === tier)
            .reduce((sum, t) => sum + t.amount, 0);
          expect(tierEntry?.amount).toBe(expectedAmount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should return empty array when no completed transactions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          transactionRecordArb.map((t) => ({ ...t, status: "pending" })),
          { minLength: 0, maxLength: 20 }
        ),
        async (transactions) => {
          const revenueByTier = calculateRevenueByTier(transactions);

          // Property: Empty breakdown when no completed transactions
          expect(revenueByTier.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 18: Analytics date range filtering", () => {
  /**
   * **Feature: admin-panel-phase2, Property 18: Analytics date range filtering**
   * *For any* analytics query with date range, all data points fall within
   * the specified date range
   * **Validates: Requirements 7.4, 8.6, 9.6**
   */

  it("should filter transactions to only include those within date range", async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          const filtered = filterTransactionsByDateRange(
            transactions,
            dateFrom,
            dateTo
          );

          // Property: All filtered transactions are within date range
          for (const t of filtered) {
            expect(isWithinDateRange(t.createdAt, dateFrom, dateTo)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not include transactions outside date range", async () => {
    await fc.assert(
      fc.asyncProperty(
        transactionsListArb,
        dateStringArb,
        dateStringArb,
        async (transactions, date1, date2) => {
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          const filtered = filterTransactionsByDateRange(
            transactions,
            dateFrom,
            dateTo
          );

          // Count transactions outside range in original
          const outsideCount = transactions.filter(
            (t) => !isWithinDateRange(t.createdAt, dateFrom, dateTo)
          ).length;

          // Property: Filtered count + outside count = original count
          expect(filtered.length + outsideCount).toBe(transactions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include transactions on boundary dates (inclusive)", async () => {
    await fc.assert(
      fc.asyncProperty(dateStringArb, async (date) => {
        // Create transaction exactly on the date
        const transaction: TransactionRecord = {
          id: "test-id",
          amount: 100000,
          tier: "premium",
          status: "completed",
          paymentMethod: null,
          createdAt: `${date}T12:00:00.000Z`,
          completedAt: null,
        };

        // Property: Transaction on boundary date is included
        expect(isWithinDateRange(transaction.createdAt, date, date)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 19: Revenue period comparison calculation", () => {
  /**
   * **Feature: admin-panel-phase2, Property 19: Revenue period comparison calculation**
   * *For any* revenue analytics query, percentageChange equals
   * ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
   * **Validates: Requirements 7.5**
   */

  it("should calculate percentage change correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 10000000 }),
        fc.integer({ min: 1, max: 10000000 }), // Previous must be > 0 for division
        async (current, previous) => {
          const percentageChange = calculatePercentageChange(current, previous);

          // Calculate expected percentage
          const expected =
            Math.round(((current - previous) / previous) * 100 * 100) / 100;

          // Property: Percentage change matches formula
          expect(percentageChange).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 100 when previous is 0 and current is positive", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000000 }),
        async (current) => {
          const percentageChange = calculatePercentageChange(current, 0);

          // Property: 100% increase when going from 0 to positive
          expect(percentageChange).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 when both current and previous are 0", async () => {
    const percentageChange = calculatePercentageChange(0, 0);

    // Property: 0% change when both are 0
    expect(percentageChange).toBe(0);
  });

  it("should return negative percentage when current is significantly less than previous", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 100000 }),
        async (base) => {
          // Ensure current is at least 10% less than previous to avoid rounding to 0
          const previous = base * 2;
          const current = base;
          const percentageChange = calculatePercentageChange(current, previous);

          // Property: Negative percentage when current < previous (with significant difference)
          expect(percentageChange).toBeLessThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return positive percentage when current is significantly greater than previous", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 100000 }),
        async (base) => {
          // Ensure current is at least 10% more than previous to avoid rounding to 0
          const previous = base;
          const current = base * 2;
          const percentageChange = calculatePercentageChange(current, previous);

          // Property: Positive percentage when current > previous (with significant difference)
          expect(percentageChange).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 when current equals previous", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10000000 }),
        async (value) => {
          const percentageChange = calculatePercentageChange(value, value);

          // Property: 0% change when values are equal
          expect(percentageChange).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
