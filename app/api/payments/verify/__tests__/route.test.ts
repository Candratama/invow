import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  })),
}));

// Mock the MayarPaymentService
vi.mock('@/lib/db/services/mayar-payment.service', () => ({
  MayarPaymentService: class {
    async verifyAndProcessPaymentByRecordId() {
      return { error: new Error('Payment is pending. Please complete the payment first.') };
    }
  },
}));

// Import after mocks are set up
import { POST } from '@/app/api/payments/verify/route';
import { createClient } from '@/lib/supabase/server';

const mockCreateClient = vi.mocked(createClient);

describe('POST /api/payments/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock: authenticated user
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
    } as any);
  });

  it('returns status=pending when Mayar reports pending', async () => {
    const req = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paymentId: 'p1' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.status).toBe('pending');
    expect(res.status).toBe(202);
  });

  it('returns status=error with 400 for missing paymentId', async () => {
    const req = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.status).toBe('error');
    expect(json.message).toBe('Missing paymentId');
    expect(res.status).toBe(400);
  });

  it('returns status=error with 401 when user is unauthorized', async () => {
    // Mock unauthorized user
    mockCreateClient.mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: new Error('Unauthorized') }) },
    } as any);

    const req = new Request('http://localhost/api/payments/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paymentId: 'p1' }),
    });
    const res = await POST(req);
    const json = await res.json();
    expect(json.status).toBe('error');
    expect(res.status).toBe(401);
  });
});
