/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvoicesService } from '../invoices.service';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => {
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  };
  
  return {
    createClient: () => mockSupabase,
  };
});

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockSupabase: {
    auth: { getUser: ReturnType<typeof vi.fn> };
    from: ReturnType<typeof vi.fn>;
    rpc: ReturnType<typeof vi.fn>;
  };
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked supabase client
    const { createClient } = await import('@/lib/supabase/client');
    mockSupabase = createClient() as unknown as typeof mockSupabase;
    
    // Pass the mocked client to the service
    service = new InvoicesService(mockSupabase as any);
    
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  describe('getInvoicesPaginated', () => {
    it('should fetch invoices with pagination in descending order', async () => {
      const mockInvoices = [
        {
          id: 'inv-3',
          invoice_number: 'INV-003',
          created_at: '2024-01-03T00:00:00Z',
          invoice_items: [
            { id: 'item-1', position: 0, description: 'Item 1' },
            { id: 'item-2', position: 1, description: 'Item 2' },
          ],
        },
        {
          id: 'inv-2',
          invoice_number: 'INV-002',
          created_at: '2024-01-02T00:00:00Z',
          invoice_items: [],
        },
        {
          id: 'inv-1',
          invoice_number: 'INV-001',
          created_at: '2024-01-01T00:00:00Z',
          invoice_items: [],
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockInvoices,
          error: null,
          count: 25,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getInvoicesPaginated(1, 10, 'synced');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.invoices).toHaveLength(3);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(10);
      expect(result.data?.total).toBe(25);
      expect(result.data?.totalPages).toBe(3);

      // Verify query was built correctly
      expect(mockQuery.select).toHaveBeenCalledWith(
        expect.stringContaining('invoice_items'),
        { count: 'exact' }
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'synced');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9); // Page 1: offset 0, limit 10
    });

    it('should calculate correct offset for page 2', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 25,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getInvoicesPaginated(2, 10, 'synced');

      // Page 2: offset 10, limit 10 (range 10-19)
      expect(mockQuery.range).toHaveBeenCalledWith(10, 19);
    });

    it('should sort invoice items by position', async () => {
      const mockInvoices = [
        {
          id: 'inv-1',
          invoice_items: [
            { id: 'item-3', position: 2, description: 'Third' },
            { id: 'item-1', position: 0, description: 'First' },
            { id: 'item-2', position: 1, description: 'Second' },
          ],
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockInvoices,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getInvoicesPaginated(1, 10);

      expect(result.data?.invoices[0].invoice_items[0].position).toBe(0);
      expect(result.data?.invoices[0].invoice_items[1].position).toBe(1);
      expect(result.data?.invoices[0].invoice_items[2].position).toBe(2);
    });

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getInvoicesPaginated(1, 10);

      expect(result.error).toBeNull();
      expect(result.data?.invoices).toHaveLength(0);
      expect(result.data?.total).toBe(0);
      expect(result.data?.totalPages).toBe(0);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' },
          count: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getInvoicesPaginated(1, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await service.getInvoicesPaginated(1, 10);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('not authenticated');
    });

    it('should fetch exactly 10 invoices per page', async () => {
      const mockInvoices = Array.from({ length: 10 }, (_, i) => ({
        id: `inv-${i}`,
        invoice_number: `INV-${String(i).padStart(3, '0')}`,
        created_at: new Date(2024, 0, i + 1).toISOString(),
        invoice_items: [],
      }));

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockInvoices,
          error: null,
          count: 50,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getInvoicesPaginated(1, 10);

      expect(result.data?.invoices).toHaveLength(10);
      expect(result.data?.pageSize).toBe(10);
    });
  });

  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      
      // The second eq() call should return the final result
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({
        error: null,
      });

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.deleteInvoice('inv-123');

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'inv-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('should handle delete errors', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      
      // The second eq() call should return the error
      mockQuery.eq.mockReturnValueOnce(mockQuery).mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.deleteInvoice('inv-123');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Delete failed');
    });
  });
});
