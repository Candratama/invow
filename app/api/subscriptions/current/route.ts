/**
 * GET /api/subscriptions/current
 * Returns the current user's subscription status
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionService } from "@/lib/db/services/subscription.service";

export async function GET() {
  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Create subscription service with server-side client
    const service = new SubscriptionService(supabase);

    // Get subscription status with all details
    const { data: status, error: statusError } =
      await service.getSubscriptionStatus(user.id);

    if (statusError || !status) {
      return NextResponse.json(
        {
          error: "Failed to retrieve subscription status",
          details: statusError?.message,
        },
        { status: 500 }
      );
    }

    // Return subscription status
    return NextResponse.json({
      tier: status.tier,
      invoiceLimit: status.invoiceLimit,
      currentMonthCount: status.currentMonthCount,
      remainingInvoices: status.remainingInvoices,
      resetDate: status.resetDate.toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/subscriptions/current:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
