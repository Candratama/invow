# Mayar Payment: Redirect-First + Cron Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "fetch all transactions and filter" payment verification with a direct `GET /invoice/{id}` flow, keep the redirect-based UX as the primary verification path, and add a cron-based reconciliation fallback for users whose redirect never returns.

**Architecture:**
- Primary: redirect → `/api/payments/verify` → `GET /invoice/{mayar_invoice_id}` → DB update (race-safe, idempotent).
- Fallback: Vercel Cron hits `/api/cron/reconcile-payments` every 5 minutes, sweeps `pending` payments aged 2 minutes – 24 hours, verifies via the same Mayar endpoint, throttles to stay under the 20 RPM rate limit.
- Frontend polls `/api/payments/verify` every 10s for up to 5 minutes when redirect lands while Mayar still shows `pending`.

**Tech Stack:** Next.js 16 App Router, Supabase Postgres, Mayar API, Vercel Cron, Vitest.

---

## Domain Migration Context

This plan ships during the migration from `invow.kodesafari.tech` → `invow.web.id` (old domain expires 2026-05-20). Several touch points must use the new domain:

- `NEXT_PUBLIC_APP_URL` → `https://invow.web.id` (Vercel env, Production scope). All Mayar `redirectUrl` values are derived from this env at `lib/db/services/mayar-payment.service.ts:114`. Without this update, paying users return to the dead domain after the cutover.
- Vercel Cron triggers `https://invow.web.id/api/cron/reconcile-payments`. The `vercel.json` schedule is path-relative, so Vercel always invokes it on the project's primary domain — make sure `invow.web.id` is set as the **Production Domain** in Vercel before enabling the cron, otherwise it hits the staging/preview alias.
- Supabase Auth Site URL + Redirect Allowlist already updated to `invow.web.id` (verified separately, outside this plan).
- Mayar Webhook URL field is intentionally left empty — verification is API-pull, not push.

Cutover checkpoint (do this **before** Task 8 deploy):
1. Vercel → Settings → Domains → confirm `invow.web.id` marked as Production.
2. Vercel → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL=https://invow.web.id` (Production).
3. Cloudflare Page Rule `invow.kodesafari.tech/*` → 301 → `https://invow.web.id/$1` so any in-flight Mayar invoices created with the old `redirectUrl` still complete after deploy.

---

## File Structure

**Create:**
- `supabase/migrations/20260503000000_add_payment_reconciliation_columns.sql` — schema columns for cron tracking.
- `app/api/cron/reconcile-payments/route.ts` — Vercel cron handler.
- `vercel.json` — cron schedule registration.
- `lib/db/services/__tests__/mayar-payment.service.test.ts` — service-level tests (new file; existing tests live elsewhere).
- `app/api/cron/reconcile-payments/__tests__/route.test.ts` — cron route tests.
- `components/payment/payment-status-poller.tsx` — frontend fallback poller.

**Modify:**
- `lib/db/services/mayar-payment.service.ts` — add `getInvoiceById`, refactor `verifyAndProcessPayment` to use it, add idempotent invoice creation, drop static cache use from the redirect path.
- `app/api/payments/verify/route.ts` — return structured `status` so frontend can decide whether to keep polling.
- `.env.example` — add `CRON_SECRET`.

**Reference (read-only context for implementer):**
- `app/api/payments/create-invoice/route.ts` — existing create entry point.
- `lib/db/services/subscription.service.ts:upgradeToTier` — already called after verify; do not touch logic.
- `supabase/migrations/20250220000000_update_payment_transactions_for_redirect_flow.sql` — current schema reference.

---

## Conventions

- Add new SQL migrations using the timestamp prefix `20260503xxxxxx`.
- All new tests use Vitest (`npm run test`).
- Commit after each task with conventional commit prefix (`feat:`, `fix:`, `test:`, `chore:`).
- Use `safeLog.payment` for payment-side logs (existing pattern in `lib/utils/safe-logger`).
- Bahasa Inggris untuk identifier dan log; Bahasa Indonesia untuk user-facing messages tetap dipertahankan kalau ada.

---

## Task 1: Add reconciliation columns to `payment_transactions`

**Files:**
- Create: `supabase/migrations/20260503000000_add_payment_reconciliation_columns.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260503000000_add_payment_reconciliation_columns.sql
-- Add columns for cron-based payment reconciliation

ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS poll_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_via TEXT
    CHECK (verified_via IN ('redirect', 'cron', 'manual') OR verified_via IS NULL);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_pending_for_cron
  ON payment_transactions (created_at)
  WHERE status = 'pending';

COMMENT ON COLUMN payment_transactions.last_polled_at IS
  'Last time cron or verify attempted to reconcile this payment with Mayar.';
COMMENT ON COLUMN payment_transactions.poll_count IS
  'Total number of Mayar reconciliation attempts (redirect + cron).';
COMMENT ON COLUMN payment_transactions.verified_via IS
  'Channel that flipped status from pending to completed: redirect | cron | manual.';
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase db push` (or paste into Supabase SQL editor for prod after PR review).
Expected: Migration applied. No errors.

- [ ] **Step 3: Verify schema**

Run:
```bash
npx supabase db diff --schema public
```
Expected: Diff is empty after applying.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260503000000_add_payment_reconciliation_columns.sql
git commit -m "feat(payment): add reconciliation columns to payment_transactions"
```

---

## Task 2: Add `getInvoiceById` helper to MayarPaymentService

**Files:**
- Modify: `lib/db/services/mayar-payment.service.ts`
- Test: `lib/db/services/__tests__/mayar-payment.service.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/db/services/__tests__/mayar-payment.service.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- mayar-payment.service.test`
Expected: FAIL — `MayarPaymentService.getInvoiceById is not a function`.

- [ ] **Step 3: Implement `getInvoiceById`**

Add to `lib/db/services/mayar-payment.service.ts` (after the `createInvoice` method, before `verifyAndProcessPayment`):

```typescript
  /**
   * Fetch single invoice from Mayar by invoice ID.
   * Returns the raw Mayar invoice payload (status, amount, customer, etc).
   * Avoids the deprecated "fetch all transactions and filter" path.
   */
  async getInvoiceById(
    invoiceId: string,
  ): Promise<{ data: Record<string, unknown> | null; error: Error | null }> {
    try {
      if (!MAYAR_API_KEY) {
        throw new Error("MAYAR_API_KEY is not configured");
      }
      const url = `${MAYAR_API_URL}/invoice/${invoiceId}`;
      const resp = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${MAYAR_API_KEY}`,
          "Content-Type": "application/json",
        },
      });
      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        return {
          data: null,
          error: new Error(`Mayar invoice fetch failed (${resp.status}): ${body}`),
        };
      }
      const json = (await resp.json()) as { data?: Record<string, unknown> };
      return { data: json.data ?? null, error: null };
    } catch (e) {
      return {
        data: null,
        error: e instanceof Error ? e : new Error("Unknown Mayar fetch error"),
      };
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- mayar-payment.service.test`
Expected: PASS — all three cases.

- [ ] **Step 5: Commit**

```bash
git add lib/db/services/mayar-payment.service.ts lib/db/services/__tests__/mayar-payment.service.test.ts
git commit -m "feat(payment): add getInvoiceById helper using single-invoice endpoint"
```

---

## Task 3: Refactor `verifyAndProcessPayment` to use `getInvoiceById`

**Files:**
- Modify: `lib/db/services/mayar-payment.service.ts:285-454`

- [ ] **Step 1: Write the failing test**

Append to `lib/db/services/__tests__/mayar-payment.service.test.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- mayar-payment.service.test`
Expected: FAIL — current implementation calls `getMayarTransactionByInvoiceId`, not `getInvoiceById`.

- [ ] **Step 3: Replace the verification body**

Replace `verifyAndProcessPayment` in `lib/db/services/mayar-payment.service.ts` (lines 292–454) with:

```typescript
  async verifyAndProcessPayment(
    userId: string,
    invoiceId: string,
    options?: { source?: "redirect" | "cron" },
  ): Promise<{
    data?: { subscription: { tier: string; expiresAt: string } };
    error?: Error;
  }> {
    const source = options?.source ?? "redirect";
    try {
      safeLog.payment("Verification started", { invoiceId, source });

      const { data: payment, error: findError } = await this.supabase
        .from("payment_transactions")
        .select("*")
        .eq("mayar_invoice_id", invoiceId)
        .eq("user_id", userId)
        .maybeSingle();

      if (findError) {
        return { error: new Error("Failed to query payment record") };
      }
      if (!payment) {
        return { error: new Error("Payment record not found") };
      }

      // Idempotent: already completed → return current subscription
      if (payment.status === "completed") {
        const { data: subscription } = await this.supabase
          .from("user_subscriptions")
          .select("tier, subscription_end_date")
          .eq("user_id", userId)
          .single();
        if (!subscription) {
          return { error: new Error("Subscription not found") };
        }
        return {
          data: {
            subscription: {
              tier: subscription.tier,
              expiresAt: subscription.subscription_end_date || "",
            },
          },
        };
      }

      // Direct invoice fetch
      const { data: invoice, error: fetchErr } =
        await this.getInvoiceById(invoiceId);
      const nowIso = new Date().toISOString();

      // Always bump poll counters so cron throttling can decide later
      await this.supabase
        .from("payment_transactions")
        .update({
          last_polled_at: nowIso,
          poll_count: (payment.poll_count ?? 0) + 1,
        })
        .eq("id", payment.id);

      if (fetchErr || !invoice) {
        return { error: fetchErr ?? new Error("Empty invoice payload") };
      }

      const status = String(invoice.status ?? "").toLowerCase();
      const paidStates = new Set(["paid", "completed", "settled"]);
      if (!paidStates.has(status)) {
        return {
          error: new Error(
            `Payment is ${status || "pending"}. Please complete the payment first.`,
          ),
        };
      }

      // Race-safe completion: only update if still pending
      const { data: completed } = await this.supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          mayar_transaction_id: invoice.transactionId as string,
          payment_method: invoice.paymentMethod as string,
          completed_at: nowIso,
          verified_at: nowIso,
          verified_via: source,
        })
        .eq("id", payment.id)
        .eq("status", "pending")
        .select()
        .maybeSingle();

      // If another worker already flipped it, treat as success
      const finalRow = completed ?? payment;
      if (!completed) {
        safeLog.info("Payment already completed by another worker");
      }

      const { SubscriptionService } = await import("./subscription.service");
      const subscriptionService = new SubscriptionService(this.supabase);
      const { success, error: upgradeError } =
        await subscriptionService.upgradeToTier(userId, finalRow.tier);
      if (upgradeError || !success) {
        return {
          error: new Error(
            "Payment verified but subscription upgrade failed. Please contact support.",
          ),
        };
      }

      const { data: updatedSubscription } = await this.supabase
        .from("user_subscriptions")
        .select("tier, subscription_end_date")
        .eq("user_id", userId)
        .single();
      if (!updatedSubscription) {
        return { error: new Error("Failed to retrieve updated subscription") };
      }
      return {
        data: {
          subscription: {
            tier: updatedSubscription.tier,
            expiresAt: updatedSubscription.subscription_end_date || "",
          },
        },
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error("Unexpected error"),
      };
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- mayar-payment.service.test`
Expected: PASS for all describes (`getInvoiceById` + `verifyAndProcessPayment`).

- [ ] **Step 5: Type-check**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add lib/db/services/mayar-payment.service.ts lib/db/services/__tests__/mayar-payment.service.test.ts
git commit -m "refactor(payment): verify via GET /invoice/{id} with idempotent race-safe update"
```

---

## Task 4: Add idempotency check to `createInvoice`

Prevent double-click or rapid retries from creating duplicate Mayar invoices for the same user/tier within a 5-minute window.

**Files:**
- Modify: `lib/db/services/mayar-payment.service.ts:74-224`

- [ ] **Step 1: Write the failing test**

Append to `lib/db/services/__tests__/mayar-payment.service.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- mayar-payment.service.test`
Expected: FAIL — current `createInvoice` always calls Mayar.

- [ ] **Step 3: Add idempotency check before plan lookup**

In `lib/db/services/mayar-payment.service.ts`, modify `createInvoice` (around line 80, immediately after the `if (!MAYAR_API_KEY)` guard and before the plan lookup):

```typescript
      // Idempotency: reuse a pending payment for the same user+tier created within 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existing } = await this.supabase
        .from("payment_transactions")
        .select("id, mayar_invoice_id, payment_url, amount")
        .eq("user_id", userId)
        .eq("tier", tier)
        .eq("status", "pending")
        .gte("created_at", fiveMinAgo)
        .maybeSingle();

      if (existing && existing.mayar_invoice_id && existing.payment_url) {
        safeLog.payment("Reusing pending invoice", { paymentId: existing.id });
        return {
          data: {
            invoiceId: existing.mayar_invoice_id as string,
            paymentUrl: existing.payment_url as string,
            amount: existing.amount as number,
          },
          error: null,
        };
      }
```

Then, after the existing `paymentUrl` is obtained (around line 195, just before `update().eq("id", paymentRecord.id)`), persist the URL on the row:

```typescript
      const { error: updateError } = await this.supabase
        .from("payment_transactions")
        .update({
          mayar_invoice_id: transactionId,
          payment_url: paymentUrl, // NEW
        })
        .eq("id", paymentRecord.id);
```

Add `payment_url` to the column list of `payment_transactions` in the migration from Task 1 if it doesn't already exist. Update the migration file:

```sql
ALTER TABLE payment_transactions
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS poll_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_via TEXT
    CHECK (verified_via IN ('redirect', 'cron', 'manual') OR verified_via IS NULL),
  ADD COLUMN IF NOT EXISTS payment_url TEXT;
```

Re-apply the migration: `npx supabase db push`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- mayar-payment.service.test`
Expected: PASS — all idempotency tests.

- [ ] **Step 5: Commit**

```bash
git add lib/db/services/mayar-payment.service.ts lib/db/services/__tests__/mayar-payment.service.test.ts supabase/migrations/20260503000000_add_payment_reconciliation_columns.sql
git commit -m "feat(payment): reuse pending invoice within 5min window to prevent duplicates"
```

---

## Task 5: Update `/api/payments/verify` to return structured status

**Files:**
- Modify: `app/api/payments/verify/route.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/payments/verify/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/payments/verify/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }) },
  }),
}));

vi.mock('@/lib/db/services/mayar-payment.service', () => ({
  MayarPaymentService: class {
    async verifyAndProcessPaymentByRecordId() {
      return { error: new Error('Payment is pending. Please complete the payment first.') };
    }
  },
}));

describe('POST /api/payments/verify', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- app/api/payments/verify`
Expected: FAIL — current handler returns `{ success: false, error: ... }` with 400.

- [ ] **Step 3: Update the handler**

Rewrite `app/api/payments/verify/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";
    if (!paymentId) {
      return NextResponse.json(
        { status: "error", message: "Missing paymentId" },
        { status: 400 },
      );
    }

    const svc = new MayarPaymentService(supabase);
    const { data, error } = await svc.verifyAndProcessPaymentByRecordId(
      user.id,
      paymentId,
    );

    if (error) {
      const msg = error.message || "Verification failed";
      const isPending = /pending|not yet|wait a moment/i.test(msg);
      const isRateLimited = /429|rate limit/i.test(msg);
      const httpStatus = isRateLimited ? 429 : isPending ? 202 : 400;
      return NextResponse.json(
        {
          status: isPending ? "pending" : "error",
          message: msg,
        },
        { status: httpStatus },
      );
    }

    return NextResponse.json({
      status: "paid",
      subscription: data?.subscription,
    });
  } catch (e) {
    return NextResponse.json(
      { status: "error", message: "Unexpected error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- app/api/payments/verify`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/payments/verify/route.ts app/api/payments/verify/__tests__/route.test.ts
git commit -m "feat(payment): return structured {status} from verify endpoint"
```

---

## Task 6: Add `CRON_SECRET` env var

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**

Append to `.env.example`:

```
# Cron Job Configuration
# Used to authenticate Vercel Cron and prevent unauthorized cron triggering.
# Generate a strong random value (e.g. `openssl rand -hex 32`) and set the
# same value in Vercel project env vars.
CRON_SECRET=replace-me-with-random-32-byte-hex
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore(env): document CRON_SECRET for Vercel Cron auth"
```

---

## Task 7: Implement `/api/cron/reconcile-payments` route

**Files:**
- Create: `app/api/cron/reconcile-payments/route.ts`
- Test: `app/api/cron/reconcile-payments/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/api/cron/reconcile-payments/__tests__/route.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- reconcile-payments`
Expected: FAIL — module not found.

- [ ] **Step 3: Confirm `createAdminClient` exists**

Run: `grep -rn "createAdminClient" /Users/candratama/Project/WebDev/invow/lib/supabase`
If it does not exist, create the helper at `lib/supabase/admin.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import "server-only";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

If a similar helper already lives elsewhere (e.g. `lib/db/services/admin.service.ts:createAdminClient`), import from there instead and skip creating a new file.

- [ ] **Step 4: Implement the cron route**

Create `app/api/cron/reconcile-payments/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";
import { safeLog } from "@/lib/utils/safe-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 15;
const POLL_GAP_MS = 3500; // ~17 req/min, under Mayar 20 RPM

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const minAgeIso = new Date(now - 2 * 60 * 1000).toISOString();
  const maxAgeIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const lastPolledCutoff = new Date(now - 5 * 60 * 1000).toISOString();

  const { data: pending, error } = await admin
    .from("payment_transactions")
    .select("id, user_id, mayar_invoice_id")
    .eq("status", "pending")
    .lt("created_at", minAgeIso)
    .gt("created_at", maxAgeIso)
    .or(`last_polled_at.is.null,last_polled_at.lt.${lastPolledCutoff}`)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    safeLog.error("Cron sweep query failed", { message: error.message });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let paid = 0;
  for (const row of pending ?? []) {
    if (!row.mayar_invoice_id) continue;
    const svc = new MayarPaymentService(admin);
    const result = await svc.verifyAndProcessPayment(
      row.user_id as string,
      row.mayar_invoice_id as string,
      { source: "cron" },
    );
    if (result.data) paid += 1;
    await new Promise((r) => setTimeout(r, POLL_GAP_MS));
  }

  return NextResponse.json({ swept: pending?.length ?? 0, paid });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- reconcile-payments`
Expected: PASS.

- [ ] **Step 6: Type-check**

Run: `npm run type-check`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/cron/reconcile-payments/route.ts app/api/cron/reconcile-payments/__tests__/route.test.ts lib/supabase/admin.ts
git commit -m "feat(cron): reconcile pending Mayar payments via scheduled sweep"
```

---

## Task 8: Register Vercel cron schedule + confirm domain cutover

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create `vercel.json`**

```json
{
  "crons": [
    {
      "path": "/api/cron/reconcile-payments",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- [ ] **Step 2: Confirm `invow.web.id` is the Production domain**

Vercel Cron always hits the project's Production domain. Before deploying:
- Vercel → Project → Settings → Domains → ensure `invow.web.id` is marked **Production**.
- If the project still routes to `invow.kodesafari.tech` as Production, switch first or the cron will fire against a domain that may be unreachable after 2026-05-20.

- [ ] **Step 3: Set production env vars**

In Vercel dashboard (Production scope):
- `NEXT_PUBLIC_APP_URL=https://invow.web.id` — used by `createInvoice` to build the Mayar `redirectUrl`. Required so users return to the new domain after paying.
- `CRON_SECRET=<openssl rand -hex 32 output>` — required for Vercel Cron auth.

After saving, **redeploy** so the new env values are baked into the Next.js bundle (`NEXT_PUBLIC_*` are inlined at build time).

- [ ] **Step 4: Verify Vercel auto-injects auth header**

Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically once the env var is set. No additional config needed.

- [ ] **Step 5: Add Cloudflare 301 for in-flight payments**

Cloudflare → Rules → Redirect Rules → create rule:
- Match: `(http.host eq "invow.kodesafari.tech")`
- Action: Dynamic redirect → `concat("https://invow.web.id", http.request.uri.path, "?", http.request.uri.query)` → 301 Permanent.

This keeps users whose Mayar invoice was created before the env switch from hitting a dead `redirectUrl=https://invow.kodesafari.tech/...`. Document this in the PR description.

- [ ] **Step 6: Commit**

```bash
git add vercel.json
git commit -m "chore(cron): schedule payment reconciliation every 5 minutes"
```

---

## Task 9: Frontend polling fallback component

**Files:**
- Create: `components/payment/payment-status-poller.tsx`
- Modify: page that consumes payment redirect (likely `app/dashboard/page.tsx` or wherever `payment_redirect=true` is handled — locate and wire up)

- [ ] **Step 1: Locate the redirect consumer**

Run:
```bash
grep -rn "payment_redirect" app/ components/
```
Note the file that reads `payment_redirect` from the URL — this is where the poller mounts.

- [ ] **Step 2: Write the failing test**

Create `components/payment/__tests__/payment-status-poller.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { PaymentStatusPoller } from '@/components/payment/payment-status-poller';

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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- payment-status-poller`
Expected: FAIL — component does not exist.

- [ ] **Step 4: Implement the component**

Create `components/payment/payment-status-poller.tsx`:

```tsx
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

    let timer: ReturnType<typeof setTimeout> = setTimeout(tick, intervalMs);
    return () => {
      stoppedRef.current = true;
      clearTimeout(timer);
    };
  }, [paymentId, intervalMs, maxMs, onPaid, onTimeout, onError]);

  return null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- payment-status-poller`
Expected: PASS for both cases.

- [ ] **Step 6: Wire up in redirect consumer**

In the file located in Step 1 (e.g. `app/dashboard/page.tsx`), mount the poller when `payment_redirect=true` and the verify call returns status `pending`:

```tsx
{verifyResult?.status === "pending" && paymentId && (
  <PaymentStatusPoller
    paymentId={paymentId}
    onPaid={() => router.refresh()}
    onTimeout={() =>
      toast.message(
        "Pembayaran sedang diproses. Status akan diperbarui dalam beberapa menit.",
      )
    }
  />
)}
```

Adjust to match the actual prop shape and toast library used (codebase already uses `sonner`).

- [ ] **Step 7: Commit**

```bash
git add components/payment/payment-status-poller.tsx components/payment/__tests__/payment-status-poller.test.tsx <consumer-file>
git commit -m "feat(payment): client-side fallback poller for pending redirects"
```

---

## Task 10: Manual sandbox + production smoke test

- [ ] **Step 1: Sandbox test**

If you have a Mayar sandbox key, set `MAYAR_API_URL=https://api.mayar.club/hl/v1` locally, restart `npm run dev`, run a test purchase end-to-end, confirm verify hits the new path.

- [ ] **Step 2: Cron smoke test (local)**

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/reconcile-payments
```
Expected: `{ "swept": 0, "paid": 0 }` when no pendings exist.

- [ ] **Step 3: Production deploy + verify**

Push to main, deploy, then in production verify:
- Vercel → Crons → schedule visible, status "Healthy".
- Vercel → Logs → first cron run produces a `{ swept, paid }` JSON response.
- Trigger a real test purchase via `https://invow.web.id`. Confirm:
  - Mayar checkout shows `redirectUrl` resolving to `invow.web.id` (not `kodesafari.tech`).
  - After paying, browser lands on `https://invow.web.id/dashboard?payment_redirect=true&payment_id=...`.
  - Subscription tier upgrades within ≤2s (redirect path) or ≤5min (cron fallback).
- Trigger a paid invoice but close the browser before redirect — confirm cron sweep flips it to `completed` within 5 min.

- [ ] **Step 4: Final commit / PR**

Open PR with summary, link this plan, attach screenshots of the Vercel cron tab and a successful sweep log.

---

## Self-Review Notes

- Spec coverage: redirect-first verify ✅ (Tasks 3, 5), cron fallback ✅ (Tasks 6–8), idempotency ✅ (Task 4), schema ✅ (Task 1), frontend timeout safety ✅ (Task 9).
- No placeholders; every code-bearing step ships actual code.
- Type consistency: `verifyAndProcessPayment` signature gains optional `options.source` only — callers without it still work.
- Out of scope (not in this plan): deleting the now-unused `getMayarTransactionByInvoiceId` static cache. Defer to a cleanup PR after this plan ships and the cron path is observed stable for ≥1 week.
