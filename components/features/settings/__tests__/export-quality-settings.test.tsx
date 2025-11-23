import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ExportQualitySettings } from "../export-quality-settings";
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

describe("ExportQualitySettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render slider with quality labels", async () => {
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

    render(<ExportQualitySettings />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("Small")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Medium (~100KB)")).toBeInTheDocument();
  });

  it("should show loading state while fetching preferences", () => {
    vi.mocked(userPreferencesService.getUserPreferences).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ExportQualitySettings />);

    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  it("should load and display initial quality value", async () => {
    vi.mocked(userPreferencesService.getUserPreferences).mockResolvedValue({
      data: {
        id: "pref-123",
        user_id: "test-user-123",
        preferred_language: "en",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        currency: "USD",
        default_store_id: null,
        export_quality_kb: 150,
        tax_enabled: false,
        tax_percentage: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });

    render(<ExportQualitySettings />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    // Should display "High" for 150KB
    expect(screen.getByText("High (~150KB)")).toBeInTheDocument();
  });

  it("should render with default quality when no preference exists", async () => {
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

    render(<ExportQualitySettings />);

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences...")
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("Medium (~100KB)")).toBeInTheDocument();
  });
});
