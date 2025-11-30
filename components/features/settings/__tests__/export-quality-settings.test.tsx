import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ExportQualitySettings } from "../export-quality-settings";
import * as preferencesActions from "@/app/actions/preferences";

// Mock the server action
vi.mock("@/app/actions/preferences", () => ({
  getPreferencesAction: vi.fn(),
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
    vi.mocked(preferencesActions.getPreferencesAction).mockResolvedValue({
      success: true,
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
    vi.mocked(preferencesActions.getPreferencesAction).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ExportQualitySettings />);

    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  it("should load and display initial quality value", async () => {
    vi.mocked(preferencesActions.getPreferencesAction).mockResolvedValue({
      success: true,
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
    vi.mocked(preferencesActions.getPreferencesAction).mockResolvedValue({
      success: true,
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
