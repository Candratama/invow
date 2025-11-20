/**
 * Test endpoint to verify API route is accessible
 * GET /api/payments/verify/test
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Payment verification API is accessible",
    timestamp: new Date().toISOString(),
  });
}
