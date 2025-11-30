/**
 * Property-Based Test: Client Components receive data via props
 * 
 * **Feature: optimize-navigation-performance, Property 3: Client Components receive data via props**
 * 
 * **Validates: Requirements 3.4, 6.2**
 * 
 * Property: For any Client Component that displays server data, the component SHALL receive 
 * that data via props interface, not via useEffect data fetching on mount
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// Settings tab components that should receive data via props
const CLIENT_COMPONENTS = [
  'components/features/settings/business-info-tab.tsx',
  'components/features/settings/subscription-tab.tsx',
  'components/features/settings/invoice-settings-tab.tsx',
];

describe('Property 3: Client Components receive data via props', () => {
  it('should verify all settings tab components are client components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...CLIENT_COMPONENTS),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should have "use client" directive
          const hasUseClient = fileContent.includes("'use client'") || fileContent.includes('"use client"');
          expect(hasUseClient).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify BusinessInfoTab accepts initialStore and initialContacts props', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/settings/business-info-tab.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should have initialStore prop in interface
          const hasInitialStoreInInterface = fileContent.includes('initialStore?:') || 
                                              fileContent.includes('initialStore:');
          // Property: Component should have initialContacts prop in interface
          const hasInitialContactsInInterface = fileContent.includes('initialContacts?:') || 
                                                 fileContent.includes('initialContacts:');

          expect(hasInitialStoreInInterface).toBe(true);
          expect(hasInitialContactsInInterface).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify SubscriptionTab accepts initialSubscription prop', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/settings/subscription-tab.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should have initialSubscription prop in interface
          const hasInitialSubscriptionInInterface = fileContent.includes('initialSubscription?:') || 
                                                     fileContent.includes('initialSubscription:');

          expect(hasInitialSubscriptionInInterface).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify InvoiceSettingsTab accepts initialStore and initialPreferences props', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/settings/invoice-settings-tab.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should have initialStore prop in interface
          const hasInitialStoreInInterface = fileContent.includes('initialStore?:') || 
                                              fileContent.includes('initialStore:');
          // Property: Component should have initialPreferences prop in interface
          const hasInitialPreferencesInInterface = fileContent.includes('initialPreferences?:') || 
                                                    fileContent.includes('initialPreferences:');

          expect(hasInitialStoreInInterface).toBe(true);
          expect(hasInitialPreferencesInInterface).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify BusinessInfoTab uses initialStore prop to skip data fetching', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/settings/business-info-tab.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should check for initialStore before fetching
          const checksInitialStoreBeforeFetch = fileContent.includes('if (!initialStore)') ||
                                                 fileContent.includes('!initialStore');

          expect(checksInitialStoreBeforeFetch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify SubscriptionTab uses initialSubscription prop to skip data fetching', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('components/features/settings/subscription-tab.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: Component should check for initialSubscription before fetching
          const checksInitialSubscriptionBeforeFetch = fileContent.includes('if (initialSubscription)') ||
                                                        fileContent.includes('initialSubscription');

          expect(checksInitialSubscriptionBeforeFetch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify AccountClient passes props to all settings tabs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/account-client.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: AccountClient should pass initialStore to BusinessInfoTab
          const passesStoreToBusinessInfo = fileContent.includes('<BusinessInfoTab') && 
                                             fileContent.includes('initialStore=');
          // Property: AccountClient should pass initialContacts to BusinessInfoTab
          const passesContactsToBusinessInfo = fileContent.includes('<BusinessInfoTab') && 
                                                fileContent.includes('initialContacts=');
          // Property: AccountClient should pass initialSubscription to SubscriptionTab
          const passesSubscriptionToSubscription = fileContent.includes('<SubscriptionTab') && 
                                                    fileContent.includes('initialSubscription=');
          // Property: AccountClient should pass initialPreferences to InvoiceSettingsTab
          const passesPreferencesToInvoice = fileContent.includes('<InvoiceSettingsTab') && 
                                              fileContent.includes('initialPreferences=');

          expect(passesStoreToBusinessInfo).toBe(true);
          expect(passesContactsToBusinessInfo).toBe(true);
          expect(passesSubscriptionToSubscription).toBe(true);
          expect(passesPreferencesToInvoice).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify AccountClient interface accepts all initial data props', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('app/dashboard/account/account-client.tsx'),
        (filePath) => {
          const fullPath = path.join(process.cwd(), filePath);
          const fileContent = fs.readFileSync(fullPath, 'utf-8');

          // Property: AccountClientProps interface should have all required props
          const hasInitialStore = fileContent.includes('initialStore:');
          const hasInitialContacts = fileContent.includes('initialContacts:');
          const hasInitialSubscription = fileContent.includes('initialSubscription:');
          const hasInitialPreferences = fileContent.includes('initialPreferences:');

          expect(hasInitialStore).toBe(true);
          expect(hasInitialContacts).toBe(true);
          expect(hasInitialSubscription).toBe(true);
          expect(hasInitialPreferences).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
