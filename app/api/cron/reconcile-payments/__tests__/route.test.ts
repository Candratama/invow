import { describe, it, expect, vi, beforeEach } from 'vitest';

const verifySpy = vi.fn();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          lt: () => ({
            gt: () => ({
              or: () => ({
                order: () => ({
                  limit: async () => ({
                    data: [
                      { id: 'p1', user_id: 'u1', mayar_invoice_id: 'inv-1' },
                      { id: 'p2', user_id: 'u2', mayar_invoice_id: 'inv-2' },
                    ],
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock('@/lib/db/services/mayar-payment.service', () => ({
  MayarPaymentService: class {
    verifyAndProcessPayment = verifySpy;
  },
}));

describe('GET /api/cron/reconcile-payments', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'secret123';
    process.env.CRON_POLL_GAP_MS = '0';
    verifySpy.mockReset();
    verifySpy.mockResolvedValue({ data: { subscription: {} } });
  });

  it('rejects without CRON_SECRET bearer', async () => {
    const { GET } = await import('@/app/api/cron/reconcile-payments/route');
    const res = await GET(new Request('http://x'));
    expect(res.status).toBe(401);
  });

  it('processes pending payments when authorized', async () => {
    const { GET } = await import('@/app/api/cron/reconcile-payments/route');
    const res = await GET(
      new Request('http://x', { headers: { authorization: 'Bearer secret123' } }),
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.swept).toBe(2);
    expect(verifySpy).toHaveBeenCalledTimes(2);
  });
});
