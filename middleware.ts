import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"];
  const authPaths = ["/dashboard/login", "/dashboard/signup", "/dashboard/forgot-password"];

  const path = request.nextUrl.pathname;
  const isProtectedPath = protectedPaths.some(
    (p) => path === p || path.startsWith(p + "/")
  );
  const isAuthPath = authPaths.some((p) => path.startsWith(p));

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
  } catch (error) {
    // Silently continue without user - auth may not be ready yet
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
