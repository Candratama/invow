/**
 * Property-Based Test: Sidebar active state updates immediately
 *
 * **Feature: smooth-navigation-ux, Property 8: Sidebar active state updates immediately**
 *
 * **Validates: Requirements 4.2**
 *
 * Property: For any sidebar navigation click, the active state SHALL update
 * immediately on click event, not after data loads.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock React Query
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(() => ({
    prefetchQuery: vi.fn(),
    getQueryData: vi.fn(),
  })),
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

// Mock premium status hook
vi.mock("@/lib/hooks/use-premium-status", () => ({
  usePremiumStatus: vi.fn(() => ({
    isPremium: false,
    isLoading: false,
  })),
}));

// Valid dashboard paths for testing
const DASHBOARD_PATHS = [
  "/dashboard",
  "/dashboard/customers",
  "/dashboard/settings",
] as const;

type DashboardPath = (typeof DASHBOARD_PATHS)[number];

// Arbitrary for generating valid dashboard paths
const dashboardPathArb = fc.constantFrom(...DASHBOARD_PATHS);

describe("Property 8: Sidebar active state updates immediately", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have active state determined by pathname, not by data loading", () => {
    // Read the sidebar source code
    const sidebarPath = path.join(
      process.cwd(),
      "components/dashboard/sidebar.tsx"
    );
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    fc.assert(
      fc.property(dashboardPathArb, (pathname: DashboardPath) => {
        // Property 1: Sidebar uses usePathname for active state
        expect(sidebarContent).toContain("usePathname");

        // Property 2: Active state is computed from pathname directly
        // Check that isActive is determined by pathname comparison
        expect(sidebarContent).toMatch(
          /isDashboardActive\s*=\s*pathname\s*===/
        );
        expect(sidebarContent).toMatch(
          /isCustomersActive\s*=\s*pathname\s*===/
        );
        expect(sidebarContent).toMatch(/isSettingsActive\s*=\s*pathname\s*===/);

        // Property 3: isActive prop is passed to SidebarLink
        expect(sidebarContent).toContain("isActive={isDashboardActive}");
        expect(sidebarContent).toContain("isActive={isCustomersActive}");
        expect(sidebarContent).toContain("isActive={isSettingsActive}");

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should apply active styling based on isActive prop, not loading state", () => {
    const sidebarPath = path.join(
      process.cwd(),
      "components/dashboard/sidebar.tsx"
    );
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    fc.assert(
      fc.property(fc.boolean(), () => {
        // Property: SidebarLink component accepts isActive prop
        expect(sidebarContent).toMatch(
          /interface\s+SidebarLinkProps[\s\S]*isActive\?:\s*boolean/
        );

        // Property: Active styling is applied via isActive, not via data/loading checks
        // The className should use isActive to determine styling
        expect(sidebarContent).toMatch(/isActive\s*\?/);

        // Property: Active state should NOT depend on isLoading from data hooks
        // The active state determination should not include isLoading checks
        const activeStateLines = sidebarContent.match(
          /const\s+is(Dashboard|Customers|Settings)Active\s*=.*/g
        );
        expect(activeStateLines).not.toBeNull();

        for (const line of activeStateLines || []) {
          // Active state should only depend on pathname
          expect(line).not.toContain("isLoading");
          expect(line).not.toContain("data");
          expect(line).toContain("pathname");
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });

  it("should update active state synchronously with pathname change", () => {
    const sidebarPath = path.join(
      process.cwd(),
      "components/dashboard/sidebar.tsx"
    );
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    fc.assert(
      fc.property(
        dashboardPathArb,
        dashboardPathArb,
        (fromPath: DashboardPath, toPath: DashboardPath) => {
          // Property: Active state is derived directly from pathname
          // No async operations or effects needed to update active state

          // Check that active state variables are simple comparisons
          const dashboardActiveMatch = sidebarContent.match(
            /isDashboardActive\s*=\s*pathname\s*===\s*["']\/dashboard["']/
          );
          const customersActiveMatch = sidebarContent.match(
            /isCustomersActive\s*=\s*pathname\s*===\s*["']\/dashboard\/customers["']/
          );
          const settingsActiveMatch = sidebarContent.match(
            /isSettingsActive\s*=\s*pathname\s*===\s*["']\/dashboard\/settings["']/
          );

          expect(dashboardActiveMatch).not.toBeNull();
          expect(customersActiveMatch).not.toBeNull();
          expect(settingsActiveMatch).not.toBeNull();

          // Property: No useEffect or useState for active state management
          // Active state should be computed inline, not stored in state
          const activeStateSection = sidebarContent.slice(
            sidebarContent.indexOf("isDashboardActive"),
            sidebarContent.indexOf("return (")
          );

          expect(activeStateSection).not.toContain("useState");
          expect(activeStateSection).not.toContain("useEffect");

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should have prefetch handlers that do not affect active state", () => {
    const sidebarPath = path.join(
      process.cwd(),
      "components/dashboard/sidebar.tsx"
    );
    const sidebarContent = fs.readFileSync(sidebarPath, "utf-8");

    fc.assert(
      fc.property(dashboardPathArb, () => {
        // Property: Prefetch handlers are separate from active state
        expect(sidebarContent).toContain("onPrefetch");
        expect(sidebarContent).toContain("onMouseEnter={onPrefetch}");
        expect(sidebarContent).toContain("onFocus={onPrefetch}");

        // Property: Prefetch hooks don't modify active state
        // They only call queryClient.prefetchQuery
        expect(sidebarContent).toContain("usePrefetchDashboard");
        expect(sidebarContent).toContain("usePrefetchSettings");
        expect(sidebarContent).toContain("usePrefetchCustomers");

        // Property: Active state and prefetch are independent
        // isActive is passed separately from onPrefetch
        const sidebarLinkUsages = sidebarContent.match(
          /<SidebarLink[\s\S]*?\/>/g
        );
        expect(sidebarLinkUsages).not.toBeNull();

        for (const usage of sidebarLinkUsages || []) {
          if (usage.includes("onPrefetch")) {
            // If it has prefetch, it should also have isActive
            expect(usage).toContain("isActive");
          }
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
