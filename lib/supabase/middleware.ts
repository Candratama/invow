import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Decode the `exp` claim of a JWT without verifying the signature.
 * Verification happens server-side via supabase.auth.getUser(); here we just
 * need to know whether the token is *near* expiry to avoid an unnecessary
 * round-trip on every request.
 */
function getJwtExpSeconds(jwt: string): number | null {
  try {
    const payload = jwt.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
    )
    return typeof decoded.exp === 'number' ? decoded.exp : null
  } catch {
    return null
  }
}

/**
 * Pull the supabase access token out of the cookie jar. Cookie name is
 * `sb-<project-ref>-auth-token` (legacy) or split chunked variants. We look
 * for a JSON-shaped value containing `access_token`.
 */
function findAccessTokenInCookies(request: NextRequest): string | null {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith('sb-')) continue
    if (!cookie.name.includes('-auth-token')) continue
    const raw = cookie.value
    if (!raw) continue
    try {
      // Modern cookies are JSON arrays / objects; older are JSON objects.
      const parsed = JSON.parse(raw.startsWith('base64-') ? Buffer.from(raw.slice(7), 'base64').toString() : raw)
      const token = Array.isArray(parsed)
        ? parsed[0]
        : parsed?.access_token
      if (typeof token === 'string') return token
    } catch {
      // Fallback: cookie value might already be a raw JWT
      if (raw.split('.').length === 3) return raw
    }
  }
  return null
}

const SESSION_REFRESH_BUFFER_SECONDS = 60

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Fast path: skip the supabase round-trip if the access token is still
  // comfortably valid. We only refresh when expiry is within 60s.
  const accessToken = findAccessTokenInCookies(request)
  if (accessToken) {
    const expSec = getJwtExpSeconds(accessToken)
    const nowSec = Math.floor(Date.now() / 1000)
    if (expSec && expSec - nowSec > SESSION_REFRESH_BUFFER_SECONDS) {
      return response
    }
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if expired
    await supabase.auth.getUser()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update session:', error)
    }
  }

  return response
}
