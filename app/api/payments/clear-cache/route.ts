/**
 * Clear Payment Cache Endpoint
 * Clears Mayar API response cache
 */

import { NextResponse } from "next/server";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";

/**
 * POST /api/payments/clear-cache
 * Clear all payment verification cache
 */
export async function POST() {
  try {
    // Clear cache
    MayarPaymentService.clearCache();
    
    // Get stats after clearing
    const stats = MayarPaymentService.getCacheStats();
    
    return NextResponse.json({
      success: true,
      message: "Cache cleared successfully",
      stats,
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

/**
 * GET /api/payments/clear-cache
 * Get cache statistics
 */
export async function GET() {
  try {
    const stats = MayarPaymentService.getCacheStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get cache stats error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
