/**
 * Payment Lookup API Endpoint
 * Find payment record ID by Mayar invoice ID
 */

import { NextResponse } from "next/server";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/payments/lookup?mayar_invoice_id=xxx
 * Lookup payment record by Mayar invoice ID
 */
export async function GET(request: Request) {
  // Ensure this route is dynamically rendered
  await connection();
  
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

    // 2. Get mayar_invoice_id from query params
    const { searchParams } = new URL(request.url);
    const mayarInvoiceId = searchParams.get("mayar_invoice_id");

    if (!mayarInvoiceId) {
      return NextResponse.json(
        { success: false, error: "Missing mayar_invoice_id parameter" },
        { status: 400 },
      );
    }

    // 3. Lookup payment record
    const { data: payment, error: lookupError } = await supabase
      .from("payment_transactions")
      .select("id, mayar_invoice_id, user_id, status, tier, amount, created_at")
      .eq("mayar_invoice_id", mayarInvoiceId)
      .eq("user_id", user.id) // Only return user's own payments
      .maybeSingle();

    if (lookupError) {
      console.error("Payment lookup error:", lookupError);
      return NextResponse.json(
        { success: false, error: "Database error" },
        { status: 500 },
      );
    }

    if (!payment) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Payment not found. Make sure the Mayar invoice ID is correct and belongs to you." 
        },
        { status: 404 },
      );
    }

    // 4. Return payment info
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        mayar_invoice_id: payment.mayar_invoice_id,
        status: payment.status,
        tier: payment.tier,
        amount: payment.amount,
        created_at: payment.created_at,
      },
      verification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment_redirect=true&payment_id=${payment.id}`,
    });
  } catch (error) {
    console.error("Unexpected error in lookup endpoint:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
