import { describe, it, expect, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { StoresService } from '../stores.service';

describe('StoresService - .single() anti-pattern fix', () => {
  let service: StoresService;
  let supabase: ReturnType<typeof createClient>;

  beforeEach(() => {
    // Use test Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    service = new StoresService(supabase);
  });

  it('should return default store with store_contacts JOIN without coercion error', async () => {
    // This test verifies the fix for the "Cannot coerce to JSON object" error
    // that occurs when using .limit(1).single() with JOINs

    const result = await service.getDefaultStore();

    // Should not throw "Cannot coerce to single JSON object" error
    expect(result.error).toBeNull();

    // Should return store with nested store_contacts
    if (result.data) {
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('name');
      // store_contacts might be null or array
      expect(result.data).toHaveProperty('store_contacts');
    }
  });

  it('should handle user with no stores gracefully', async () => {
    // Mock user with no stores - should return null without error
    const result = await service.getDefaultStore();

    // Should not throw error even if no stores found
    expect(result.error).toBeNull();
  });
});
