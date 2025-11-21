import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaxSettings } from '../tax-settings';
import { userPreferencesService } from '@/lib/db/services';

// Mock the services
vi.mock('@/lib/db/services', () => ({
  userPreferencesService: {
    getUserPreferences: vi.fn(),
    updateTaxSettings: vi.fn(),
  },
}));

// Mock the auth context
vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
  }),
}));

describe('TaxSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test: Toggle shows/hides percentage input
  it('should show percentage input when tax is enabled and hide when disabled', async () => {
    const user = userEvent.setup();

    // Mock getUserPreferences to return tax disabled
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: false,
        tax_percentage: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    // Mock updateTaxSettings to succeed
    vi.mocked(userPreferencesService.updateTaxSettings).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
    });

    // Initially, percentage input should not be visible
    expect(screen.queryByLabelText('Tax Percentage (%)')).not.toBeInTheDocument();

    // Find and click the toggle switch
    const toggleSwitch = screen.getByRole('switch');
    expect(toggleSwitch).toHaveAttribute('aria-checked', 'false');
    await user.click(toggleSwitch);

    // Wait for the percentage input to appear
    await waitFor(() => {
      expect(screen.getByLabelText('Tax Percentage (%)')).toBeInTheDocument();
    });
  });

  // Test: Validation for percentage
  it('should validate that percentage is between 0 and 100', async () => {
    const user = userEvent.setup();

    // Mock getUserPreferences to return tax enabled
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    // Mock updateTaxSettings to fail with validation error
    vi.mocked(userPreferencesService.updateTaxSettings).mockResolvedValue({
      data: null,
      error: new Error('Tax percentage must be between 0 and 100'),
    });

    render(<TaxSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
    });

    // Find the percentage input
    const percentageInput = screen.getByLabelText('Tax Percentage (%)');

    // Clear and enter invalid value (> 100)
    await user.clear(percentageInput);
    await user.type(percentageInput, '150');

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Wait for error message
    await waitFor(
      () => {
        expect(screen.getByText('Tax percentage must be between 0 and 100')).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  // Test: Debouncing behavior
  it('should debounce percentage input changes', async () => {
    const user = userEvent.setup();

    // Mock getUserPreferences to return tax enabled
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    // Mock updateTaxSettings to succeed
    vi.mocked(userPreferencesService.updateTaxSettings).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
    });

    // Find the percentage input
    const percentageInput = screen.getByLabelText('Tax Percentage (%)');

    // Type multiple characters quickly
    await user.clear(percentageInput);
    await user.type(percentageInput, '15');

    // Service should not be called immediately (no auto-save)
    expect(userPreferencesService.updateTaxSettings).not.toHaveBeenCalled();

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Now the service should be called once
    await waitFor(() => {
      expect(userPreferencesService.updateTaxSettings).toHaveBeenCalledTimes(1);
      expect(userPreferencesService.updateTaxSettings).toHaveBeenCalledWith(true, 15);
    });
  });

  // Test: Loading state
  it('should show loading state while fetching preferences', () => {
    // Mock getUserPreferences to never resolve (simulating loading)
    vi.mocked(userPreferencesService.getUserPreferences).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TaxSettings />);

    // Check loading state is displayed
    expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
  });

  // Test: Error state when loading fails
  it('should show error message when loading preferences fails', async () => {
    // Mock getUserPreferences to return error
    vi.mocked(userPreferencesService.getUserPreferences).mockRejectedValue(
      new Error('Failed to load preferences')
    );

    render(<TaxSettings />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load preferences')).toBeInTheDocument();
    });
  });

  // Test: Success feedback
  it('should show success message after saving tax settings', async () => {
    const user = userEvent.setup();

    // Mock getUserPreferences to return tax disabled
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: false,
        tax_percentage: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    // Mock updateTaxSettings to succeed
    vi.mocked(userPreferencesService.updateTaxSettings).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
    });

    // Click the toggle to enable tax
    const toggleSwitch = screen.getByRole('switch');
    await user.click(toggleSwitch);

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Tax settings saved successfully!')).toBeInTheDocument();
    });
  });

  // Test: Renders with tax enabled and percentage value
  it('should render with tax enabled and show percentage value', async () => {
    // Mock getUserPreferences to return tax enabled with percentage
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: 'pref-123',
        user_id: 'test-user-123',
        preferred_language: 'en',
        timezone: 'UTC',
        date_format: 'YYYY-MM-DD',
        currency: 'USD',
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
    });

    // Check toggle is enabled
    const toggleSwitch = screen.getByRole('switch');
    expect(toggleSwitch).toHaveAttribute('aria-checked', 'true');

    // Check percentage input is visible and has correct value
    const percentageInput = screen.getByLabelText('Tax Percentage (%)') as HTMLInputElement;
    expect(percentageInput).toBeInTheDocument();
    expect(percentageInput.value).toBe('15');
  });
});
