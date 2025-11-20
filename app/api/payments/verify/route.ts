/**
 * Payment Verification API Endpoint
 * Verifies payment status with Mayar API after redirect
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";

/**
 * POST /api/payments/verify
 * Verify payment after user is redirected from Mayar
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
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Missing payment ID" },
        { status: 400 },
      );
    }

    if (typeof paymentId !== "string" || paymentId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payment ID format" },
        { status: 400 },
      );
    }

    // 3. Verify payment with Mayar API using our payment record ID
    const mayarPaymentService = new MayarPaymentService(supabase);
    const { data, error } = await mayarPaymentService.verifyAndProcessPaymentByRecordId(
      user.id,
      paymentId.trim(),
    );

    if (error) {
      console.error("Payment verification failed:", error);
      
      // Check if it's a rate limit error
      const isRateLimitError = error.message.includes("429") || 
                               error.message.includes("rate limit");
      
      const userMessage = isRateLimitError
        ? "Too many verification attempts. Please wait a moment and try again."
        : error.message;
      
      return NextResponse.json(
        { success: false, error: userMessage },
        { status: isRateLimitError ? 429 : 400 },
      );
    }

    // 4. Return success response
    return NextResponse.json({
      success: true,
      message:
        "Payment verified successfully! Your subscription has been upgraded.",
      subscription: data?.subscription,
    });
  } catch (error) {
    console.error("Unexpected error in verify endpoint:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
