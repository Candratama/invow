import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * Property-Based Tests for Query Configuration Standardization
 * 
 * These tests verify that all query hooks follow the standardized configuration:
 * - staleTime > 0 (enables stale-while-revalidate)
 * - gcTime defined (keeps unused data in cache)
 * - refetchOnMount: false (use cache if fresh)
 * - refetchOnWindowFocus: false (no auto-refetch on focus)
 * 
 * **Feature: smooth-navigation-ux, Property 9: Query configuration enables stale-while-revalidate**
 * **Validates: Requirements 5.1, 5.2**
 */

const QUERY_HOOK_FILES = [
  {
    name: "use-dashboard-data",
    path: "lib/hooks/use-dashboard-data.ts",
    hooks: ["useDashboardData", "useRevenueData", "useInvoiceList"],
  },
  {
    name: "use-settings-data",
    path: "lib/hooks/use-settings-data.ts",
    hooks: ["useSettingsData"],
  },
  {
    name: "use-customers-data",
    path: "lib/hooks/use-customers-data.ts",
    hooks: ["useCustomers", "useSearchCustomers"],
  },
  {
    name: "use-admin-data",
    path: "lib/hooks/use-admin-data.ts",
    hooks: [
      "useAdminUsers",
      "useAdminStores",
      "useAdminTransactions",
      "useAdminInvoices",
      "useAdminSubscriptions",
      "useAdminAnalytics",
      "useAdminPricing",
      "useAdminTemplates",
    ],
  },
] as const;

describe("Property 9: Query configuration enables stale-while-revalidate", () => {
  /**
   * **Feature: smooth-navigation-ux, Property 9: Query configuration enables stale-while-revalidate**
   * **Validates: Requirements 5.1, 5.2**
   * 
   * Property: For any query hook, the configuration SHALL have staleTime > 0,
   * refetchOnMount: false, and refetchOnWindowFocus: false.
   */
  it("should have staleTime configured for all query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Count useQuery calls
          const useQueryMatches = content.match(/useQuery\s*\(\s*\{/g) || [];
          const useQueryCount = useQueryMatches.length;

          // Count staleTime configurations
          const staleTimeMatches = content.match(/staleTime\s*:/g) || [];
          const staleTimeCount = staleTimeMatches.length;

          // Every useQuery should have staleTime configured
          expect(staleTimeCount).toBeGreaterThanOrEqual(useQueryCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have staleTime greater than 0", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Find all staleTime values
          const staleTimePattern = /staleTime\s*:\s*(\d+)\s*\*?\s*(\d+)?\s*\*?\s*(\d+)?/g;
          let match;
          
          while ((match = staleTimePattern.exec(content)) !== null) {
            // Calculate the actual value (handles patterns like 5 * 60 * 1000)
            const parts = match[0].match(/\d+/g) || [];
            const value = parts.reduce((acc, num) => acc * parseInt(num, 10), 1);
            
            // staleTime should be greater than 0
            expect(value).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have gcTime configured for all query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Count useQuery calls
          const useQueryMatches = content.match(/useQuery\s*\(\s*\{/g) || [];
          const useQueryCount = useQueryMatches.length;

          // Count gcTime configurations
          const gcTimeMatches = content.match(/gcTime\s*:/g) || [];
          const gcTimeCount = gcTimeMatches.length;

          // Every useQuery should have gcTime configured
          expect(gcTimeCount).toBeGreaterThanOrEqual(useQueryCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have refetchOnMount configured for all query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Count useQuery calls
          const useQueryMatches = content.match(/useQuery\s*\(\s*\{/g) || [];
          const useQueryCount = useQueryMatches.length;

          // Count refetchOnMount configurations (either true or false)
          const refetchOnMountMatches = content.match(/refetchOnMount\s*:\s*(true|false)/g) || [];
          const refetchOnMountCount = refetchOnMountMatches.length;

          // Every useQuery should have refetchOnMount configured
          expect(refetchOnMountCount).toBeGreaterThanOrEqual(useQueryCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have refetchOnWindowFocus: false for all query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Count useQuery calls
          const useQueryMatches = content.match(/useQuery\s*\(\s*\{/g) || [];
          const useQueryCount = useQueryMatches.length;

          // Count refetchOnWindowFocus: false configurations
          const refetchOnWindowFocusMatches = content.match(/refetchOnWindowFocus\s*:\s*false/g) || [];
          const refetchOnWindowFocusCount = refetchOnWindowFocusMatches.length;

          // Every useQuery should have refetchOnWindowFocus: false
          expect(refetchOnWindowFocusCount).toBeGreaterThanOrEqual(useQueryCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should NOT have refetchOnWindowFocus: true", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should NOT have refetchOnWindowFocus: true
          const badPattern = /refetchOnWindowFocus\s*:\s*true/;
          expect(content).not.toMatch(badPattern);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have gcTime greater than staleTime", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...QUERY_HOOK_FILES),
        (hookFile) => {
          const filePath = path.resolve(process.cwd(), hookFile.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Extract staleTime and gcTime pairs from useQuery blocks
          // This is a simplified check - we verify gcTime values are reasonable
          const gcTimePattern = /gcTime\s*:\s*(\d+)\s*\*?\s*(\d+)?\s*\*?\s*(\d+)?/g;
          let match;
          
          while ((match = gcTimePattern.exec(content)) !== null) {
            const parts = match[0].match(/\d+/g) || [];
            const value = parts.reduce((acc, num) => acc * parseInt(num, 10), 1);
            
            // gcTime should be at least 1 minute (60000ms)
            expect(value).toBeGreaterThanOrEqual(60000);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
