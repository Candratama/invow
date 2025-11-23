import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaxSettings } from "../tax-settings";
import { userPreferencesService } from "@/lib/db/services";

// Mock the services
vi.mock("@/lib/db/services", () => ({
  userPreferencesService: {
    getUserPreferences: vi.fn(),
  },
}));

// Mock the auth context
vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: "test-user-123", email: "test@example.com" },
  }),
}));

describe("TaxSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render tax percentage input", async () => {
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: "pref-123",
        user_id: "test-user-123",
        preferred_language: "en",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        currency: "USD",
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: false,
        tax_percentage: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText("Tax Percentage (%)")).toBeInTheDocument();
  });

  it("should call onTaxPercentageChange when percentage input changes", async () => {
    const user = userEvent.setup();
    const onTaxPercentageChange = vi.fn();

    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: "pref-123",
        user_id: "test-user-123",
        preferred_language: "en",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        currency: "USD",
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: true,
        tax_percentage: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings onTaxPercentageChange={onTaxPercentageChange} />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    const percentageInput = screen.getByLabelText("Tax Percentage (%)");
    await user.clear(percentageInput);
    await user.type(percentageInput, "15");

    expect(onTaxPercentageChange).toHaveBeenCalled();
  });

  it("should show loading state while fetching preferences", () => {
    vi.mocked(userPreferencesService.getUserPreferences).mockImplementation(
      () => new Promise(() => {})
    );

    render(<TaxSettings />);

    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  it("should load and display initial tax percentage value", async () => {
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: "pref-123",
        user_id: "test-user-123",
        preferred_language: "en",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        currency: "USD",
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

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    const percentageInput = screen.getByLabelText(
      "Tax Percentage (%)"
    ) as HTMLInputElement;
    expect(percentageInput.value).toBe("15");
  });

  it("should call onTaxEnabledChange when percentage changes to/from 0", async () => {
    const user = userEvent.setup();
    const onTaxEnabledChange = vi.fn();

    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: "pref-123",
        user_id: "test-user-123",
        preferred_language: "en",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        currency: "USD",
        default_store_id: null,
        export_quality_kb: 100,
        tax_enabled: false,
        tax_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<TaxSettings onTaxEnabledChange={onTaxEnabledChange} />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    const percentageInput = screen.getByLabelText("Tax Percentage (%)");
    await user.clear(percentageInput);
    await user.type(percentageInput, "10");

    // Should have been called with true when percentage > 0
    expect(onTaxEnabledChange).toHaveBeenCalledWith(true);
  });
});
