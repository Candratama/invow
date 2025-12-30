/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { UserPreferencesService } from '../user-preferences.service';
import type { UserPreferences } from '@/lib/db/database.types';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };
  
  return {
    createClient: () => mockSupabase,
  };
});

describe('UserPreferencesService - Property-Based Tests', () => {
  let service: UserPreferencesService;
  let mockSupabase: {
    auth: { getUser: ReturnType<typeof vi.fn> };
    from: ReturnType<typeof vi.fn>;
  };
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const { createClient } = await import('@/lib/supabase/client');
    mockSupabase = createClient() as unknown as typeof mockSupabase;
    
    // Pass the mocked client to the service
    service = new UserPreferencesService(mockSupabase as any);
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 1: Export quality persistence
  // **Validates: Requirements 1.2, 1.5**
  describe('Property 1: Export quality persistence', () => {
    it('should persist and retrieve the same export quality value', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(50 as const, 100 as const, 150 as const),
          async (quality) => {
            // Mock the update operation
            const mockUpdateQuery = {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'pref-123',
                  user_id: mockUser.id,
                  export_quality_kb: quality,
                  tax_enabled: false,
                  tax_percentage: null,
                } as Partial<UserPreferences>,
                error: null,
              }),
            };

            mockSupabase.from.mockReturnValue(mockUpdateQuery);

            // Save the quality
            const saveResult = await service.updateExportQuality(quality);
            expect(saveResult.error).toBeNull();
            expect(saveResult.data?.export_quality_kb).toBe(quality);

            // Mock the select operation for reading
            const mockSelectQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'pref-123',
                  user_id: mockUser.id,
                  export_quality_kb: quality,
                  tax_enabled: false,
                  tax_percentage: null,
                } as Partial<UserPreferences>,
                error: null,
              }),
            };

            mockSupabase.from.mockReturnValue(mockSelectQuery);

            // Read the preferences
            const readResult = await service.getUserPreferences();
            expect(readResult.error).toBeNull();
            expect(readResult.data.export_quality_kb).toBe(quality);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 4: Tax settings persistence
  // **Validates: Requirements 2.4**
  describe('Property 4: Tax settings persistence', () => {
    it('should persist and retrieve the same tax settings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            enabled: fc.boolean(),
            percentage: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          async ({ enabled, percentage }) => {
            // Mock the update operation
            const mockUpdateQuery = {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'pref-123',
                  user_id: mockUser.id,
                  tax_enabled: enabled,
                  tax_percentage: enabled ? percentage : null,
                } as Partial<UserPreferences>,
                error: null,
              }),
            };

            mockSupabase.from.mockReturnValue(mockUpdateQuery);

            // Save the tax settings
            const saveResult = await service.updateTaxSettings(enabled, percentage);
            expect(saveResult.error).toBeNull();
            expect(saveResult.data?.tax_enabled).toBe(enabled);
            expect(saveResult.data?.tax_percentage).toBe(enabled ? percentage : null);

            // Mock the select operation for reading
            const mockSelectQuery = {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'pref-123',
                  user_id: mockUser.id,
                  tax_enabled: enabled,
                  tax_percentage: enabled ? percentage : null,
                } as Partial<UserPreferences>,
                error: null,
              }),
            };

            mockSupabase.from.mockReturnValue(mockSelectQuery);

            // Read the preferences
            const readResult = await service.getUserPreferences();
            expect(readResult.error).toBeNull();
            expect(readResult.data.tax_enabled).toBe(enabled);
            expect(readResult.data.tax_percentage).toBe(enabled ? percentage : null);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 10: Export quality validation
  // **Validates: Requirements 4.3**
  describe('Property 10: Export quality validation', () => {
    it('should accept only 50, 100, or 150 and reject all other values', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -100, max: 200 }),
          async (quality) => {
            const isValid = quality === 50 || quality === 100 || quality === 150;

            if (isValid) {
              // Mock successful update for valid values
              const mockUpdateQuery = {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'pref-123',
                    user_id: mockUser.id,
                    export_quality_kb: quality,
                  } as Partial<UserPreferences>,
                  error: null,
                }),
              };

              mockSupabase.from.mockReturnValue(mockUpdateQuery);

              const result = await service.updateExportQuality(quality as 50 | 100 | 150);
              expect(result.error).toBeNull();
              expect(result.data?.export_quality_kb).toBe(quality);
            } else {
              // Invalid values should be rejected
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const result = await service.updateExportQuality(quality as any);
              expect(result.error).not.toBeNull();
              expect(result.error?.message).toContain('Export quality must be');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 3: Tax percentage validation
  // **Validates: Requirements 2.3, 4.4**
  describe('Property 3: Tax percentage validation', () => {
    it('should accept values between 0 and 100 (inclusive) and reject values outside this range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: -100, max: 200, noNaN: true }),
          async (percentage) => {
            const isValid = percentage >= 0 && percentage <= 100;

            if (isValid) {
              // Mock successful update for valid values
              const mockUpdateQuery = {
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'pref-123',
                    user_id: mockUser.id,
                    tax_enabled: true,
                    tax_percentage: percentage,
                  } as Partial<UserPreferences>,
                  error: null,
                }),
              };

              mockSupabase.from.mockReturnValue(mockUpdateQuery);

              const result = await service.updateTaxSettings(true, percentage);
              expect(result.error).toBeNull();
              expect(result.data?.tax_percentage).toBe(percentage);
            } else {
              // Invalid values should be rejected
              const result = await service.updateTaxSettings(true, percentage);
              expect(result.error).not.toBeNull();
              expect(result.error?.message).toContain('Tax percentage must be between 0 and 100');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: invoice-export-and-tax-preferences, Property 11: Tax percentage null when disabled
  // **Validates: Requirements 4.5**
  describe('Property 11: Tax percentage null when disabled', () => {
    it('should set tax_percentage to null when tax is disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: 0, max: 100, noNaN: true }),
          async (percentage) => {
            // Mock the update operation with tax disabled
            const mockUpdateQuery = {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'pref-123',
                  user_id: mockUser.id,
                  tax_enabled: false,
                  tax_percentage: null,
                } as Partial<UserPreferences>,
                error: null,
              }),
            };

            mockSupabase.from.mockReturnValue(mockUpdateQuery);

            // Update with tax disabled (percentage should be ignored)
            const result = await service.updateTaxSettings(false, percentage);
            expect(result.error).toBeNull();
            expect(result.data?.tax_enabled).toBe(false);
            expect(result.data?.tax_percentage).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
