"use client";

import { useEffect, useRef } from "react";

export interface PaymentStatusPollerProps {
  paymentId: string;
  intervalMs?: number;
  maxMs?: number;
  onPaid: () => void;
  onTimeout?: () => void;
  onError?: (message: string) => void;
}

/**
 * Polls /api/payments/verify until the payment is confirmed paid or the
 * max duration elapses. Mounts only after the user is back from Mayar
 * with a pending status; the cron sweep will catch anything that times out.
 */
export function PaymentStatusPoller({
  paymentId,
  intervalMs = 10000,
  maxMs = 5 * 60 * 1000,
  onPaid,
  onTimeout,
  onError,
}: PaymentStatusPollerProps) {
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    const startedAt = Date.now();
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (stoppedRef.current) return;
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentId }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.status === "paid") {
          stoppedRef.current = true;
          onPaid();
          return;
        }
        if (json?.status === "error") {
          onError?.(json?.message ?? "Verification error");
        }
      } catch {
        // Network blip — let the next tick retry
      }

      if (Date.now() - startedAt >= maxMs) {
        stoppedRef.current = true;
        onTimeout?.();
        return;
      }
      timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);
    return () => {
      stoppedRef.current = true;
      clearTimeout(timer);
    };
  }, [paymentId, intervalMs, maxMs, onPaid, onTimeout, onError]);

  return null;
}
