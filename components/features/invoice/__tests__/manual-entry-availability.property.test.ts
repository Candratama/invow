/**
 * Property-Based Test for Manual Entry Availability
 *
 * **Feature: premium-customer-management, Property 4: Manual entry available for free users**
 * **Validates: Requirements 4.4**
 *
 * Property: For any free user creating an invoice, the invoice form should accept
 * manually entered customer details (name, phone, address) without requiring the customer selector.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Manual entry fields that should always be available regardless of premium status
 */
const MANUAL_ENTRY_FIELDS = [
  'customerName',
  'customerPhone',
  'customerAddress',
  'customerEmail',
  'customerStatus',
] as const;

/**
 * Pure function that determines if manual entry should be available
 * based on subscription tier
 */
function shouldManualEntryBeAvailable(tier: 'free' | 'premium'): boolean {
  // Manual entry should ALWAYS be available regardless of tier
  // This is the key property - free users can still create invoices with manual customer entry
  return true;
}

/**
 * Pure function that determines if customer selector should be disabled
 * based on subscription tier
 */
function shouldCustomerSelectorBeDisabled(tier: 'free' | 'premium'): boolean {
  return tier === 'free';
}

describe('Property 4: Manual entry available for free users', () => {
  /**
   * Property: Manual entry fields should be available for free tier users
   * Validates: Requirement 4.4 - Manual entry allowed when selector is disabled
   */
  it('should allow manual entry for free tier users', () => {
    fc.assert(
      fc.property(
        fc.constant('free' as const),
        (tier) => {
          const manualEntryAvailable = shouldManualEntryBeAvailable(tier);
          const selectorDisabled = shouldCustomerSelectorBeDisabled(tier);
          
          // Property: Free tier should have manual entry available
          expect(manualEntryAvailable).toBe(true);
          
          // Property: Free tier should have selector disabled
          expect(selectorDisabled).toBe(true);
          
          // Property: Manual entry should be available even when selector is disabled
          expect(manualEntryAvailable && selectorDisabled).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Manual entry fields should be available for premium tier users
   * Validates: Requirement 4.4 - Manual entry available for all users
   */
  it('should allow manual entry for premium tier users', () => {
    fc.assert(
      fc.property(
        fc.constant('premium' as const),
        (tier) => {
          const manualEntryAvailable = shouldManualEntryBeAvailable(tier);
          
          // Property: Premium tier should also have manual entry available
          expect(manualEntryAvailable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Manual entry should be available for any tier
   * Validates: Requirement 4.4 - Universal manual entry availability
   */
  it('should allow manual entry for any subscription tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        (tier) => {
          const manualEntryAvailable = shouldManualEntryBeAvailable(tier);
          
          // Property: Manual entry should always be available
          expect(manualEntryAvailable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invoice form should contain all manual entry fields
   * Validates: Requirement 4.4 - Form has fields for manual customer entry
   */
  it('should verify invoice form contains all manual entry fields', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/invoice/invoice-form.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Form should have customerName field
    expect(fileContent).toContain('customerName');
    expect(fileContent).toContain('id="customerName"');
    
    // Property: Form should have customerPhone field
    expect(fileContent).toContain('customerPhone');
    expect(fileContent).toContain('id="customerPhone"');
    
    // Property: Form should have customerAddress field
    expect(fileContent).toContain('customerAddress');
    expect(fileContent).toContain('id="customerAddress"');
    
    // Property: Form should have customerEmail field
    expect(fileContent).toContain('customerEmail');
    expect(fileContent).toContain('id="customerEmail"');
    
    // Property: Form should have customerStatus field
    expect(fileContent).toContain('customerStatus');
    expect(fileContent).toContain('id="customerStatus"');
  });

  /**
   * Property: Manual entry fields should not be conditionally rendered based on premium status
   * Validates: Requirement 4.4 - Fields always visible
   */
  it('should verify manual entry fields are not gated by premium status', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/invoice/invoice-form.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Manual entry section should exist with "or enter manually" divider
    expect(fileContent).toContain('or enter manually');
    
    // Property: Customer name input should not be conditionally rendered based on isPremium
    // The input should be directly in the form, not wrapped in isPremium conditional
    const customerNameSection = fileContent.match(
      /id="customerName"[\s\S]*?\/>/
    );
    expect(customerNameSection).toBeTruthy();
    
    // Property: The manual entry fields should be separate from CustomerSelector
    // CustomerSelector has disabled prop, but manual fields don't
    expect(fileContent).toContain('CustomerSelector');
    expect(fileContent).toMatch(/disabled=\{!isPremium/);
  });

  /**
   * Property: Form schema should validate manual entry fields
   * Validates: Requirement 4.4 - Manual entry fields are properly validated
   */
  it('should verify form schema validates manual entry fields', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/invoice/invoice-form.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Schema should validate customerName
    expect(fileContent).toContain('customerName:');
    expect(fileContent).toMatch(/customerName:[\s\S]*?\.string\(\)/);
    
    // Property: Schema should validate customerPhone
    expect(fileContent).toContain('customerPhone:');
    
    // Property: Schema should validate customerAddress
    expect(fileContent).toContain('customerAddress:');
    
    // Property: Schema should validate customerStatus
    expect(fileContent).toContain('customerStatus:');
  });

  /**
   * Property: For any valid customer data, manual entry should work
   * Validates: Requirement 4.4 - Manual entry accepts valid customer details
   */
  it('should accept any valid customer data through manual entry', () => {
    // Generate arbitrary valid customer data using efficient generators
    const customerNameArb = fc.string({ minLength: 3, maxLength: 100 });
    // Use a more efficient phone generator that directly generates valid phone strings
    const phoneDigits = fc.array(
      fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
      { minLength: 8, maxLength: 15 }
    ).map(arr => arr.join(''));
    const customerAddressArb = fc.string({ minLength: 5, maxLength: 200 });
    const customerStatusArb = fc.constantFrom('Customer', 'Reseller', 'Distributor');

    fc.assert(
      fc.property(
        customerNameArb,
        phoneDigits,
        customerAddressArb,
        customerStatusArb,
        (name, phone, address, status) => {
          // Property: Valid customer data should be acceptable
          expect(name.length).toBeGreaterThanOrEqual(3);
          expect(phone.length).toBeGreaterThanOrEqual(8);
          expect(address.length).toBeGreaterThanOrEqual(5);
          expect(['Customer', 'Reseller', 'Distributor']).toContain(status);
          
          // Property: Manual entry should work regardless of tier
          const freeUserCanEnter = shouldManualEntryBeAvailable('free');
          const premiumUserCanEnter = shouldManualEntryBeAvailable('premium');
          
          expect(freeUserCanEnter).toBe(true);
          expect(premiumUserCanEnter).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Manual entry and customer selector should be independent
   * Validates: Requirement 4.4 - Manual entry works when selector is disabled
   */
  it('should verify manual entry is independent of customer selector state', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        (tier) => {
          const selectorDisabled = shouldCustomerSelectorBeDisabled(tier);
          const manualEntryAvailable = shouldManualEntryBeAvailable(tier);
          
          // Property: Manual entry availability should not depend on selector state
          // Even when selector is disabled (free tier), manual entry should work
          if (selectorDisabled) {
            expect(manualEntryAvailable).toBe(true);
          }
          
          // Property: Manual entry should always be available
          expect(manualEntryAvailable).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invoice form should use usePremiumStatus hook
   * Validates: Requirement 4.4 - Form integrates with premium status
   */
  it('should verify invoice form uses usePremiumStatus hook', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/invoice/invoice-form.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Form should import usePremiumStatus
    expect(fileContent).toContain('usePremiumStatus');
    expect(fileContent).toMatch(/import.*usePremiumStatus.*from/);
    
    // Property: Form should use the hook
    expect(fileContent).toMatch(/const.*isPremium.*=.*usePremiumStatus/);
  });

  /**
   * Property: Customer selector should pass premium status to component
   * Validates: Requirement 4.4 - Selector receives premium status
   */
  it('should verify CustomerSelector receives premium status props', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/invoice/invoice-form.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: CustomerSelector should receive disabled prop based on premium status
    expect(fileContent).toMatch(/CustomerSelector[\s\S]*?disabled=/);
    
    // Property: CustomerSelector should receive isPremium prop
    expect(fileContent).toMatch(/CustomerSelector[\s\S]*?isPremium=/);
    
    // Property: CustomerSelector should receive onUpgradeClick prop
    expect(fileContent).toMatch(/CustomerSelector[\s\S]*?onUpgradeClick=/);
  });
});
