import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MayarPaymentService } from "@/lib/db/services/mayar-payment.service";
import { safeLog } from "@/lib/utils/safe-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel maxDuration: 60s (Pro tier). 10 rows × 3500ms = 35s — leaves ~25s headroom for Mayar latency.
export const maxDuration = 60;

const BATCH_SIZE = 10;
const POLL_GAP_MS = parseInt(process.env.CRON_POLL_GAP_MS ?? "3500", 10);

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
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  let processed = 0;
  for (const row of pending ?? []) {
    if (!row.mayar_invoice_id) continue;
    const svc = new MayarPaymentService(admin);
    const result = await svc.verifyAndProcessPayment(
      row.user_id as string,
      row.mayar_invoice_id as string,
      { source: "cron" },
    );
    if (result.data) processed += 1;
    if (POLL_GAP_MS > 0) {
      await new Promise((r) => setTimeout(r, POLL_GAP_MS));
    }
  }

  return NextResponse.json({ swept: pending?.length ?? 0, processed });
}
