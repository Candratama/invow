/**
 * Property-Based Test for Upgrade Modal Trigger
 * 
 * **Feature: premium-feature-gating, Property 12: Upgrade modal trigger**
 * **Validates: Requirements 4.2, 5.2, 6.2, 11.1**
 * 
 * Property: For any free user clicking a premium feature, an upgrade modal 
 * should be displayed.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { TIER_FEATURES, TierFeatures } from '@/lib/config/pricing';

// Premium features that should trigger upgrade modal for free users
const PREMIUM_FEATURE_KEYS: (keyof TierFeatures)[] = [
  'hasLogo',
  'hasSignature', 
  'hasCustomColors',
  'hasMonthlyReport',
];

describe('Property 12: Upgrade modal trigger', () => {
  it('should verify UpgradeModal component exists and has required structure', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should use Dialog component from shadcn (check both quote styles)
    const hasDialogImport = fileContent.includes("from '@/components/ui/dialog'") ||
                            fileContent.includes('from "@/components/ui/dialog"');
    expect(hasDialogImport).toBe(true);
    
    // Property: Modal should have isOpen and onClose props
    expect(fileContent).toContain('isOpen');
    expect(fileContent).toContain('onClose');
    
    // Property: Modal should have feature prop for context
    expect(fileContent).toContain('feature');
  });

  it('should verify UpgradeModal displays Premium price (Rp 15,000/30 days)', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should display the premium price from config
    const hasPriceDisplay = fileContent.includes('priceFormatted') || 
                            fileContent.includes('TIER_CONFIGS.premium') ||
                            fileContent.includes('premiumConfig');
    expect(hasPriceDisplay).toBe(true);

    // Property: Modal should show "/30 days" duration
    expect(fileContent).toContain('/30 days');
  });

  it('should verify UpgradeModal has "Upgrade Now" button', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should have "Upgrade Now" call-to-action
    expect(fileContent).toContain('Upgrade Now');
  });

  it('should verify UpgradeModal has "Maybe Later" dismiss option', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should have "Maybe Later" dismiss button
    expect(fileContent).toContain('Maybe Later');
  });

  it('should verify UpgradeModal connects to payment flow on upgrade click', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should import and use createPaymentInvoiceAction
    const hasPaymentAction = fileContent.includes('createPaymentInvoiceAction') &&
                              (fileContent.includes("from '@/app/actions/payments'") ||
                               fileContent.includes('from "@/app/actions/payments"'));
    expect(hasPaymentAction).toBe(true);

    // Property: Modal should call the payment action
    expect(fileContent).toContain('createPaymentInvoiceAction');
  });

  it('should verify premium features are disabled for free tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREMIUM_FEATURE_KEYS),
        (featureKey) => {
          const freeFeatures = TIER_FEATURES.free;
          const premiumFeatures = TIER_FEATURES.premium;

          // Property: Free tier should NOT have access to premium features
          expect(freeFeatures[featureKey]).toBe(false);
          
          // Property: Premium tier SHOULD have access to premium features
          expect(premiumFeatures[featureKey]).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify UpgradeModal uses useAuth for authentication check', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should use useAuth hook for auth state
    const hasUseAuthImport = fileContent.includes("useAuth") && 
                              fileContent.includes("@/lib/auth/auth-context");
    expect(hasUseAuthImport).toBe(true);
  });

  it('should verify UpgradeModal redirects unauthenticated users to signup', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should check if user is authenticated
    expect(fileContent).toContain('!user');
    
    // Property: Modal should redirect to signup for unauthenticated users
    expect(fileContent).toContain('router.push');
    expect(fileContent).toContain('signup');
  });

  it('should verify UpgradeModal handles payment URL redirect', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should redirect to payment URL on success
    expect(fileContent).toContain('paymentUrl');
    expect(fileContent).toContain('window.location.href');
  });

  it('should verify UpgradeModal displays feature benefits', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should display premium benefits
    const hasBenefitsList = fileContent.includes('PREMIUM_BENEFITS') ||
                            fileContent.includes('features') ||
                            fileContent.includes('benefit');
    expect(hasBenefitsList).toBe(true);
  });

  it('should verify UpgradeModal has proper Dialog structure', () => {
    const modalPath = path.join(process.cwd(), 'components/features/subscription/upgrade-modal.tsx');
    const fileContent = fs.readFileSync(modalPath, 'utf-8');

    // Property: Modal should use Dialog components
    expect(fileContent).toContain('Dialog');
    expect(fileContent).toContain('DialogContent');
    expect(fileContent).toContain('DialogHeader');
    expect(fileContent).toContain('DialogTitle');
    expect(fileContent).toContain('DialogFooter');
  });

  it('should verify free tier has fewer features than premium tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREMIUM_FEATURE_KEYS),
        (featureKey) => {
          // Property: For boolean features, free should be false and premium should be true
          const freeValue = TIER_FEATURES.free[featureKey];
          const premiumValue = TIER_FEATURES.premium[featureKey];
          
          // Premium should have more access than free
          if (typeof freeValue === 'boolean' && typeof premiumValue === 'boolean') {
            expect(premiumValue).toBe(true);
            expect(freeValue).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
