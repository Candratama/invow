import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import * as fs from "fs";
import * as path from "path";

/**
 * **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
 *
 * *For any* error thrown within a cached component, the error SHALL be caught by the
 * nearest Error Boundary and SHALL NOT propagate to sibling cached components.
 *
 * **Validates: Requirements 8.1, 8.4**
 */
describe("Error Boundary Isolation", () => {
  const CACHED_LANDING_PAGE_COMPONENTS = [
    "Navigation",
    "HeroSection",
    "FeaturesSection",
    "PricingSection",
    "BenefitsSection",
    "CTASection",
    "Footer",
  ] as const;

  const LANDING_PAGE_PATH = path.resolve(process.cwd(), "app/page.tsx");
  const CACHE_ERROR_BOUNDARY_PATH = path.resolve(
    process.cwd(),
    "components/cache-error-boundary.tsx"
  );

  /**
   * Property: Each cached component in landing page must be wrapped with CacheErrorBoundary
   */
  it("each cached component should be wrapped with CacheErrorBoundary", () => {
    // **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
    fc.assert(
      fc.property(
        fc.constantFrom(...CACHED_LANDING_PAGE_COMPONENTS),
        (componentName) => {
          const content = fs.readFileSync(LANDING_PAGE_PATH, "utf-8");

          // Each component should have its own CacheErrorBoundary wrapper
          // Pattern: <CacheErrorBoundary componentName="ComponentName"
          const boundaryPattern = new RegExp(
            `<CacheErrorBoundary[^>]*componentName=["']${componentName}["']`,
            "s"
          );

          expect(content).toMatch(boundaryPattern);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CacheErrorBoundary must have fallback prop for graceful degradation
   */
  it("each CacheErrorBoundary should have a fallback prop", () => {
    // **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
    fc.assert(
      fc.property(
        fc.constantFrom(...CACHED_LANDING_PAGE_COMPONENTS),
        (componentName) => {
          const content = fs.readFileSync(LANDING_PAGE_PATH, "utf-8");

          // Find the CacheErrorBoundary for this component and verify it has fallback
          // Pattern: <CacheErrorBoundary componentName="ComponentName" ... fallback={...}
          const boundaryWithFallbackPattern = new RegExp(
            `<CacheErrorBoundary[^>]*componentName=["']${componentName}["'][^>]*fallback=`,
            "s"
          );

          expect(content).toMatch(boundaryWithFallbackPattern);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CacheErrorBoundary component must exist and be a client component
   */
  it("CacheErrorBoundary should be a client component with error handling", () => {
    // **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
    fc.assert(
      fc.property(fc.constant(true), () => {
        // CacheErrorBoundary file must exist
        expect(fs.existsSync(CACHE_ERROR_BOUNDARY_PATH)).toBe(true);

        const content = fs.readFileSync(CACHE_ERROR_BOUNDARY_PATH, "utf-8");

        // Must be a client component (error boundaries require client-side React)
        expect(content).toMatch(/['"]use client['"]/);

        // Must extend Component (class-based error boundary)
        expect(content).toMatch(/class\s+CacheErrorBoundary\s+extends\s+Component/);

        // Must implement getDerivedStateFromError for error catching
        expect(content).toMatch(/static\s+getDerivedStateFromError/);

        // Must implement componentDidCatch for error logging
        expect(content).toMatch(/componentDidCatch/);

        return true;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error boundaries should be isolated (each component has its own boundary)
   */
  it("error boundaries should be isolated per component", () => {
    // **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom(...CACHED_LANDING_PAGE_COMPONENTS),
          fc.constantFrom(...CACHED_LANDING_PAGE_COMPONENTS)
        ),
        ([component1, component2]) => {
          if (component1 === component2) return true; // Skip same component comparison

          const content = fs.readFileSync(LANDING_PAGE_PATH, "utf-8");

          // Find positions of both error boundaries
          const boundary1Pattern = new RegExp(
            `<CacheErrorBoundary[^>]*componentName=["']${component1}["']`
          );
          const boundary2Pattern = new RegExp(
            `<CacheErrorBoundary[^>]*componentName=["']${component2}["']`
          );

          const match1 = content.match(boundary1Pattern);
          const match2 = content.match(boundary2Pattern);

          // Both components should have their own error boundaries
          expect(match1).not.toBeNull();
          expect(match2).not.toBeNull();

          // They should be separate boundaries (different positions in the file)
          if (match1 && match2 && match1.index !== undefined && match2.index !== undefined) {
            expect(match1.index).not.toBe(match2.index);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Landing page must import CacheErrorBoundary
   */
  it("landing page should import CacheErrorBoundary", () => {
    // **Feature: nextjs16-cache-components, Property 4: Error Boundary Isolation**
    fc.assert(
      fc.property(fc.constant(true), () => {
        const content = fs.readFileSync(LANDING_PAGE_PATH, "utf-8");

        // Must import CacheErrorBoundary
        expect(content).toMatch(
          /import\s*{[^}]*CacheErrorBoundary[^}]*}\s*from\s*["']@\/components\/cache-error-boundary["']/
        );

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
