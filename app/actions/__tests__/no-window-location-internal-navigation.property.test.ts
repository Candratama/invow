/**
 * Property-Based Test: No window.location for internal navigation
 * 
 * **Feature: optimize-navigation-performance, Property 1: No window.location for internal navigation**
 * 
 * **Validates: Requirements 2.1, 2.4**
 * 
 * Property: For any navigation element in the codebase that navigates to an internal route 
 * (starting with /), the navigation method SHALL NOT use window.location.href
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively find all files matching a pattern
 */
function findFiles(dir: string, pattern: RegExp, ignore: string[] = []): string[] {
  const results: string[] = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);
      
      // Skip ignored directories
      if (ignore.some(ig => relativePath.startsWith(ig) || entry.name === ig)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, ignore));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(relativePath);
      }
    }
  } catch {
    // Ignore errors (e.g., permission denied)
  }
  
  return results;
}

// Files that are allowed to use window.location.href for external URLs or special cases
const ALLOWED_FILES = [
  // External payment redirects are allowed
  'components/features/subscription/upgrade-button.tsx',
  // Spec and documentation files
  '.kiro/specs/',
  'FIX_406_ERRORS',
];

// Patterns that indicate internal route navigation with window.location.href
const INTERNAL_ROUTE_PATTERNS = [
  /window\.location\.href\s*=\s*["'`]\/dashboard/,
  /window\.location\.href\s*=\s*["'`]\/account/,
  /window\.location\.href\s*=\s*["'`]\/settings/,
  /window\.location\.href\s*=\s*["'`]\/login/,
  /window\.location\.href\s*=\s*["'`]\/signup/,
  /window\.location\.href\s*=\s*["'`]\/auth/,
  /window\.location\.href\s*=\s*redirectTo/,
  /window\.location\.href\s*=\s*destination/,
  /window\.location\.href\s*=\s*["'`]\/["'`]/,
  /window\.location\.href\s*=\s*["'`]\/\?/,
];

// Patterns that are allowed (external URLs, origin-based URLs for OAuth)
// Note: These patterns are defined for documentation purposes and potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ALLOWED_PATTERNS = [
  /window\.location\.origin/,
  /window\.location\.search/,
  /window\.location\.pathname/,
  /window\.location\.protocol/,
  /window\.history/,
];

function isAllowedFile(filePath: string): boolean {
  return ALLOWED_FILES.some(allowed => filePath.includes(allowed));
}

function hasInternalRouteWindowLocation(content: string): { found: boolean; matches: string[] } {
  const matches: string[] = [];
  
  // Check for internal route patterns
  for (const pattern of INTERNAL_ROUTE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      matches.push(match[0]);
    }
  }
  
  return { found: matches.length > 0, matches };
}

describe('Property 1: No window.location for internal navigation', () => {
  it('should verify invoice-form.tsx does not use window.location.href for internal routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/invoice/invoice-form.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const { found, matches } = hasInternalRouteWindowLocation(fileContent);
          
          if (found) {
            throw new Error(
              `Found window.location.href for internal routes in ${filePath}: ${matches.join(', ')}`
            );
          }
          
          expect(found).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify auth-context.tsx does not use window.location.href for internal routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/auth/auth-context.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const { found, matches } = hasInternalRouteWindowLocation(fileContent);
          
          if (found) {
            throw new Error(
              `Found window.location.href for internal routes in ${filePath}: ${matches.join(', ')}`
            );
          }
          
          expect(found).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify login page does not use window.location.href for internal routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/login/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const { found, matches } = hasInternalRouteWindowLocation(fileContent);
          
          if (found) {
            throw new Error(
              `Found window.location.href for internal routes in ${filePath}: ${matches.join(', ')}`
            );
          }
          
          expect(found).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify signup page does not use window.location.href for internal routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/signup/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const { found, matches } = hasInternalRouteWindowLocation(fileContent);
          
          if (found) {
            throw new Error(
              `Found window.location.href for internal routes in ${filePath}: ${matches.join(', ')}`
            );
          }
          
          expect(found).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all TSX files in app/ and components/ do not use window.location.href for internal routes', () => {
    // Get all TSX files synchronously
    const tsxFiles = findFiles(process.cwd(), /\.tsx$/, ['node_modules', '.next', '.kiro']);

    const violations: { file: string; matches: string[] }[] = [];

    for (const filePath of tsxFiles) {
      if (isAllowedFile(filePath)) {
        continue;
      }

      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');

      const { found, matches } = hasInternalRouteWindowLocation(fileContent);
      
      if (found) {
        violations.push({ file: filePath, matches });
      }
    }

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}: ${v.matches.join(', ')}`)
        .join('\n');
      throw new Error(`Found window.location.href for internal routes:\n${errorMessage}`);
    }

    expect(violations.length).toBe(0);
  });

  it('should verify files use router.push instead of window.location.href for navigation', () => {
    const filesToCheck = [
      'components/features/invoice/invoice-form.tsx',
      'lib/auth/auth-context.tsx',
      'app/dashboard/login/page.tsx',
      'app/dashboard/signup/page.tsx',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...filesToCheck),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Files should import useRouter from next/navigation
          const hasRouterImport = 
            fileContent.includes("from 'next/navigation'") ||
            fileContent.includes('from "next/navigation"');
          
          // Property: Files should use router.push for navigation
          const usesRouterPush = fileContent.includes('router.push');

          expect(hasRouterImport).toBe(true);
          expect(usesRouterPush).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
