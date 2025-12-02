/**
 * Property-Based Tests for CSV Export
 *
 * **Feature: admin-panel-phase2, Property 24: CSV export row count**
 * **Validates: Requirements 7.6**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  transactionsToCSVRows,
  generateRevenueCSV,
  TransactionRecord,
} from "../admin-analytics.service";

// Generators
const statusArb = fc.constantFrom("pending", "completed", "failed");
const tierArb = fc.constantFrom("free", "premium", "enterprise");
const paymentMethodArb = fc.option(
  fc.constantFrom("bank_transfer", "credit_card", "e_wallet"),
  { nil: null }
);

// Generate timestamps within a reasonable range
const timestampArb = fc
  .integer({
    min: Date.now() - 365 * 24 * 60 * 60 * 1000,
    max: Date.now(),
  })
  .map((ts) => new Date(ts).toISOString());

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

describe("Property 24: CSV export row count", () => {
  /**
   * **Feature: admin-panel-phase2, Property 24: CSV export row count**
   * *For any* CSV export action, the number of data rows in the generated CSV
   * equals the count of records matching the date range filter
   * **Validates: Requirements 7.6, 8.7, 9.7**
   */

  it("should have CSV row count equal to completed transaction count", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);

        // Count completed transactions
        const completedCount = transactions.filter(
          (t) => t.status === "completed"
        ).length;

        // Property: CSV row count equals completed transaction count
        expect(csvRows.length).toBe(completedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("should generate CSV with correct number of lines (header + data rows)", async () => {
    await fc.assert(
      fc.asyncProperty(completedTransactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);
        const csv = generateRevenueCSV(csvRows);

        // Split CSV into lines
        const lines = csv.split("\n");

        // Property: CSV has header line + data rows
        // Header is always present, so lines = 1 (header) + csvRows.length
        expect(lines.length).toBe(1 + csvRows.length);
      }),
      { numRuns: 100 }
    );
  });

  it("should include all completed transactions in CSV output", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);
        const completedTransactions = transactions.filter(
          (t) => t.status === "completed"
        );

        // Property: Each completed transaction has a corresponding CSV row
        expect(csvRows.length).toBe(completedTransactions.length);

        // Verify amounts are preserved
        const csvAmounts = csvRows.map((r) => r.amount).sort((a, b) => a - b);
        const transactionAmounts = completedTransactions
          .map((t) => t.amount)
          .sort((a, b) => a - b);

        expect(csvAmounts).toEqual(transactionAmounts);
      }),
      { numRuns: 100 }
    );
  });

  it("should not include pending or failed transactions in CSV", async () => {
    await fc.assert(
      fc.asyncProperty(transactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);

        // Count non-completed transactions
        const nonCompletedCount = transactions.filter(
          (t) => t.status !== "completed"
        ).length;

        // Property: CSV rows + non-completed = total transactions
        expect(csvRows.length + nonCompletedCount).toBe(transactions.length);
      }),
      { numRuns: 100 }
    );
  });

  it("should return empty CSV rows for empty transaction list", async () => {
    const csvRows = transactionsToCSVRows([]);

    // Property: Empty transactions produce empty CSV rows
    expect(csvRows.length).toBe(0);
  });

  it("should return empty CSV rows when no completed transactions", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          transactionRecordArb.map((t) => ({ ...t, status: "pending" })),
          { minLength: 1, maxLength: 20 }
        ),
        async (transactions) => {
          const csvRows = transactionsToCSVRows(transactions);

          // Property: No CSV rows when no completed transactions
          expect(csvRows.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should preserve transaction data in CSV rows", async () => {
    await fc.assert(
      fc.asyncProperty(completedTransactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);

        // Property: Each CSV row has valid data
        for (const row of csvRows) {
          expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(row.amount).toBeGreaterThan(0);
          expect(["free", "premium", "enterprise"]).toContain(row.tier);
          expect(row.paymentMethod).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should sort CSV rows by date ascending", async () => {
    await fc.assert(
      fc.asyncProperty(completedTransactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);

        // Property: CSV rows are sorted by date ascending
        for (let i = 1; i < csvRows.length; i++) {
          expect(csvRows[i].date >= csvRows[i - 1].date).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should generate valid CSV format with header", async () => {
    await fc.assert(
      fc.asyncProperty(completedTransactionsListArb, async (transactions) => {
        const csvRows = transactionsToCSVRows(transactions);
        const csv = generateRevenueCSV(csvRows);

        // Property: CSV starts with correct header
        const lines = csv.split("\n");
        expect(lines[0]).toBe("date,amount,tier,payment_method");
      }),
      { numRuns: 100 }
    );
  });

  it("should handle null payment method correctly", async () => {
    const transaction: TransactionRecord = {
      id: "test-id",
      amount: 100000,
      tier: "premium",
      status: "completed",
      paymentMethod: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const csvRows = transactionsToCSVRows([transaction]);

    // Property: Null payment method is converted to "unknown"
    expect(csvRows[0].paymentMethod).toBe("unknown");
  });
});
