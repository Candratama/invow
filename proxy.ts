import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/db/services/admin.service";

/**
 * Proxy with auth protection
 *
 * Purpose:
 * - Refresh Supabase session cookies
 * - Protect authenticated routes (/dashboard, /admin)
 * - Sanitize the trusted `x-user-id` header on every request so client
 *   code can never forge an identity by sending the header itself.
 *
 * Auth Strategy:
 * 1. Public routes: No auth check (header still stripped).
 * 2. Dashboard routes: Require authentication, then set x-user-id.
 * 3. Admin routes: Require authentication + admin role, then set x-user-id.
 */
const TRUSTED_USER_HEADER = "x-user-id";

function sanitizedRequestHeaders(request: NextRequest): Headers {
  const sanitized = new Headers(request.headers);
  // Always drop any client-supplied value before our own logic decides
  // whether to set it. Downstream `getCurrentUserId()` only trusts a
  // value originating from this proxy.
  sanitized.delete(TRUSTED_USER_HEADER);
  return sanitized;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session cookies
  const response = await updateSession(request);

  // Public routes — no auth check, but still strip any client-forged
  // `x-user-id` so it cannot reach downstream handlers.
  const publicRoutes = [
    "/",
    "/dashboard/login",
    "/dashboard/signup",
    "/dashboard/forgot-password",
    "/auth/callback",
    "/templates",
  ];

  const isPublicRoute =
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    ) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/");

  if (isPublicRoute) {
    // If the upstream cookie refresh produced a custom NextResponse we keep it.
    // Otherwise emit a fresh next() with sanitized headers so a forged
    // x-user-id cannot survive into a public handler.
    if (response.headers.has("location")) return response;
    return NextResponse.next({
      request: { headers: sanitizedRequestHeaders(request) },
    });
  }

  // Protected routes - check auth
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isDashboardRoute || isAdminRoute) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // Not authenticated - redirect to login
      if (error || !user) {
        const redirectUrl = new URL("/dashboard/login", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Admin route - check admin role
      if (isAdminRoute) {
        const adminStatus = await isAdmin(user.id);

        if (!adminStatus) {
          // Not admin - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      // Forward authenticated user id so downstream server actions /
      // data-access can skip a redundant supabase.auth.getUser() round-trip.
      // We start from sanitized headers so a client-supplied x-user-id
      // cannot reach this point.
      const forwardHeaders = sanitizedRequestHeaders(request);
      forwardHeaders.set(TRUSTED_USER_HEADER, user.id);
      return NextResponse.next({ request: { headers: forwardHeaders } });
    } catch (error) {
      console.error("Auth check error:", error);
      // On error, redirect to login for safety
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets. We INCLUDE /api/ here
     * so this proxy can sanitize `x-user-id` on those requests too —
     * otherwise a client could call /api/foo with a forged x-user-id
     * header and any future API handler that read the trusted header
     * would impersonate another user.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
