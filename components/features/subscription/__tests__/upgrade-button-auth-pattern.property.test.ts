/**
 * Property-Based Test: Consistent authentication pattern in client components
 * 
 * **Feature: refactor-api-to-server-actions, Property 5: Consistent authentication pattern in client components**
 * 
 * **Validates: Requirements 4.1, 4.3**
 * 
 * Property: For any client component that needs authentication state, it must use the 
 * useAuth() hook, not create a new Supabase browser client for auth checks.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Client components that need authentication state
const CLIENT_COMPONENTS_WITH_AUTH = [
  'components/features/subscription/upgrade-button.tsx',
];

describe('Property 5: Consistent authentication pattern in client components', () => {
  it('should verify client components use useAuth() hook instead of createClient for auth', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS_WITH_AUTH),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should import useAuth from auth-context
          const hasUseAuthImport = fileContent.includes("import { useAuth }") || 
                                    fileContent.includes("import {useAuth}") ||
                                    fileContent.includes("useAuth } from '@/lib/auth/auth-context'") ||
                                    fileContent.includes('useAuth } from "@/lib/auth/auth-context"');
          
          expect(hasUseAuthImport).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify client components do NOT import createClient from supabase/client for auth checks', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS_WITH_AUTH),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should NOT import createClient from supabase/client
          const hasCreateClientImport = fileContent.includes("import { createClient } from '@/lib/supabase/client'") ||
                                         fileContent.includes('import { createClient } from "@/lib/supabase/client"') ||
                                         fileContent.includes("from '@/lib/supabase/client'") ||
                                         fileContent.includes('from "@/lib/supabase/client"');
          
          expect(hasCreateClientImport).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify client components use useAuth() hook to get user state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS_WITH_AUTH),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should destructure user from useAuth()
          const usesUseAuthHook = fileContent.includes('useAuth()') &&
                                   (fileContent.includes('{ user') || 
                                    fileContent.includes('{user') ||
                                    fileContent.includes('user,') ||
                                    fileContent.includes('user }'));
          
          expect(usesUseAuthHook).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify client components do NOT call supabase.auth.getUser() directly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS_WITH_AUTH),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should NOT call supabase.auth.getUser() directly
          const callsGetUserDirectly = fileContent.includes('supabase.auth.getUser()') ||
                                        fileContent.includes('.auth.getUser()');
          
          expect(callsGetUserDirectly).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify upgrade-button uses Server Action instead of fetch() to API route', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/subscription/upgrade-button.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should import createPaymentInvoiceAction
          const hasServerActionImport = fileContent.includes('createPaymentInvoiceAction') &&
                                         (fileContent.includes("from '@/app/actions/payments'") ||
                                          fileContent.includes('from "@/app/actions/payments"'));
          
          // Property: Component should NOT use fetch() to API route for payments
          const usesFetchToApiRoute = fileContent.includes("fetch('/api/payments") ||
                                       fileContent.includes('fetch("/api/payments');
          
          expect(hasServerActionImport).toBe(true);
          expect(usesFetchToApiRoute).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify upgrade-button calls Server Action directly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/subscription/upgrade-button.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should call createPaymentInvoiceAction(tier)
          const callsServerAction = fileContent.includes('createPaymentInvoiceAction(tier)') ||
                                     fileContent.includes('await createPaymentInvoiceAction(');
          
          expect(callsServerAction).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify upgrade-button checks user from useAuth before mutation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/subscription/upgrade-button.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should check !user before redirecting to login
          const checksUserBeforeRedirect = fileContent.includes('!user') &&
                                            fileContent.includes('router.push');
          
          expect(checksUserBeforeRedirect).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
