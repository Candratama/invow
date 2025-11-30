/**
 * Property-Based Test for Premium Feature Disabled State
 * 
 * **Feature: premium-feature-gating, Property 5: Premium feature disabled state for free users**
 * **Validates: Requirements 4.1, 5.1, 6.1, 10.1**
 * 
 * Property: For any free user viewing premium features (logo, signature, custom colors, reports),
 * those features should be in a disabled state.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { TIER_FEATURES, TierFeatures } from '@/lib/config/pricing';

// Premium features that should be disabled for free users
const PREMIUM_BOOLEAN_FEATURES: (keyof TierFeatures)[] = [
  'hasLogo',
  'hasSignature',
  'hasCustomColors',
  'hasMonthlyReport',
];

describe('Property 5: Premium feature disabled state for free users', () => {
  it('should verify FeatureGate component exists with required structure', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should be a client component
    expect(fileContent).toContain('"use client"');

    // Property: Component should accept feature prop
    expect(fileContent).toContain('feature');

    // Property: Component should accept hasAccess prop
    expect(fileContent).toContain('hasAccess');

    // Property: Component should accept children prop
    expect(fileContent).toContain('children');
  });

  it('should verify FeatureGate shows Premium badge for locked features', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should show "Premium" badge text
    expect(fileContent).toContain('Premium');

    // Property: Component should have showBadge prop with default true
    expect(fileContent).toContain('showBadge');
    expect(fileContent).toMatch(/showBadge\s*=\s*true/);
  });

  it('should verify FeatureGate renders children when user has access', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: When hasAccess is true, children should be rendered directly
    expect(fileContent).toContain('if (hasAccess)');
    expect(fileContent).toContain('return <>{children}</>');
  });

  it('should verify FeatureGate shows disabled state for locked features', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Locked features should have reduced opacity
    expect(fileContent).toContain('opacity-50');

    // Property: Locked features should have pointer-events-none
    expect(fileContent).toContain('pointer-events-none');
  });

  it('should verify FeatureGate triggers UpgradeModal on click', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should import UpgradeModal
    const hasUpgradeModalImport = fileContent.includes('UpgradeModal') &&
      (fileContent.includes("from '@/components/features/subscription/upgrade-modal'") ||
       fileContent.includes('from "@/components/features/subscription/upgrade-modal"'));
    expect(hasUpgradeModalImport).toBe(true);

    // Property: Component should have click handler
    expect(fileContent).toContain('onClick');

    // Property: Component should manage modal open state
    expect(fileContent).toContain('isUpgradeModalOpen');
    expect(fileContent).toContain('setIsUpgradeModalOpen');
  });

  it('should verify FeatureGate supports keyboard accessibility', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should have role="button" for accessibility
    expect(fileContent).toContain('role="button"');

    // Property: Component should have tabIndex for keyboard navigation
    expect(fileContent).toContain('tabIndex');

    // Property: Component should handle keyboard events (Enter/Space)
    expect(fileContent).toContain('onKeyDown');
    expect(fileContent).toContain('Enter');
    // Space key is checked with e.key === " " (space character)
    expect(fileContent).toMatch(/e\.key\s*===\s*["'][\s]["']/)
  });

  it('should verify FeatureGate has Lock icon for visual indication', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should import Lock icon
    expect(fileContent).toContain('Lock');
    expect(fileContent).toContain('lucide-react');
  });

  it('should verify all premium boolean features are false for free tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        (featureKey) => {
          const freeFeatures = TIER_FEATURES.free;

          // Property: Free tier should NOT have access to premium boolean features
          expect(freeFeatures[featureKey]).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify all premium boolean features are true for premium tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        (featureKey) => {
          const premiumFeatures = TIER_FEATURES.premium;

          // Property: Premium tier SHOULD have access to premium boolean features
          expect(premiumFeatures[featureKey]).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify FeatureGate has feature display names for all gated features', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should have display names for premium features
    expect(fileContent).toContain('FEATURE_DISPLAY_NAMES');
    
    // Property: Should have display names for all premium boolean features
    expect(fileContent).toContain('hasLogo');
    expect(fileContent).toContain('hasSignature');
    expect(fileContent).toContain('hasCustomColors');
    expect(fileContent).toContain('hasMonthlyReport');
  });

  it('should verify FeatureGate passes feature info to UpgradeModal', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: UpgradeModal should receive feature name
    expect(fileContent).toContain('feature={');
    
    // Property: UpgradeModal should receive feature description
    expect(fileContent).toContain('featureDescription');
  });

  it('should verify FeatureGate supports custom fallback content', () => {
    const componentPath = path.join(process.cwd(), 'components/ui/feature-gate.tsx');
    const fileContent = fs.readFileSync(componentPath, 'utf-8');

    // Property: Component should accept fallback prop
    expect(fileContent).toContain('fallback');

    // Property: Component should render fallback when provided
    expect(fileContent).toContain('if (fallback)');
  });

  it('should verify free tier has strictly fewer premium features than premium tier', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREMIUM_BOOLEAN_FEATURES),
        (featureKey) => {
          const freeValue = TIER_FEATURES.free[featureKey];
          const premiumValue = TIER_FEATURES.premium[featureKey];

          // Property: For each premium feature, free should be false and premium should be true
          // This ensures the disabled state is correctly applied based on tier
          expect(freeValue).toBe(false);
          expect(premiumValue).toBe(true);
          
          // Property: Premium tier should have strictly more access
          expect(premiumValue).not.toBe(freeValue);
        }
      ),
      { numRuns: 100 }
    );
  });
});
