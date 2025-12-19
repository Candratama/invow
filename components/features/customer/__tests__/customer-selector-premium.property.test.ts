/**
 * Property-Based Test for Customer Selector Premium State
 *
 * **Feature: premium-customer-management, Property 3: Customer selector state matches tier**
 * **Validates: Requirements 4.1, 4.2**
 *
 * Property: For any user viewing the invoice form, the customer selector should be
 * enabled if and only if the user has premium tier.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { TIER_FEATURES } from '@/lib/config/pricing';

/**
 * Pure function that determines if customer selector should be enabled
 * based on subscription tier
 */
function shouldCustomerSelectorBeEnabled(tier: 'free' | 'premium'): boolean {
  return TIER_FEATURES[tier].hasCustomerManagement;
}

/**
 * Pure function that determines if customer selector should be disabled
 * (inverse of enabled)
 */
function shouldCustomerSelectorBeDisabled(tier: 'free' | 'premium'): boolean {
  return !TIER_FEATURES[tier].hasCustomerManagement;
}

describe('Property 3: Customer selector state matches tier', () => {
  /**
   * Property: Customer selector should be disabled for free tier users
   * Validates: Requirement 4.1 - Free user views invoice form with hidden/disabled selector
   */
  it('should disable customer selector for free tier users', () => {
    fc.assert(
      fc.property(
        fc.constant('free' as const),
        (tier) => {
          const isDisabled = shouldCustomerSelectorBeDisabled(tier);
          
          // Property: Free tier should have disabled customer selector
          expect(isDisabled).toBe(true);
          expect(shouldCustomerSelectorBeEnabled(tier)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Customer selector should be enabled for premium tier users
   * Validates: Requirement 4.2 - Premium user views invoice form with functional selector
   */
  it('should enable customer selector for premium tier users', () => {
    fc.assert(
      fc.property(
        fc.constant('premium' as const),
        (tier) => {
          const isEnabled = shouldCustomerSelectorBeEnabled(tier);
          
          // Property: Premium tier should have enabled customer selector
          expect(isEnabled).toBe(true);
          expect(shouldCustomerSelectorBeDisabled(tier)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Selector state should be strictly opposite between tiers
   * Validates: Requirements 4.1, 4.2 - Consistent state based on tier
   */
  it('should have opposite selector states between free and premium tiers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        (tier) => {
          const freeEnabled = shouldCustomerSelectorBeEnabled('free');
          const premiumEnabled = shouldCustomerSelectorBeEnabled('premium');
          
          // Property: Free and premium should have opposite selector states
          expect(freeEnabled).toBe(false);
          expect(premiumEnabled).toBe(true);
          expect(freeEnabled).not.toBe(premiumEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: CustomerSelector component should support disabled prop
   * Validates: Requirement 4.1 - Selector can be disabled for free users
   */
  it('should verify CustomerSelector component supports disabled prop', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/customer/customer-selector.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: CustomerSelector should have disabled prop in interface
    expect(fileContent).toContain('disabled?: boolean');
    
    // Property: CustomerSelector should have isPremium prop in interface
    expect(fileContent).toContain('isPremium?: boolean');
    
    // Property: CustomerSelector should have onUpgradeClick prop in interface
    expect(fileContent).toContain('onUpgradeClick?: () => void');
  });

  /**
   * Property: Disabled selector should show premium badge
   * Validates: Requirement 4.1 - Free user sees premium badge on disabled selector
   */
  it('should verify disabled selector shows premium badge', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/customer/customer-selector.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Disabled state should render premium badge
    expect(fileContent).toContain('Premium');
    expect(fileContent).toContain('Lock');
    
    // Property: Disabled state should have different styling
    expect(fileContent).toContain('disabled ?');
  });

  /**
   * Property: Disabled selector should trigger upgrade callback on click
   * Validates: Requirement 4.3 - Free user clicking disabled selector opens upgrade modal
   */
  it('should verify disabled selector triggers onUpgradeClick', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/customer/customer-selector.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Disabled button should call onUpgradeClick
    expect(fileContent).toContain('onClick={onUpgradeClick}');
  });

  /**
   * Property: Dropdown should not open when selector is disabled
   * Validates: Requirement 4.1 - Disabled selector prevents interaction
   */
  it('should verify dropdown does not open when disabled', () => {
    const componentPath = path.join(
      process.cwd(),
      'components/features/customer/customer-selector.tsx'
    );
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Dropdown should check disabled state
    expect(fileContent).toMatch(/isOpen.*&&.*!disabled/);
  });

  /**
   * Property: For any tier, selector state should be deterministic
   * Validates: Requirements 4.1, 4.2 - Consistent state based on subscription
   */
  it('should provide deterministic selector state based on tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        fc.integer({ min: 1, max: 100 }),
        (tier, _iteration) => {
          const expectedEnabled = tier === 'premium';
          const actualEnabled = shouldCustomerSelectorBeEnabled(tier);
          
          // Property: Selector state should always match tier expectation
          expect(actualEnabled).toBe(expectedEnabled);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Selector enabled state should be a boolean
   * Validates: Requirements 4.1, 4.2 - Binary state control
   */
  it('should verify selector enabled state is boolean', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('free', 'premium') as fc.Arbitrary<'free' | 'premium'>,
        (tier) => {
          const isEnabled = shouldCustomerSelectorBeEnabled(tier);
          
          // Property: Enabled state should be a boolean
          expect(typeof isEnabled).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });
});
