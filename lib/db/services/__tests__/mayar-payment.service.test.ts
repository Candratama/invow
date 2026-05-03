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
