import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateTotal } from '../invoice-calculation';

describe('Invoice Calculation Service - Property-Based Tests', () => {
  // Feature: invoice-export-and-tax-preferences, Property 5: Tax calculation when disabled
  // **Validates: Requirements 2.5**
  describe('Property 5: Tax calculation when disabled', () => {
    it('should return zero tax and total equal to subtotal plus shipping when tax is disabled', () => {
      fc.assert(
        fc.property(
          fc.record({
            subtotal: fc.float({ min: 0, max: 10000, noNaN: true }),
            shipping: fc.float({ min: 0, max: 1000, noNaN: true }),
          }),
          ({ subtotal, shipping }) => {
            const result = calculateTotal(subtotal, shipping, false, 0);
            
            // Tax amount should be zero when disabled
            expect(result.taxAmount).toBe(0);
            
            // Total should equal subtotal + shipping (rounded to 2 decimals)
            const expectedTotal = Math.round((subtotal + shipping) * 100) / 100;
            expect(result.total).toBe(expectedTotal);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 7: Tax calculation formula
  // **Validates: Requirements 3.2**
  describe('Property 7: Tax calculation formula', () => {
    it('should calculate tax as (subtotal × percentage) / 100 and total as subtotal + shipping + tax', () => {
      fc.assert(
        fc.property(
          fc.record({
            subtotal: fc.float({ min: 0, max: 10000, noNaN: true }),
            shipping: fc.float({ min: 0, max: 1000, noNaN: true }),
            taxPercent: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          ({ subtotal, shipping, taxPercent }) => {
            const result = calculateTotal(subtotal, shipping, true, taxPercent);
            
            // Calculate expected tax amount (rounded to 2 decimals)
            const expectedTax = Math.round((subtotal * taxPercent) / 100 * 100) / 100;
            expect(result.taxAmount).toBe(expectedTax);
            
            // Calculate expected total (rounded to 2 decimals)
            const expectedTotal = Math.round((subtotal + shipping + expectedTax) * 100) / 100;
            expect(result.total).toBe(expectedTotal);
            
            // Verify all values are rounded to 2 decimal places
            expect(result.subtotal).toBe(Math.round(subtotal * 100) / 100);
            expect(result.shippingCost).toBe(Math.round(shipping * 100) / 100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('Invoice Calculation Service - Unit Tests', () => {
  describe('Edge cases', () => {
    it('should handle zero subtotal', () => {
      const result = calculateTotal(0, 10, true, 10);
      expect(result.subtotal).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(10);
    });

    it('should handle zero shipping', () => {
      const result = calculateTotal(100, 0, true, 10);
      expect(result.shippingCost).toBe(0);
      expect(result.taxAmount).toBe(10);
      expect(result.total).toBe(110);
    });

    it('should handle zero tax percentage', () => {
      const result = calculateTotal(100, 10, true, 0);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(110);
    });

    it('should round to 2 decimal places correctly', () => {
      // Test case that would produce more than 2 decimal places
      const result = calculateTotal(100.555, 10.777, true, 15.333);
      
      // All values should be rounded to 2 decimals
      expect(result.subtotal).toBe(100.56);
      expect(result.shippingCost).toBe(10.78);
      
      // Tax: (100.555 * 15.333) / 100 = 15.422... rounded to 15.42
      expect(result.taxAmount).toBe(15.42);
      
      // Total: 100.555 + 10.777 + 15.422... = 126.754... rounded to 126.75
      expect(result.total).toBe(126.75);
    });

    it('should handle rounding edge case with 0.005', () => {
      // Test banker's rounding or standard rounding
      const result = calculateTotal(100, 0, true, 10.05);
      
      // Tax: (100 * 10.05) / 100 = 10.05
      expect(result.taxAmount).toBe(10.05);
      expect(result.total).toBe(110.05);
    });
  });
});
