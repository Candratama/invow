/**
 * Property-Based Test: Server Components fetch data
 * 
 * **Feature: optimize-navigation-performance, Property 2: Server Components fetch data**
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 6.1**
 * 
 * Property: For any page component that requires initial data, the page SHALL be 
 * a Server Component (no "use client" directive) and SHALL call data access functions directly
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 2: Server Components fetch data', () => {
  it('should verify settings page is a Server Component (no "use client" directive)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should NOT have "use client" directive
          const hasUseClient = fileContent.includes("'use client'") || fileContent.includes('"use client"');
          expect(hasUseClient).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings page imports from server actions', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should import from server actions (following the data fetching pattern)
          const hasActionsImport = fileContent.includes("from '@/app/actions/settings'") ||
                                   fileContent.includes('from "@/app/actions/settings"') ||
                                   fileContent.includes("from '@/lib/db/data-access/settings'") ||
                                   fileContent.includes('from "@/lib/db/data-access/settings"');
          expect(hasActionsImport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings page uses async function for data fetching', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should be an async function (Server Component pattern)
          const hasAsyncFunction = fileContent.includes('async function SettingsPage') ||
                                   fileContent.includes('export default async function');
          expect(hasAsyncFunction).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings page calls data fetching function', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should call a data fetching function (either action or data-access)
          const callsDataFetching = fileContent.includes('getSettingsPageDataForUser()') ||
                                    fileContent.includes('await getSettingsPageDataForUser') ||
                                    fileContent.includes('getSettingsDataAction()') ||
                                    fileContent.includes('await getSettingsDataAction');
          expect(callsDataFetching).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify settings page passes data as props to client component', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should pass data as props to SettingsClient
          // The page uses initialData prop which contains all settings data
          const passesInitialData = fileContent.includes('initialData=');
          
          expect(passesInitialData).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify data access layer uses server-only import', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/settings.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Data access layer should have 'server-only' import
          const hasServerOnly = fileContent.includes("import 'server-only'");
          expect(hasServerOnly).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify data access layer documents cache strategy', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/settings.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Data access layer should document cache strategy
          // Note: Due to Next.js 15+ restrictions, unstable_cache cannot be used
          // with functions that call cookies() internally. The file should document
          // the alternative approach using revalidateTag.
          const hasUnstableCacheReference = fileContent.includes('unstable_cache');
          const hasCacheDocumentation = fileContent.includes('revalidateTag') ||
                                         fileContent.includes('cache invalidation') ||
                                         fileContent.includes('Cache Strategy');
          
          expect(hasUnstableCacheReference || hasCacheDocumentation).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify data access layer imports from server supabase client', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/settings.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Data access layer should import from server, not client
          const hasServerImport = fileContent.includes("from '@/lib/supabase/server'");
          const hasClientImport = fileContent.includes("from '@/lib/supabase/client'");

          expect(hasServerImport).toBe(true);
          expect(hasClientImport).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
