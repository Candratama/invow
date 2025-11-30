import { createClient } from "@/lib/supabase/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";
import { NextResponse } from "next/server";

/**
 * @deprecated This API route is deprecated and kept only for backward compatibility.
 * Use the Server Action `createPaymentInvoiceAction()` from `app/actions/payments.ts` instead.
 * 
 * This route will be removed in a future version once all clients have migrated to Server Actions.
 * 
 * Migration guide:
 * - Import: `import { createPaymentInvoiceAction } from '@/app/actions/payments'`
 * - Call: `const result = await createPaymentInvoiceAction(tier)`
 * - Response format: `{ success: boolean, data?: { invoiceId, paymentUrl, amount, tier }, error?: string }`
 * 
 * POST /api/payments/create-invoice
 * Create a Mayar invoice for subscription upgrade
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
        { error: "Unauthorized - Please log in to continue" },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body - Expected JSON" },
        { status: 400 }
      );
    }

    const { tier } = body;

    // 3. Validate tier parameter
    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid tier parameter" },
        { status: 400 }
      );
    }

    const validTiers = ["premium"];
    if (!validTiers.includes(tier.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid tier: ${tier}. Must be one of: ${validTiers.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Call MayarPaymentService to create invoice
    const mayarPaymentService = new MayarPaymentService(supabase);
    const { data, error } = await mayarPaymentService.createInvoice(
      user.id,
      tier.toLowerCase()
    );

    if (error) {
      console.error("Failed to create Mayar invoice:", error);

      // Check if it's a configuration error
      if (error.message.includes("not configured")) {
        return NextResponse.json(
          {
            error: "Payment service is not configured. Please contact support.",
          },
          { status: 503 }
        );
      }

      // Check if it's a Mayar API error
      if (error.message.includes("Mayar API error")) {
        return NextResponse.json(
          {
            error: "Payment service is temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          error: "Failed to create payment invoice. Please try again.",
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Failed to create payment invoice" },
        { status: 500 }
      );
    }

    // 5. Return success response with payment details
    return NextResponse.json(
      {
        success: true,
        mayarInvoiceId: data.invoiceId,
        paymentUrl: data.paymentUrl,
        amount: data.amount,
        tier: tier.toLowerCase(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error in create-invoice endpoint:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
