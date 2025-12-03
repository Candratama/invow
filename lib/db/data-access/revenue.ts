import { cache } from "react";
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { RevenueService } from "@/lib/db/services/revenue.service";

/**
 * Server-only data access layer for revenue metrics
 * Uses React cache() for request memoization
 */

export const getRevenueMetrics = cache(async (userId: string) => {
  const supabase = await createClient();
  const service = new RevenueService(supabase);
  return await service.getRevenueMetrics(userId);
});
