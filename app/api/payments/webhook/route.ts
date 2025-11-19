/**
 * Mayar Payment Webhook Endpoint
 * Handles payment notifications from Mayar payment gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/payments/webhook
 * Receives and processes payment notifications from Mayar
 * No authentication required - uses webhook signature verification instead
 * 
 * IMPORTANT: Webhooks come from Mayar (external), so we need to use
 * service role key instead of user session
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with service role key for webhook processing
    // Webhooks don't have user session, so we need admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    const mayarPaymentService = new MayarPaymentService(supabase);

    // Get raw body
    const rawBody = await request.text();
    let webhookPayload: {
      event?: string;
      data?: {
        id?: string;
        transactionId?: string;
        status?: string;
        amount?: number;
        paymentMethod?: string;
        [key: string]: unknown;
      };
      invoiceId?: string;
      status?: string;
      [key: string]: unknown;
    };

    try {
      webhookPayload = JSON.parse(rawBody);
    } catch (error) {
      console.error("Failed to parse webhook payload:", error);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Log webhook receipt (sanitized for security)
    console.log("Mayar webhook received:", webhookPayload.event);

    // Parse Mayar webhook format
    // Mayar sends: { event: "payment.received", data: { id, transactionId, status: "SUCCESS", ... } }
    const event = webhookPayload.event;
    const data = webhookPayload.data;
    
    // Extract both IDs (Mayar sends both product ID and transaction ID)
    const transactionId = data?.transactionId;
    const productId = data?.id;
    
    // Extract status (Mayar uses "SUCCESS" in data.status)
    const mayarStatus = data?.status;
    
    // Log minimal info for debugging (no sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log("Webhook event:", event, "| Status:", mayarStatus);
    }

    if (!transactionId && !productId) {
      // Missing invoice ID in webhook payload
      return NextResponse.json(
        { error: "Missing invoice ID" },
        { status: 400 }
      );
    }
    
    // Try to find payment with either transaction ID or product ID
    const mayarInvoiceId = (transactionId || productId) as string;

    // Check if this is a payment success event
    const isPaymentSuccess = 
      event === "payment.received" || 
      mayarStatus === "SUCCESS" || 
      mayarStatus === "completed";

    if (isPaymentSuccess) {
      // Processing successful payment (IDs logged only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Processing payment: ${mayarInvoiceId?.substring(0, 8)}...`);
      }

      const alternativeId = (mayarInvoiceId === transactionId ? productId : transactionId) || undefined;
      const paymentMethod = data?.paymentMethod ? String(data.paymentMethod) : undefined;
      
      const { success, error } = await mayarPaymentService.handlePaymentSuccess(
        mayarInvoiceId,
        alternativeId,
        paymentMethod
      );

      if (!success) {
        // Failed to process payment (error logged without sensitive data)
        console.error("Failed to process payment:", error?.message);
        // Still return 200 to acknowledge webhook receipt
        // Mayar will retry if we return an error
        return NextResponse.json({
          success: false,
          message: "Payment recorded but processing failed",
          error: error?.message,
        });
      }

      // Payment processed successfully
    } else if (mayarStatus === "FAILED" || mayarStatus === "failed") {
      // Processing failed payment (no sensitive data logged)

      const { success, error } = await mayarPaymentService.handlePaymentFailed(
        mayarInvoiceId
      );

      if (!success) {
        // Failed to process failed payment (error logged without sensitive data)
        console.error("Failed to process failed payment:", error?.message);
        // Still return 200 to acknowledge webhook receipt
        return NextResponse.json({
          success: false,
          message: "Failed payment recorded but processing failed",
        });
      }

      console.log(
        `✅ Successfully processed failed payment for invoice ${mayarInvoiceId}`
      );
    } else {
      // Log other statuses but don't process them
      console.log(
        `ℹ️ Webhook received with unhandled status: ${mayarStatus} for invoice ${mayarInvoiceId}`
      );
      console.log("Event type:", event);
    }

    // Return 200 to acknowledge webhook receipt
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Unexpected error processing webhook:", error);

    // Return 200 even on error to prevent Mayar from retrying
    // Log the error for manual investigation
    return NextResponse.json({
      success: false,
      message: "Webhook received but processing failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
