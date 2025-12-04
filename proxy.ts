import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"];
  const authPaths = ["/dashboard/login", "/dashboard/signup", "/dashboard/forgot-password"];
  const adminPaths = ["/admin"];

  const path = request.nextUrl.pathname;
  const isProtectedPath = protectedPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  const isAuthPath = authPaths.some((p) => path.startsWith(p));
  const isAdminPath = adminPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );

  // Check if user is authenticated
  let user = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    user = authUser;
  } catch {
    // Silently continue without user - auth may not be ready yet
  }

  // Handle admin routes - requires authentication AND admin flag
  if (isAdminPath) {
    // Redirect unauthenticated users to login page
    if (!user) {
      const redirectUrl = new URL("/dashboard/login", request.url);
      redirectUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user has admin privileges via user metadata
    const isAdminUser = user.user_metadata?.is_admin === true;

    // Redirect non-admin users to dashboard with error message
    if (!isAdminUser) {
      const redirectUrl = new URL("/dashboard", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      redirectUrl.searchParams.set("message", "Admin access required");
      return NextResponse.redirect(redirectUrl);
    }

    // Admin user authenticated - allow access
    return response;
  }

  if (isProtectedPath && !user) {
    // Don't redirect if already on an auth path
    if (isAuthPath) {
      return response;
    }
    // Redirect to dashboard/login with return URL
    const redirectUrl = new URL("/dashboard/login", request.url);
    redirectUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPath && user) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
