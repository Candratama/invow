import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useInvoices, useSubscriptionStatus, useCreateInvoice, useDeleteInvoice } from '../use-dashboard-data';
import { invoicesService, subscriptionService } from '@/lib/db/services';
import { useAuth } from '@/lib/auth/auth-context';
import React from 'react';

// Mock dependencies
vi.mock('@/lib/db/services', () => ({
  invoicesService: {
    getInvoicesPaginated: vi.fn(),
    upsertInvoiceWithItems: vi.fn(),
    deleteInvoice: vi.fn(),
  },
  subscriptionService: {
    getSubscriptionStatus: vi.fn(),
    canGenerateInvoice: vi.fn(),
    incrementInvoiceCount: vi.fn(),
  },
}));

vi.mock('@/lib/auth/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

  return Wrapper;
};

describe('Dashboard Data Hooks', () => {
  const mockUser = { 
    id: 'user-123', 
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: vi.fn(),
      session: null,
      signUp: vi.fn(),
      signIn: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('useInvoices', () => {
    it('should fetch paginated invoices successfully', async () => {
      const mockInvoicesData = {
        invoices: [
          {
            id: 'inv-1',
            user_id: 'user-123',
            store_id: 'store-1',
            invoice_number: 'INV-001',
            invoice_date: new Date().toISOString(),
            customer_name: 'Customer 1',
            customer_email: null,
            customer_address: null,
            customer_status: null,
            subtotal: 1000,
            shipping_cost: 0,
            total: 1000,
            note: null,
            status: 'synced' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            synced_at: null,
            invoice_items: [],
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.mocked(invoicesService.getInvoicesPaginated).mockResolvedValue({
        data: mockInvoicesData,
        error: null,
      });

      const { result } = renderHook(() => useInvoices(1, 10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockInvoicesData);
      expect(invoicesService.getInvoicesPaginated).toHaveBeenCalledWith(1, 10, 'synced');
    });

    it('should handle errors when fetching invoices', async () => {
      const mockError = new Error('Failed to fetch invoices');
      vi.mocked(invoicesService.getInvoicesPaginated).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useInvoices(1, 10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should not fetch when user is not authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        loading: false,
        signOut: vi.fn(),
        session: null,
        signUp: vi.fn(),
        signIn: vi.fn(),
        resetPassword: vi.fn(),
      });

      const { result } = renderHook(() => useInvoices(1, 10), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(true);
      expect(invoicesService.getInvoicesPaginated).not.toHaveBeenCalled();
    });

    it('should cache invoices per page separately', async () => {
      const mockPage1Data = {
        invoices: [{ id: 'inv-1', invoice_number: 'INV-001' }],
        total: 20,
        page: 1,
        pageSize: 10,
        totalPages: 2,
      };

      const mockPage2Data = {
        invoices: [{ id: 'inv-11', invoice_number: 'INV-011' }],
        total: 20,
        page: 2,
        pageSize: 10,
        totalPages: 2,
      };

      vi.mocked(invoicesService.getInvoicesPaginated)
        .mockResolvedValueOnce({ data: mockPage1Data, error: null })
        .mockResolvedValueOnce({ data: mockPage2Data, error: null });

      const { result: result1 } = renderHook(() => useInvoices(1, 10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      const { result: result2 } = renderHook(() => useInvoices(2, 10), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(invoicesService.getInvoicesPaginated).toHaveBeenCalledTimes(2);
      expect(result1.current.data?.page).toBe(1);
      expect(result2.current.data?.page).toBe(2);
    });
  });

  describe('useSubscriptionStatus', () => {
    it('should fetch subscription status successfully', async () => {
      const mockSubscriptionData = {
        tier: 'pro',
        invoiceLimit: 100,
        remainingInvoices: 75,
        currentMonthCount: 25,
        monthYear: '2024-01',
        resetDate: new Date(),
      };

      vi.mocked(subscriptionService.getSubscriptionStatus).mockResolvedValue({
        data: mockSubscriptionData,
        error: null,
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSubscriptionData);
    });

    it('should handle errors when fetching subscription status', async () => {
      const mockError = new Error('Failed to fetch subscription');
      vi.mocked(subscriptionService.getSubscriptionStatus).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const { result } = renderHook(() => useSubscriptionStatus(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateInvoice', () => {
    it('should create invoice with optimistic update', async () => {
      const mockInvoiceData = {
        invoice: {
          store_id: 'store-1',
          invoice_number: 'INV-NEW',
          customer_name: 'New Customer',
          total: 5000,
          subtotal: 5000,
          shipping_cost: 0,
          invoice_date: new Date().toISOString(),
          status: 'synced' as const,
        },
        items: [
          {
            description: 'Item 1',
            quantity: 1,
            price: 5000,
            subtotal: 5000,
            position: 0,
          },
        ],
      };

      vi.mocked(subscriptionService.canGenerateInvoice).mockResolvedValue({
        data: true,
        error: null,
      });

      vi.mocked(invoicesService.upsertInvoiceWithItems).mockResolvedValue({
        data: {
          id: 'new-inv-id',
          ...mockInvoiceData.invoice,
          user_id: mockUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          invoice_items: mockInvoiceData.items.map((item, i) => ({
            ...item,
            id: `item-${i}`,
            invoice_id: 'new-inv-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
        },
        error: null,
      });

      vi.mocked(subscriptionService.incrementInvoiceCount).mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockInvoiceData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(subscriptionService.canGenerateInvoice).toHaveBeenCalledWith(mockUser.id);
      expect(invoicesService.upsertInvoiceWithItems).toHaveBeenCalled();
      expect(subscriptionService.incrementInvoiceCount).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle subscription limit reached error', async () => {
      const mockInvoiceData = {
        invoice: {
          store_id: 'store-1',
          invoice_number: 'INV-NEW',
          customer_name: 'New Customer',
          invoice_date: new Date().toISOString(),
          subtotal: 5000,
          shipping_cost: 0,
          total: 5000,
          status: 'synced' as const,
        },
        items: [],
      };

      vi.mocked(subscriptionService.canGenerateInvoice).mockResolvedValue({
        data: false,
        error: null,
      });

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockInvoiceData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Invoice limit reached');
      expect(invoicesService.upsertInvoiceWithItems).not.toHaveBeenCalled();
    });

    it('should rollback optimistic update on error', async () => {
      const mockInvoiceData = {
        invoice: {
          store_id: 'store-1',
          invoice_number: 'INV-NEW',
          customer_name: 'New Customer',
          invoice_date: new Date().toISOString(),
          subtotal: 5000,
          shipping_cost: 0,
          total: 5000,
          status: 'synced' as const,
        },
        items: [],
      };

      vi.mocked(subscriptionService.canGenerateInvoice).mockResolvedValue({
        data: true,
        error: null,
      });

      vi.mocked(invoicesService.upsertInvoiceWithItems).mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const { result } = renderHook(() => useCreateInvoice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(mockInvoiceData as unknown);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Database error');
    });
  });

  describe('useDeleteInvoice', () => {
    it('should delete invoice with optimistic update', async () => {
      const invoiceId = 'inv-to-delete';

      vi.mocked(invoicesService.deleteInvoice).mockResolvedValue({
        success: true,
        error: null,
      });

      const { result } = renderHook(() => useDeleteInvoice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invoiceId);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invoicesService.deleteInvoice).toHaveBeenCalledWith(invoiceId);
    });

    it('should handle delete errors', async () => {
      const invoiceId = 'inv-to-delete';
      const mockError = new Error('Failed to delete');

      vi.mocked(invoicesService.deleteInvoice).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const { result } = renderHook(() => useDeleteInvoice(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(invoiceId);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
