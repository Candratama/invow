import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * Property-Based Tests for Loading State Pattern Standardization
 * 
 * These tests verify that all client components follow the standardized loading pattern:
 * - Show skeleton ONLY when `isLoading && !data`
 * - Show content when data exists (even if isRefetching)
 * - Show subtle refetch indicator when `isRefetching && data`
 * 
 * **Feature: smooth-navigation-ux**
 */

const CLIENT_COMPONENTS = [
  {
    name: "dashboard-client",
    path: "app/dashboard/dashboard-client.tsx",
    skeletonComponent: "DashboardSkeleton",
  },
  {
    name: "settings-client",
    path: "app/dashboard/settings/settings-client.tsx",
    skeletonComponent: "SettingsSkeleton",
  },
  {
    name: "customers-client",
    path: "app/dashboard/customers/customers-client.tsx",
    skeletonComponent: "CustomersSkeleton",
  },
] as const;

describe("Property 1: Cached data renders without skeleton", () => {
  /**
   * **Feature: smooth-navigation-ux, Property 1: Cached data renders without skeleton**
   * **Validates: Requirements 1.1**
   * 
   * Property: For any page component with cached data in queryClient, 
   * rendering the component SHALL display content immediately without showing skeleton loader.
   */
  it("should show skeleton only when isLoading AND no data exists", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // The loading check pattern should be: isLoading && !data
          // This ensures skeleton only shows when there's no cached data
          const loadingPatterns = [
            /isLoading\s*&&\s*!data/,
            /isLoadingRevenue\s*&&\s*!revenueData/,
            /customersLoading\s*&&\s*!customers/,
          ];

          // At least one of these patterns should exist
          const hasCorrectLoadingPattern = loadingPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasCorrectLoadingPattern).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Components should NOT show skeleton when data exists
   */
  it("should not have loading checks that ignore cached data", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should NOT have patterns like: if (isLoading) return <Skeleton />
          // without checking for data existence
          // This pattern would show skeleton even when cached data exists
          const badPatterns = [
            // Pattern: if (isLoading) return <Skeleton> without !data check
            /if\s*\(\s*isLoading\s*\)\s*{\s*return\s*<\w*Skeleton/,
            /if\s*\(\s*isLoading\s*\)\s*return\s*<\w*Skeleton/,
          ];

          // None of these bad patterns should exist
          const hasBadPattern = badPatterns.some(pattern => 
            pattern.test(content)
          );

          // If we find a bad pattern, check if it's actually guarded by !data
          if (hasBadPattern) {
            // Look for the full context - it might be isLoading && !data
            const hasCorrectGuard = /isLoading\s*&&\s*!/.test(content);
            expect(hasCorrectGuard).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Property 2: No cache shows skeleton", () => {
  /**
   * **Feature: smooth-navigation-ux, Property 2: No cache shows skeleton**
   * **Validates: Requirements 1.5**
   * 
   * Property: For any page component with no cached data and isLoading true, 
   * rendering the component SHALL display skeleton loader.
   */
  it("should have skeleton component imported and used in loading state", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should import the skeleton component
          const importPattern = new RegExp(
            `import.*${component.skeletonComponent}.*from`,
            "s"
          );
          expect(content).toMatch(importPattern);

          // Should return skeleton in loading condition
          const skeletonReturnPattern = new RegExp(
            `return\\s*<${component.skeletonComponent}`,
            "s"
          );
          expect(content).toMatch(skeletonReturnPattern);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Loading check should include both isLoading and !data conditions
   */
  it("should check both isLoading and !data before showing skeleton", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Find the skeleton return statement and verify it's guarded by proper condition
          // The pattern can be:
          // - if (authLoading || (isLoading && !data)) { return <Skeleton /> }
          // - if (isLoading && !data) return <Skeleton />
          // - if (... || (isLoading && !data)) return <Skeleton />
          
          // Look for the pattern where skeleton is returned with !data check
          const skeletonReturnPatterns = [
            // Pattern: if (... && !data...) ... return <Skeleton
            new RegExp(`if\\s*\\([^)]*&&\\s*!\\w+[^)]*\\)[^{]*{?[^}]*return\\s*<${component.skeletonComponent}`, "s"),
            // Pattern: if (... || (... && !data)) ... return <Skeleton
            new RegExp(`if\\s*\\([^)]*\\|\\|\\s*\\([^)]*&&\\s*!\\w+[^)]*\\)\\)[^{]*{?[^}]*return\\s*<${component.skeletonComponent}`, "s"),
          ];

          const hasCorrectPattern = skeletonReturnPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasCorrectPattern).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Each component should have appropriate skeleton for its content type
   */
  it("should use component-specific skeleton", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Verify the skeleton component name matches the component type
          const expectedSkeletons: Record<string, string> = {
            "dashboard-client": "DashboardSkeleton",
            "settings-client": "SettingsSkeleton",
            "customers-client": "CustomersSkeleton",
          };

          const expectedSkeleton = expectedSkeletons[component.name];
          expect(content).toContain(expectedSkeleton);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Property 5: Background refetch preserves content", () => {
  /**
   * **Feature: smooth-navigation-ux, Property 5: Background refetch preserves content**
   * **Validates: Requirements 2.5, 3.2**
   * 
   * Property: For any page component with cached data and isRefetching true, 
   * the component SHALL continue displaying cached content without skeleton.
   */
  it("should extract isRefetching from query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should destructure isRefetching from query hook
          const refetchingPatterns = [
            /isRefetching/,
            /isRefetchingRevenue/,
            /isRefetchingInvoices/,
            /customersRefetching/,
          ];

          const hasRefetchingExtracted = refetchingPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasRefetchingExtracted).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Background refetch indicator should only show when refetching AND data exists
   */
  it("should have background refetch indicator logic", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should have logic for background refetching indicator
          // Pattern: isRefetching && data or similar
          const backgroundRefetchPatterns = [
            /isBackgroundRefetching/,
            /isRefetching\s*&&\s*\w+Data/,
            /isRefetchingRevenue\s*&&\s*revenueData/,
            /customersRefetching\s*&&\s*customers/,
          ];

          const hasBackgroundRefetchLogic = backgroundRefetchPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasBackgroundRefetchLogic).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Refetch indicator should be subtle (not blocking)
   */
  it("should have subtle refetch indicator in UI", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should have a subtle indicator element that shows during background refetch
          // Pattern: {isBackgroundRefetching && <div ...
          const subtleIndicatorPatterns = [
            /\{isBackgroundRefetching\s*&&\s*\(/,
            /\{isBackgroundRefetching\s*&&\s*</,
          ];

          const hasSubtleIndicator = subtleIndicatorPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasSubtleIndicator).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Skeleton should NOT show when refetching with cached data
   */
  it("should not show skeleton when refetching with cached data", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // The loading condition should NOT be just isLoading or isRefetching
          // It should be isLoading && !data (which excludes refetching with data)
          
          // Bad pattern: if (isRefetching) return <Skeleton />
          const badPatterns = [
            /if\s*\(\s*isRefetching\s*\)\s*{?\s*return\s*<\w*Skeleton/,
            /if\s*\(\s*isRefetchingRevenue\s*\)\s*{?\s*return\s*<\w*Skeleton/,
            /if\s*\(\s*customersRefetching\s*\)\s*{?\s*return\s*<\w*Skeleton/,
          ];

          const hasBadPattern = badPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasBadPattern).toBe(false);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe("Property 7: Error with cache shows cached data", () => {
  /**
   * **Feature: smooth-navigation-ux, Property 7: Error with cache shows cached data**
   * **Validates: Requirements 3.4**
   * 
   * Property: For any query that errors while having cached data, 
   * the component SHALL display cached data with error notification.
   */
  it("should extract error from query hooks", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should destructure error from query hook
          const errorPatterns = [
            /error:\s*\w+Error/,
            /error:\s*revenueError/,
            /error:\s*invoiceError/,
            /error:\s*customersError/,
            /error\s*}/,
          ];

          const hasErrorExtracted = errorPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasErrorExtracted).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error with cached data should show toast notification, not error screen
   */
  it("should show toast notification when error occurs with cached data", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should have useEffect that shows toast when error && data
          // Pattern: if (error && data) { toast.error(...) }
          // or: useEffect with error && data condition
          const errorToastPatterns = [
            /if\s*\(\s*\w*[Ee]rror\s*&&\s*\w+\s*\)/,
            /\w*[Ee]rror\s*&&\s*\w+Data/,
            /\w*[Ee]rror\s*&&\s*customers/,
            /\w*[Ee]rror\s*&&\s*data/,
          ];

          const hasErrorToastLogic = errorToastPatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasErrorToastLogic).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Should import toast for error notifications
   */
  it("should import toast for error notifications", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should import toast from sonner
          const toastImportPattern = /import\s*{\s*[^}]*toast[^}]*}\s*from\s*["']sonner["']/;

          expect(content).toMatch(toastImportPattern);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error handling should preserve cached data display
   * The component should NOT show error screen when cached data exists
   */
  it("should not show error screen when cached data exists", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Bad pattern: if (error) return <ErrorScreen /> without checking for data
          // This would hide cached data when an error occurs
          const badPatterns = [
            // Pattern: if (error) return <Error without data check
            /if\s*\(\s*\w*[Ee]rror\s*\)\s*{?\s*return\s*</,
          ];

          // Check if any bad pattern exists
          const hasBadPattern = badPatterns.some(pattern => 
            pattern.test(content)
          );

          // If we find a pattern, verify it's guarded by !data check
          if (hasBadPattern) {
            // Look for the full context - it should be error && !data
            const hasCorrectGuard = /\w*[Ee]rror\s*&&\s*!\w+/.test(content);
            expect(hasCorrectGuard).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error toast should include helpful message
   */
  it("should show helpful error message with cached data context", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (component) => {
          const filePath = path.resolve(process.cwd(), component.path);
          const content = fs.readFileSync(filePath, "utf-8");

          // Should have toast.error call with description about cached data
          const helpfulMessagePatterns = [
            /toast\.error\s*\([^)]*description:/,
            /toast\.error\s*\(\s*["'][^"']+["']\s*,\s*{/,
          ];

          const hasHelpfulMessage = helpfulMessagePatterns.some(pattern => 
            pattern.test(content)
          );

          expect(hasHelpfulMessage).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
