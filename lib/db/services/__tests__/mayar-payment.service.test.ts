import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 200,
          messages: 'success',
          data: { id: 'inv-1', status: 'paid', amount: 99000 },
        }),
        { status: 200 },
      ),
    );
    const svc = new MayarPaymentService({} as never);
    const { data, error } = await svc.getInvoiceById('inv-1');
    expect(error).toBeNull();
    expect(data).toMatchObject({ id: 'inv-1', status: 'paid' });
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
});
