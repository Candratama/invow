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
  it('should verify account page is a Server Component (no "use client" directive)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/page.tsx'),
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

  it('should verify account page imports from data access layer', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should import from data access layer
          const hasDataAccessImport = fileContent.includes("from '@/lib/db/data-access/account'") ||
                                      fileContent.includes('from "@/lib/db/data-access/account"');
          expect(hasDataAccessImport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify account page uses async function for data fetching', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should be an async function (Server Component pattern)
          const hasAsyncFunction = fileContent.includes('async function AccountPage') ||
                                   fileContent.includes('export default async function');
          expect(hasAsyncFunction).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify account page calls getAccountPageData', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should call getAccountPageData function
          const callsGetAccountPageData = fileContent.includes('getAccountPageData()') ||
                                          fileContent.includes('await getAccountPageData');
          expect(callsGetAccountPageData).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify account page passes data as props to client component', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/page.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Page should pass data as props to AccountClient
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
        fc.constantFrom('lib/db/data-access/account.ts'),
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

  it('should verify data access layer uses React cache()', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/account.ts'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Data access layer should use React cache() for memoization
          const importsCacheFromReact = fileContent.includes("import { cache } from 'react'") ||
                                        fileContent.includes('import { cache } from "react"');
          const usesCacheWrapper = fileContent.includes('cache(async');
          
          expect(importsCacheFromReact).toBe(true);
          expect(usesCacheWrapper).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify data access layer imports from server supabase client', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('lib/db/data-access/account.ts'),
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
