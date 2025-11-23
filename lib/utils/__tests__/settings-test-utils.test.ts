/**
 * Verification tests for settings test utilities
 * Ensures generators and helpers work correctly
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  hexColorArbitrary,
  whatsappArbitrary,
  emailArbitrary,
  urlArbitrary,
  businessInfoArbitrary,
  authorizedPersonArbitrary,
  invoiceSettingsArbitrary,
  subscriptionStatusArbitrary,
  createTestQueryClient,
  createWrapper,
} from './settings-test-utils';

describe('Settings Test Utilities', () => {
  describe('Arbitraries (Generators)', () => {
    it('should generate valid hex colors', () => {
      fc.assert(
        fc.property(hexColorArbitrary, (color) => {
          // Verify format: #RRGGBB
          expect(color).toMatch(/^#[0-9a-f]{6}$/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid WhatsApp numbers', () => {
      fc.assert(
        fc.property(whatsappArbitrary, (whatsapp) => {
          // Verify format: +62 followed by digits
          expect(whatsapp).toMatch(/^\+62\d+$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid email addresses', () => {
      fc.assert(
        fc.property(emailArbitrary, (email) => {
          // Verify format: local@domain
          expect(email).toMatch(/^[a-z0-9]+@[a-z0-9.]+$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid URLs', () => {
      fc.assert(
        fc.property(urlArbitrary, (url) => {
          // Verify format: http(s)://domain.tld
          expect(url).toMatch(/^https?:\/\/[a-z0-9-]+\.(com|net|org|id)$/);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid business info', () => {
      fc.assert(
        fc.property(businessInfoArbitrary, (businessInfo) => {
          // Verify required fields are present
          expect(businessInfo.name).toBeTruthy();
          expect(businessInfo.address).toBeTruthy();
          expect(businessInfo.whatsapp).toBeTruthy();
          expect(businessInfo.brandColor).toMatch(/^#[0-9a-f]{6}$/i);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid authorized person data', () => {
      fc.assert(
        fc.property(authorizedPersonArbitrary, (person) => {
          // Verify required fields
          expect(person.id).toBeTruthy();
          expect(person.name).toBeTruthy();
          expect(typeof person.is_primary).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid invoice settings', () => {
      fc.assert(
        fc.property(invoiceSettingsArbitrary, (settings) => {
          // Verify template is one of the valid options
          expect(['classic', 'modern', 'elegant', 'simple', 'bold', 'compact', 'corporate', 'creative']).toContain(
            settings.selectedTemplate
          );
          // Verify export quality is valid
          expect([50, 100, 150]).toContain(settings.exportQuality);
          // Verify tax percentage is in range if present
          if (settings.taxPercentage !== null && settings.taxPercentage !== undefined) {
            expect(settings.taxPercentage).toBeGreaterThanOrEqual(0);
            expect(settings.taxPercentage).toBeLessThanOrEqual(100);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid subscription status', () => {
      fc.assert(
        fc.property(subscriptionStatusArbitrary, (status) => {
          // Verify tier is valid
          expect(['free', 'pro', 'enterprise']).toContain(status.tier);
          // Verify limits are non-negative
          expect(status.invoiceLimit).toBeGreaterThanOrEqual(0);
          expect(status.currentMonthCount).toBeGreaterThanOrEqual(0);
          expect(status.remainingInvoices).toBeGreaterThanOrEqual(0);
          // Verify monthYear format
          expect(status.monthYear).toMatch(/^\d{4}-\d{2}$/);
          // Verify resetDate is a Date
          expect(status.resetDate).toBeInstanceOf(Date);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Test Helpers', () => {
    it('should create a QueryClient with correct configuration', () => {
      const queryClient = createTestQueryClient();
      
      expect(queryClient).toBeDefined();
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(false);
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(5 * 60 * 1000);
    });

    it('should create a wrapper with QueryClient', () => {
      const { Wrapper, queryClient } = createWrapper();
      
      expect(Wrapper).toBeDefined();
      expect(queryClient).toBeDefined();
      expect(typeof Wrapper).toBe('function');
    });
  });
});
