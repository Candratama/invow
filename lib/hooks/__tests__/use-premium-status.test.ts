import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { usePremiumStatus, useInvalidatePremiumStatus } from "../use-premium-status";

// Mock the subscription action
vi.mock("@/app/actions/subscription", () => ({
  getSubscriptionStatusAction: vi.fn(),
}));

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("usePremiumStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return loading state initially", async () => {
    const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
    vi.mocked(getSubscriptionStatusAction).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading
    );

    const { result } = renderHook(() => usePremiumStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPremium).toBe(false);
    expect(result.current.tier).toBe("free");
  });

  it("should detect premium user correctly", async () => {
    const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
    vi.mocked(getSubscriptionStatusAction).mockResolvedValue({
      data: {
        tier: "premium",
        invoiceLimit: 100,
        currentMonthCount: 5,
        remainingInvoices: 95,
        monthYear: "2024-12-01",
        resetDate: new Date("2025-01-01"),
      },
      error: null,
    });

    const { result } = renderHook(() => usePremiumStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(true);
    expect(result.current.tier).toBe("premium");
  });

  it("should detect free user correctly", async () => {
    const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
    vi.mocked(getSubscriptionStatusAction).mockResolvedValue({
      data: {
        tier: "free",
        invoiceLimit: 10,
        currentMonthCount: 3,
        remainingInvoices: 7,
        monthYear: "2024-12-01",
        resetDate: new Date("2025-01-01"),
      },
      error: null,
    });

    const { result } = renderHook(() => usePremiumStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.tier).toBe("free");
  });

  it("should default to free tier on error", async () => {
    const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
    vi.mocked(getSubscriptionStatusAction).mockResolvedValue({
      data: null,
      error: "Unauthorized",
    });

    const { result } = renderHook(() => usePremiumStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.tier).toBe("free");
  });

  it("should use initialData when provided and no cache exists", async () => {
    const { getSubscriptionStatusAction } = await import("@/app/actions/subscription");
    vi.mocked(getSubscriptionStatusAction).mockResolvedValue({
      data: {
        tier: "free",
        invoiceLimit: 10,
        currentMonthCount: 0,
        remainingInvoices: 10,
        monthYear: "2024-12-01",
        resetDate: new Date("2025-01-01"),
      },
      error: null,
    });

    const initialData = { isPremium: true, tier: "premium" };
    
    const { result } = renderHook(() => usePremiumStatus(initialData), {
      wrapper: createWrapper(),
    });

    // Should immediately have initialData
    expect(result.current.isPremium).toBe(true);
    expect(result.current.tier).toBe("premium");
  });
});

describe("useInvalidatePremiumStatus", () => {
  it("should return a function", () => {
    const { result } = renderHook(() => useInvalidatePremiumStatus(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current).toBe("function");
  });
});
