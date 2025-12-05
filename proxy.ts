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
 * 
 * Auth Strategy:
 * 1. Public routes: No auth check
 * 2. Dashboard routes: Require authentication
 * 3. Admin routes: Require authentication + admin role
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session cookies
  const response = await updateSession(request);

  // Public routes - no auth needed
  const publicRoutes = [
    "/",
    "/dashboard/login",
    "/dashboard/signup",
    "/dashboard/forgot-password",
    "/auth/callback",
    "/templates",
  ];

  const isPublicRoute =
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/")) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/");

  if (isPublicRoute) {
    return response;
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

      return response;
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
