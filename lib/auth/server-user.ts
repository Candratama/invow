import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached current-user helper. Combines two optimizations:
 *
 * 1. **Header-based fast path**: proxy middleware sets `x-user-id` after the
 *    initial `supabase.auth.getUser()` validation, so subsequent server
 *    actions / data-access functions can read it without another auth API
 *    round-trip.
 *
 * 2. **React.cache() request memoization**: any code path that still falls
 *    back to a real auth lookup will only do it once per request.
 *
 * Returns `null` if the user is not authenticated.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  try {
    const h = await headers();
    const fromHeader = h.get("x-user-id");
    if (fromHeader) return fromHeader;
  } catch {
    // headers() may not be available in some contexts (e.g., direct calls
    // outside a request scope). Fall through to supabase lookup.
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
});

/**
 * Same as getCurrentUserId but returns the full user object when needed.
 * Prefer getCurrentUserId() when only the id is required (faster path).
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
});
