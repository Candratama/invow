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

  it('should verify settings page imports from data access layer', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should import from data access layer
          const hasDataAccessImport = fileContent.includes("from '@/lib/db/data-access/settings'") ||
                                      fileContent.includes('from "@/lib/db/data-access/settings"');
          expect(hasDataAccessImport).toBe(true);
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

  it('should verify settings page calls getSettingsPageDataForUser', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/settings/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should call getSettingsPageDataForUser function
          const callsGetSettingsPageData = fileContent.includes('getSettingsPageDataForUser()') ||
                                          fileContent.includes('await getSettingsPageDataForUser');
          expect(callsGetSettingsPageData).toBe(true);
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
          const passesStoreProps = fileContent.includes('initialStore=');
          const passesContactsProps = fileContent.includes('initialContacts=');
          const passesSubscriptionProps = fileContent.includes('initialSubscription=');
          const passesPreferencesProps = fileContent.includes('initialPreferences=');

          expect(passesStoreProps).toBe(true);
          expect(passesContactsProps).toBe(true);
          expect(passesSubscriptionProps).toBe(true);
          expect(passesPreferencesProps).toBe(true);
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

  it('should verify data access layer uses unstable_cache', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/settings.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Data access layer should use unstable_cache for caching
          const importsUnstableCache = fileContent.includes("import { unstable_cache") ||
                                        fileContent.includes('unstable_cache');
          const usesUnstableCacheWrapper = fileContent.includes('unstable_cache(');
          
          expect(importsUnstableCache).toBe(true);
          expect(usesUnstableCacheWrapper).toBe(true);
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
