import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { StoresService } from '../stores.service';
import { UserPreferencesService } from '../user-preferences.service';

describe('StoresService - Integration test for invoice settings save', () => {
  it('should successfully save invoice settings with store update', async () => {
    // Simulate the exact flow that was failing:
    // 1. Get default store (with JOIN)
    // 2. Update store payment method
    // 3. Update user preferences template

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const storesService = new StoresService(supabase);
    const prefsService = new UserPreferencesService(supabase);

    // Step 1: Get default store (this was failing with .single())
    const { data: store, error: storeError } = await storesService.getDefaultStore();

    expect(storeError).toBeNull();
    expect(store).toBeDefined();

    if (!store) return;

    // Step 2: Update store (simulating payment method change)
    const { error: updateStoreError } = await storesService.updateStore(
      store.id,
      { payment_method: 'BCA - 1234567890' }
    );

    expect(updateStoreError).toBeNull();

    // Step 3: Update preferences (simulating template selection)
    const { error: updatePrefsError } = await prefsService.updatePreferences({
      selected_template: 'modern',
      export_quality_kb: 100,
    });

    expect(updatePrefsError).toBeNull();

    // All operations should succeed without "Cannot coerce" error
  });
});
