import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { MayarPaymentService } from '@/lib/db/services/mayar-payment.service';

describe('MayarPaymentService.getInvoiceById', () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.MAYAR_API_KEY;

  beforeEach(() => {
    process.env.MAYAR_API_KEY = 'test-key';
    process.env.MAYAR_API_URL = 'https://api.mayar.id/hl/v1';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.MAYAR_API_KEY = originalKey;
  });

  it('returns invoice payload on 200', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 200,
          messages: 'success',
          data: { id: 'inv-1', status: 'paid', amount: 99000 },
        }),
        { status: 200 },
      ),
    );
    global.fetch = fetchSpy;
    const svc = new MayarPaymentService({} as never);
    const { data, error } = await svc.getInvoiceById('inv-1');
    expect(error).toBeNull();
    expect(data).toMatchObject({ id: 'inv-1', status: 'paid' });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/invoice/inv-1'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('returns error on 429', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('rate limit', { status: 429 }),
    );
    const svc = new MayarPaymentService({} as never);
    const { data, error } = await svc.getInvoiceById('inv-2');
    expect(data).toBeNull();
    expect(error?.message).toContain('429');
  });

  it('returns error when Mayar returns 404', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response('not found', { status: 404 }),
    );
    const svc = new MayarPaymentService({} as never);
    const { error } = await svc.getInvoiceById('inv-missing');
    expect(error?.message).toContain('404');
  });

  it('returns error when MAYAR_API_KEY is not configured', async () => {
    delete process.env.MAYAR_API_KEY;
    global.fetch = vi.fn();
    const svc = new MayarPaymentService({} as never);
    const { data, error } = await svc.getInvoiceById('inv-x');
    expect(data).toBeNull();
    expect(error?.message).toContain('MAYAR_API_KEY');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

function makeSupabaseStub(rows: Record<string, unknown[]>) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: rows[table]?.[0] ?? null, error: null }),
            single: async () => ({ data: rows[table]?.[0] ?? null, error: null }),
          }),
          single: async () => ({ data: rows[table]?.[0] ?? null, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          eq: () => ({
            select: () => ({
              maybeSingle: async () => ({ data: rows[table]?.[0] ?? null, error: null }),
            }),
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('MayarPaymentService.verifyAndProcessPayment (refactored)', () => {
  beforeEach(() => {
    process.env.MAYAR_API_KEY = 'test-key';
    process.env.MAYAR_API_URL = 'https://api.mayar.id/hl/v1';
  });

  it('does nothing when payment already completed', async () => {
    const supabase = makeSupabaseStub({
      payment_transactions: [
        { id: 'p1', user_id: 'u1', mayar_invoice_id: 'inv-1', tier: 'premium', status: 'completed' },
      ],
      user_subscriptions: [
        { tier: 'premium', subscription_end_date: '2027-01-01' },
      ],
    });
    const svc = new MayarPaymentService(supabase);
    const result = await svc.verifyAndProcessPayment('u1', 'inv-1');
    expect(result.error).toBeUndefined();
    expect(result.data?.subscription.tier).toBe('premium');
  });

  it('returns pending when Mayar status is not paid', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: 'inv-1', status: 'pending' } }),
        { status: 200 },
      ),
    );
    const supabase = makeSupabaseStub({
      payment_transactions: [
        { id: 'p1', user_id: 'u1', mayar_invoice_id: 'inv-1', tier: 'premium', status: 'pending', poll_count: 0 },
      ],
    });
    const svc = new MayarPaymentService(supabase);
    const result = await svc.verifyAndProcessPayment('u1', 'inv-1');
    expect(result.error?.message).toContain('pending');
  });

  it('does not double-upgrade when CAS race is lost', async () => {
    // Mayar reports paid
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: 'inv-1', status: 'paid', transactionId: 'txn-1' } }),
        { status: 200 },
      ),
    );

    const upgradeSpy = vi.fn();
    // Mock the SubscriptionService dynamic import path so we can detect calls
    vi.doMock('@/lib/db/services/subscription.service', () => ({
      SubscriptionService: class {
        async upgradeToTier(...args: unknown[]) {
          upgradeSpy(...args);
          return { success: true };
        }
      },
    }));

    // Build a stub where the conditional update returns null (race lost)
    const supabase = {
      from: (table: string) => {
        if (table === 'payment_transactions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: 'p1',
                      user_id: 'u1',
                      mayar_invoice_id: 'inv-1',
                      tier: 'premium',
                      status: 'pending',
                      poll_count: 0,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: (..._: unknown[]) => ({
                eq: () => ({
                  select: () => ({
                    maybeSingle: async () => ({ data: null, error: null }), // race lost
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'user_subscriptions') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: { tier: 'premium', subscription_end_date: '2027-01-01' },
                  error: null,
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
      },
    } as unknown as SupabaseClient;

    const svc = new MayarPaymentService(supabase);
    const result = await svc.verifyAndProcessPayment('u1', 'inv-1');
    expect(result.error).toBeUndefined();
    expect(result.data?.subscription.tier).toBe('premium');
    expect(upgradeSpy).not.toHaveBeenCalled();
  });
});

describe('MayarPaymentService.createInvoice idempotency', () => {
  beforeEach(() => {
    process.env.MAYAR_API_KEY = 'test-key';
    process.env.MAYAR_API_URL = 'https://api.mayar.id/hl/v1';
  });

  it('returns existing pending invoice instead of creating a new one', async () => {
    const callMayar = vi.fn();
    global.fetch = callMayar;
    const supabase = {
      from: (table: string) => {
        if (table === 'subscription_plans') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({ data: { price: 99000 }, error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'payment_transactions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  eq: () => ({
                    gte: () => ({
                      maybeSingle: async () => ({
                        data: {
                          id: 'pending-1',
                          mayar_invoice_id: 'inv-existing',
                          payment_url: 'https://pay.mayar/existing',
                          amount: 99000,
                        },
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) };
      },
      auth: { getUser: async () => ({ data: { user: { id: 'u1', email: 'test@example.com' } } }) },
    } as unknown as SupabaseClient;

    const svc = new MayarPaymentService(supabase);
    const result = await svc.createInvoice('u1', 'premium');
    expect(result.error).toBeNull();
    expect(result.data?.invoiceId).toBe('inv-existing');
    expect(callMayar).not.toHaveBeenCalled();
  });
});
