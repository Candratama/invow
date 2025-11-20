/**
 * Debug Mayar API Endpoint
 * Check what Mayar API returns for transactions
 * 
 * ⚠️ SECURITY: This endpoint is ONLY available in development mode
 */

import { NextResponse } from "next/server";

const MAYAR_API_URL = process.env.MAYAR_API_URL || "https://api.mayar.id";
const MAYAR_API_KEY = process.env.MAYAR_API_KEY;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * GET /api/payments/debug-mayar?invoice_id=xxx
 * Debug Mayar API response
 * 
 * ⚠️ DISABLED IN PRODUCTION
 */
export async function GET(request: Request) {
  // Disable in production for security
  if (IS_PRODUCTION) {
    return NextResponse.json(
      { success: false, error: "This endpoint is not available in production" },
      { status: 404 },
    );
  }

  try {
    if (!MAYAR_API_KEY) {
      return NextResponse.json(
        { success: false, error: "MAYAR_API_KEY not configured" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoice_id");

    // Call Mayar API
    const response = await fetch(`${MAYAR_API_URL}/transactions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MAYAR_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `Mayar API error: ${response.status}`,
        details: errorData,
      });
    }

    const data = await response.json();
    
    // Log raw response for debugging
    console.log("[Debug Mayar] Raw response structure:", JSON.stringify(data).substring(0, 200));
    
    // Mayar API returns { data: [...] } structure
    const transactions = (data.data || []) as Array<Record<string, unknown>>;
    
    console.log(`[Debug Mayar] Extracted ${transactions.length} transactions`);

    // If invoice_id provided, filter for it
    let matchingTransactions = transactions;
    if (invoiceId) {
      matchingTransactions = transactions.filter((t: Record<string, unknown>) => 
        t.paymentLinkId === invoiceId || 
        t.paymentLinkTransactionId === invoiceId
      );
      console.log(`[Debug Mayar] Found ${matchingTransactions.length} matching transactions for invoice ${invoiceId}`);
    }

    return NextResponse.json({
      success: true,
      raw_response_keys: Object.keys(data),
      total_transactions: transactions.length,
      matching_transactions: matchingTransactions.length,
      invoice_id_searched: invoiceId || "none",
      transactions: matchingTransactions.slice(0, 10), // First 10 only
      all_transaction_ids: transactions.map((t: Record<string, unknown>) => ({
        paymentLinkId: t.paymentLinkId,
        paymentLinkTransactionId: t.paymentLinkTransactionId,
        status: t.status,
      })).slice(0, 20), // First 20 IDs
    });
  } catch (error) {
    console.error("Debug Mayar error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
