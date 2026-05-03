/**
 * Payment Verification API Endpoint
 * Verifies payment status with Mayar API after redirect
 *
 * Returns structured status: 'paid'|'pending'|'error'
 * HTTP status codes: 200 (paid), 202 (pending), 400/401/429/500 (error states)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";

/**
 * POST /api/payments/verify
 * Verify payment after user is redirected from Mayar
 *
 * Request: { paymentId: string }
 * Response: { status: 'paid'|'pending'|'error', message?, subscription? }
 */
export async function POST(request: Request) {
  try {
    // 1. Authentication check
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

    // 2. Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const paymentId = typeof body?.paymentId === "string" ? body.paymentId.trim() : "";

    if (!paymentId) {
      return NextResponse.json(
        { status: "error", message: "Missing paymentId" },
        { status: 400 },
      );
    }

    // 3. Verify payment with Mayar API using our payment record ID
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

    // 4. Return success response
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
