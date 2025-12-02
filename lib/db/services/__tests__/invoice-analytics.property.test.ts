/**
 * Property-Based Tests for Invoice Analytics
 *
 * **Feature: admin-panel-phase2, Property 23: Invoice status distribution sum**
 * **Validates: Requirements 9.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateInvoicesByStatus,
  aggregateDailyInvoices,
  filterInvoicesByDateRange,
  calculateAverageInvoiceValue,
  calculateTotalInvoiceValue,
  isWithinDateRange,
  InvoiceRecord,
} from "../admin-analytics.service";

// Generators
const statusArb = fc.constantFrom("draft", "pending", "synced") as fc.Arbitrary<
  "draft" | "pending" | "synced"
>;

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

// Invoice record generator
const invoiceRecordArb: fc.Arbitrary<InvoiceRecord> = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  invoiceNumber: fc.string({ minLength: 1, maxLength: 20 }),
  customerName: fc.string({ minLength: 1, maxLength: 50 }),
  total: fc.integer({ min: 0, max: 100000000 }),
  status: statusArb,
  createdAt: timestampArb,
});

// Generate list of invoices
const invoicesListArb = fc.array(invoiceRecordArb, {
  minLength: 0,
  maxLength: 100,
});

describe("Property 23: Invoice status distribution sum", () => {
  /**
   * **Feature: admin-panel-phase2, Property 23: Invoice status distribution sum**
   * *For any* invoice analytics query, the sum of all invoicesByStatus counts equals totalInvoices
   * **Validates: Requirements 9.3**
   */

  it("should have status distribution sum equal to total invoices", async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const invoicesByStatus = calculateInvoicesByStatus(invoices);

        // Sum of all status counts
        const statusSum = invoicesByStatus.reduce((sum, s) => sum + s.count, 0);

        // Property: Sum of status distribution equals total invoices
        expect(statusSum).toBe(invoices.length);
      }),
      { numRuns: 100 }
    );
  });

  it("should count all invoices by their status", async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const invoicesByStatus = calculateInvoicesByStatus(invoices);

        // Get unique statuses from invoices
        const uniqueStatuses = new Set(invoices.map((i) => i.status));

        // Property: Each unique status appears in distribution
        for (const status of uniqueStatuses) {
          const statusEntry = invoicesByStatus.find((s) => s.status === status);
          expect(statusEntry).toBeDefined();

          // Verify count for this status
          const expectedCount = invoices.filter((i) => i.status === status).length;
          expect(statusEntry?.count).toBe(expectedCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should return empty array when no invoices", async () => {
    const invoicesByStatus = calculateInvoicesByStatus([]);

    // Property: Empty distribution when no invoices
    expect(invoicesByStatus.length).toBe(0);
  });

  it("should sort status distribution by count descending", async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb.filter((inv) => inv.length > 0),
        async (invoices) => {
          const invoicesByStatus = calculateInvoicesByStatus(invoices);

          // Property: Distribution is sorted by count descending
          for (let i = 1; i < invoicesByStatus.length; i++) {
            expect(invoicesByStatus[i - 1].count).toBeGreaterThanOrEqual(
              invoicesByStatus[i].count
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Invoice Analytics - Daily Invoices", () => {
  /**
   * Additional tests for daily invoice aggregation
   * Supporting Property 23
   */

  it("should aggregate daily invoices correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        dateStringArb,
        dateStringArb,
        async (invoices, date1, date2) => {
          // Ensure dateFrom <= dateTo
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          // Filter invoices to be within date range
          const filteredInvoices = filterInvoicesByDateRange(
            invoices,
            dateFrom,
            dateTo
          );

          const dailyInvoices = aggregateDailyInvoices(
            filteredInvoices,
            dateFrom,
            dateTo
          );

          // For each data point, verify the count is correct
          for (const dataPoint of dailyInvoices) {
            const expectedCount = filteredInvoices.filter(
              (i) =>
                new Date(i.createdAt).toISOString().split("T")[0] ===
                dataPoint.date
            ).length;

            // Property: Each daily value equals count of that day's invoices
            expect(dataPoint.value).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include all dates in range even with zero invoices", async () => {
    await fc.assert(
      fc.asyncProperty(dateStringArb, dateStringArb, async (date1, date2) => {
        const [dateFrom, dateTo] =
          date1 <= date2 ? [date1, date2] : [date2, date1];

        // Empty invoices
        const dailyInvoices = aggregateDailyInvoices([], dateFrom, dateTo);

        // Calculate expected number of days
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        const expectedDays =
          Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) +
          1;

        // Property: All dates in range are included
        expect(dailyInvoices.length).toBe(expectedDays);

        // Property: All values are 0 for empty invoices
        for (const dp of dailyInvoices) {
          expect(dp.value).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should filter invoices by date range correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb,
        dateStringArb,
        dateStringArb,
        async (invoices, date1, date2) => {
          const [dateFrom, dateTo] =
            date1 <= date2 ? [date1, date2] : [date2, date1];

          const filtered = filterInvoicesByDateRange(invoices, dateFrom, dateTo);

          // Property: All filtered invoices are within date range
          for (const i of filtered) {
            expect(isWithinDateRange(i.createdAt, dateFrom, dateTo)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Invoice Analytics - Value Calculations", () => {
  /**
   * Tests for invoice value calculations
   */

  it("should calculate average invoice value correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        invoicesListArb.filter((inv) => inv.length > 0),
        async (invoices) => {
          const average = calculateAverageInvoiceValue(invoices);
          const total = invoices.reduce((sum, i) => sum + i.total, 0);
          const expected = Math.round(total / invoices.length);

          // Property: Average equals total / count (rounded)
          expect(average).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 for average when no invoices", async () => {
    const average = calculateAverageInvoiceValue([]);

    // Property: Average is 0 when no invoices
    expect(average).toBe(0);
  });

  it("should calculate total invoice value correctly", async () => {
    await fc.assert(
      fc.asyncProperty(invoicesListArb, async (invoices) => {
        const total = calculateTotalInvoiceValue(invoices);
        const expected = invoices.reduce((sum, i) => sum + i.total, 0);

        // Property: Total equals sum of all invoice totals
        expect(total).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it("should return 0 for total when no invoices", async () => {
    const total = calculateTotalInvoiceValue([]);

    // Property: Total is 0 when no invoices
    expect(total).toBe(0);
  });
});
