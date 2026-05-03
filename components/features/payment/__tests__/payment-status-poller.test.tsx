import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { PaymentStatusPoller } from '@/components/features/payment/payment-status-poller';

describe('PaymentStatusPoller', () => {
  it('calls onPaid when verify returns paid', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'paid' }), { status: 200 }),
    );
    const onPaid = vi.fn();
    render(<PaymentStatusPoller paymentId="p1" intervalMs={10} maxMs={100} onPaid={onPaid} />);
    await waitFor(() => expect(onPaid).toHaveBeenCalled());
  });

  it('stops polling after maxMs', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'pending' }), { status: 202 }),
    );
    const onTimeout = vi.fn();
    render(
      <PaymentStatusPoller
        paymentId="p1"
        intervalMs={10}
        maxMs={50}
        onPaid={() => {}}
        onTimeout={onTimeout}
      />,
    );
    await waitFor(() => expect(onTimeout).toHaveBeenCalled());
  });
});
