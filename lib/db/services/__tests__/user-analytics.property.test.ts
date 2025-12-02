/**
 * Property-Based Tests for User Analytics
 *
 * **Feature: admin-panel-phase2, Property 20: User tier distribution sum**
 * **Feature: admin-panel-phase2, Property 21: Conversion rate calculation**
 * **Feature: admin-panel-phase2, Property 22: Churn rate calculation**
 * **Validates: Requirements 8.3, 8.4, 8.5**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  calculateUsersByTier,
  calculateConversionRate,
  calculateChurnRate,
  aggregateDailyRegistrations,
  filterUsersByDateRange,
  isWithinDateRange,
  UserRecord,
  UserSubscriptionRecord,
} from "../admin-analytics.service";

// Generators
const tierArb = fc.constantFrom("free", "premium", "enterprise");

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

// User record generator
const userRecordArb: fc.Arbitrary<UserRecord> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  createdAt: timestampArb,
});

// Generate list of users
const usersListArb = fc.array(userRecordArb, {
  minLength: 0,
  maxLength: 100,
});

// User subscription record generator
const userSubscriptionRecordArb: fc.Arbitrary<UserSubscriptionRecord> = fc.record({
  userId: fc.uuid(),
  tier: tierArb,
  subscriptionStartDate: timestampArb,
  subscriptionEndDate: fc.option(timestampArb, { nil: null }),
});

// Generate list of subscriptions
const subscriptionsListArb = fc.array(userSubscriptionRecordArb, {
  minLength: 0,
  maxLength: 50,
});

describe("Property 20: User tier distribution sum", () => {
  /**
   * **Feature: admin-panel-phase2, Property 20: User tier distribution sum**
   * *For any* user analytics query, the sum of all usersByTier counts equals totalUsers
   * **Validates: Requirements 8.3**
   */

  it("should have tier distribution sum equal to total users", async () => {
    await fc.assert(
      fc.asyncProperty(
        subscriptionsListArb,
        fc.integer({ min: 0, max: 100 }),
        async (subscriptions, extraFreeUsers) => {
          // Total users = subscribed users + extra free users (without subscription)
          const totalUsers = subscriptions.length + extraFreeUsers;
          const usersByTier = calculateUsersByTier(subscriptions, totalUsers);

          // Sum of all tier counts
          const tierSum = usersByTier.reduce((sum, t) => sum + t.count, 0);

          // Property: Sum of tier distribution equals total users
          expect(tierSum).toBe(totalUsers);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should count all subscribed users by their tier", async () => {
    await fc.assert(
      fc.asyncProperty(subscriptionsListArb, async (subscriptions) => {
        // Total users = number of subscriptions (each subscription is a user)
        const totalUsers = subscriptions.length;
        const usersByTier = calculateUsersByTier(subscriptions, totalUsers);

        // Get unique tiers from subscriptions
        const uniqueTiers = new Set(subscriptions.map((s) => s.tier));

        // Property: Each unique tier appears in distribution
        for (const tier of uniqueTiers) {
          const tierEntry = usersByTier.find((t) => t.tier === tier);
          expect(tierEntry).toBeDefined();

          // Verify count for this tier
          const expectedCount = subscriptions.filter((s) => s.tier === tier).length;
          expect(tierEntry?.count).toBe(expectedCount);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should assign unsubscribed users to free tier", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }),
        subscriptionsListArb.filter((subs) => subs.length < 10),
        async (totalUsers, subscriptions) => {
          const usersByTier = calculateUsersByTier(subscriptions, totalUsers);

          // Count subscribed users
          const subscribedCount = subscriptions.length;
          const expectedFreeUsers = totalUsers - subscribedCount;

          // Find free tier entry
          const freeEntry = usersByTier.find((t) => t.tier === "free");

          if (expectedFreeUsers > 0) {
            // Property: Free tier includes unsubscribed users
            expect(freeEntry).toBeDefined();
            expect(freeEntry!.count).toBeGreaterThanOrEqual(expectedFreeUsers);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return empty array when total users is 0", async () => {
    const usersByTier = calculateUsersByTier([], 0);

    // Property: Empty distribution when no users
    expect(usersByTier.length).toBe(0);
  });
});

describe("Property 21: Conversion rate calculation", () => {
  /**
   * **Feature: admin-panel-phase2, Property 21: Conversion rate calculation**
   * *For any* user analytics query, conversionRate equals
   * (premiumUpgrades / totalFreeUsers) * 100
   * **Validates: Requirements 8.4**
   */

  it("should calculate conversion rate correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }), // totalFreeUsers must be > 0 for division
        async (premiumUpgrades, totalFreeUsers) => {
          const conversionRate = calculateConversionRate(premiumUpgrades, totalFreeUsers);

          // Calculate expected rate
          const expected = Math.round((premiumUpgrades / totalFreeUsers) * 100 * 100) / 100;

          // Property: Conversion rate matches formula
          expect(conversionRate).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 when total free users is 0", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        async (premiumUpgrades) => {
          const conversionRate = calculateConversionRate(premiumUpgrades, 0);

          // Property: 0% conversion when no free users
          expect(conversionRate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 100 when all free users converted", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (count) => {
          const conversionRate = calculateConversionRate(count, count);

          // Property: 100% conversion when all free users upgraded
          expect(conversionRate).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return value between 0 and 100 for valid inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 100, max: 1000 }),
        async (premiumUpgrades, totalFreeUsers) => {
          const conversionRate = calculateConversionRate(premiumUpgrades, totalFreeUsers);

          // Property: Conversion rate is between 0 and 100 when upgrades <= free users
          expect(conversionRate).toBeGreaterThanOrEqual(0);
          expect(conversionRate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Property 22: Churn rate calculation", () => {
  /**
   * **Feature: admin-panel-phase2, Property 22: Churn rate calculation**
   * *For any* user analytics query, churnRate equals
   * (expiredPremiumUsers / totalPremiumUsers) * 100
   * **Validates: Requirements 8.5**
   */

  it("should calculate churn rate correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }), // totalPremiumUsers must be > 0 for division
        async (expiredPremiumUsers, totalPremiumUsers) => {
          const churnRate = calculateChurnRate(expiredPremiumUsers, totalPremiumUsers);

          // Calculate expected rate
          const expected = Math.round((expiredPremiumUsers / totalPremiumUsers) * 100 * 100) / 100;

          // Property: Churn rate matches formula
          expect(churnRate).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 when total premium users is 0", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 1000 }),
        async (expiredPremiumUsers) => {
          const churnRate = calculateChurnRate(expiredPremiumUsers, 0);

          // Property: 0% churn when no premium users
          expect(churnRate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 100 when all premium users churned", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (count) => {
          const churnRate = calculateChurnRate(count, count);

          // Property: 100% churn when all premium users expired
          expect(churnRate).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return 0 when no premium users churned", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1000 }),
        async (totalPremiumUsers) => {
          const churnRate = calculateChurnRate(0, totalPremiumUsers);

          // Property: 0% churn when no users expired
          expect(churnRate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should return value between 0 and 100 for valid inputs", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 100, max: 1000 }),
        async (expiredPremiumUsers, totalPremiumUsers) => {
          const churnRate = calculateChurnRate(expiredPremiumUsers, totalPremiumUsers);

          // Property: Churn rate is between 0 and 100 when expired <= total
          expect(churnRate).toBeGreaterThanOrEqual(0);
          expect(churnRate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("User Analytics - Daily Registrations", () => {
  /**
   * Additional tests for daily registration aggregation
   * Supporting Properties 20-22
   */

  it("should aggregate daily registrations correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        dateStringArb,
        dateStringArb,
        async (users, date1, date2) => {
          // Ensure dateFrom <= dateTo
          const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1];

          // Filter users to be within date range
          const filteredUsers = filterUsersByDateRange(users, dateFrom, dateTo);

          const dailyRegistrations = aggregateDailyRegistrations(
            filteredUsers,
            dateFrom,
            dateTo
          );

          // For each data point, verify the count is correct
          for (const dataPoint of dailyRegistrations) {
            const expectedCount = filteredUsers.filter(
              (u) =>
                new Date(u.createdAt).toISOString().split("T")[0] === dataPoint.date
            ).length;

            // Property: Each daily value equals count of that day's registrations
            expect(dataPoint.value).toBe(expectedCount);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include all dates in range even with zero registrations", async () => {
    await fc.assert(
      fc.asyncProperty(dateStringArb, dateStringArb, async (date1, date2) => {
        const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1];

        // Empty users
        const dailyRegistrations = aggregateDailyRegistrations([], dateFrom, dateTo);

        // Calculate expected number of days
        const start = new Date(dateFrom);
        const end = new Date(dateTo);
        const expectedDays =
          Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        // Property: All dates in range are included
        expect(dailyRegistrations.length).toBe(expectedDays);

        // Property: All values are 0 for empty users
        for (const dp of dailyRegistrations) {
          expect(dp.value).toBe(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("should filter users by date range correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        usersListArb,
        dateStringArb,
        dateStringArb,
        async (users, date1, date2) => {
          const [dateFrom, dateTo] = date1 <= date2 ? [date1, date2] : [date2, date1];

          const filtered = filterUsersByDateRange(users, dateFrom, dateTo);

          // Property: All filtered users are within date range
          for (const u of filtered) {
            expect(isWithinDateRange(u.createdAt, dateFrom, dateTo)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
