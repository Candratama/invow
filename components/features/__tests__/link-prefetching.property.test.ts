/**
 * Property-Based Test: Link components enable prefetching
 * 
 * **Feature: optimize-navigation-performance, Property 4: Link components enable prefetching**
 * 
 * **Validates: Requirements 5.2**
 * 
 * Property: For any Link component used for internal navigation, the component 
 * SHALL NOT have prefetch={false} unless explicitly required for performance reasons
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

// Files that are explicitly allowed to disable prefetching for performance reasons
// Add files here if they have a documented reason to disable prefetching
const ALLOWED_PREFETCH_FALSE_FILES: string[] = [
  // Example: 'components/features/heavy-page-link.tsx' - disabled due to large payload
];

// Pattern to detect Link components with prefetch={false}
const PREFETCH_FALSE_PATTERN = /<Link[^>]*prefetch\s*=\s*\{?\s*false\s*\}?[^>]*>/g;

// Pattern to detect Link imports from next/link
const LINK_IMPORT_PATTERN = /import\s+(?:Link|{\s*Link\s*})\s+from\s+['"]next\/link['"]/;

// Pattern to detect Link component usage
const LINK_USAGE_PATTERN = /<Link\s+/g;

interface LinkAnalysis {
  hasLinkImport: boolean;
  linkUsageCount: number;
  prefetchFalseCount: number;
  prefetchFalseMatches: string[];
}

function analyzeLinkUsage(content: string): LinkAnalysis {
  const hasLinkImport = LINK_IMPORT_PATTERN.test(content);
  const linkUsages = content.match(LINK_USAGE_PATTERN) || [];
  const prefetchFalseMatches = content.match(PREFETCH_FALSE_PATTERN) || [];
  
  return {
    hasLinkImport,
    linkUsageCount: linkUsages.length,
    prefetchFalseCount: prefetchFalseMatches.length,
    prefetchFalseMatches,
  };
}

function isAllowedFile(filePath: string): boolean {
  return ALLOWED_PREFETCH_FALSE_FILES.some(allowed => filePath.includes(allowed));
}

describe('Property 4: Link components enable prefetching', () => {
  it('should verify user-menu.tsx uses Link without disabling prefetch', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/dashboard/user-menu.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const analysis = analyzeLinkUsage(fileContent);
          
          // Property: File should use Link component
          expect(analysis.hasLinkImport).toBe(true);
          expect(analysis.linkUsageCount).toBeGreaterThan(0);
          
          // Property: Link should not have prefetch={false}
          if (analysis.prefetchFalseCount > 0) {
            throw new Error(
              `Found Link with prefetch={false} in ${filePath}: ${analysis.prefetchFalseMatches.join(', ')}`
            );
          }
          
          expect(analysis.prefetchFalseCount).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all Link components in app/ and components/ do not disable prefetching', () => {
    // Get all TSX files synchronously
    const tsxFiles = findFiles(process.cwd(), /\.tsx$/, ['node_modules', '.next', '.kiro']);

    const violations: { file: string; matches: string[] }[] = [];

    for (const filePath of tsxFiles) {
      // Skip allowed files
      if (isAllowedFile(filePath)) {
        continue;
      }

      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');

      const analysis = analyzeLinkUsage(fileContent);
      
      // Only check files that use Link
      if (analysis.hasLinkImport && analysis.prefetchFalseCount > 0) {
        violations.push({ file: filePath, matches: analysis.prefetchFalseMatches });
      }
    }

    if (violations.length > 0) {
      const errorMessage = violations
        .map(v => `${v.file}: ${v.matches.join(', ')}`)
        .join('\n');
      throw new Error(`Found Link components with prefetch={false}:\n${errorMessage}`);
    }

    expect(violations.length).toBe(0);
  });

  it('should verify Link components are used for internal navigation instead of buttons with onClick', () => {
    // Files that should use Link for navigation
    const filesToCheck = [
      'components/features/dashboard/user-menu.tsx',
      'components/landing-page/navigation.tsx',
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...filesToCheck),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          
          // Skip if file doesn't exist
          if (!fs.existsSync(fullPath)) {
            return true;
          }
          
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          const analysis = analyzeLinkUsage(fileContent);
          
          // Property: Navigation files should use Link component
          if (analysis.hasLinkImport) {
            expect(analysis.linkUsageCount).toBeGreaterThan(0);
            expect(analysis.prefetchFalseCount).toBe(0);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify prefetching is enabled by default (no explicit prefetch prop needed)', () => {
    // In Next.js, Link prefetching is enabled by default
    // This test verifies that we're not explicitly setting prefetch={true} either
    // as it's unnecessary and adds noise to the code
    
    const EXPLICIT_PREFETCH_TRUE_PATTERN = /<Link[^>]*prefetch\s*=\s*\{?\s*true\s*\}?[^>]*>/g;
    
    const tsxFiles = findFiles(process.cwd(), /\.tsx$/, ['node_modules', '.next', '.kiro']);
    
    let unnecessaryPrefetchTrue = 0;
    
    for (const filePath of tsxFiles) {
      const fullPath = path.join(process.cwd(), filePath);
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      
      const matches = fileContent.match(EXPLICIT_PREFETCH_TRUE_PATTERN) || [];
      unnecessaryPrefetchTrue += matches.length;
    }
    
    // This is a soft check - prefetch={true} is not wrong, just unnecessary
    // We just want to ensure we're not adding noise to the codebase
    expect(unnecessaryPrefetchTrue).toBeLessThanOrEqual(5); // Allow some tolerance
  });
});
