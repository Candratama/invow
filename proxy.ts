import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Lightweight proxy - only refreshes session cookies
 * 
 * Purpose:
 * - Refresh Supabase session cookies to keep auth state valid
 * - No auth checks here to minimize Supabase calls
 * 
 * Auth is handled by:
 * 1. Server actions - validate auth before returning data
 * 2. Client components - redirect unauthenticated users for UX
 * 
 * This approach:
 * - Reduces Supabase API calls (no getUser() check on every request)
 * - Enables instant page navigation (static pages)
 * - Maintains security (server actions validate auth)
 * 
 * Trade-off:
 * - User can see page shell before client redirect
 * - But no data is exposed (server actions check auth)
 */
export async function proxy(request: NextRequest) {
  // Only refresh session cookies - no auth checks
  const response = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
