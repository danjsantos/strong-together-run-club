/**
 * Server-side admin helpers.
 *
 * These functions must only be called from Server Components, API Route
 * Handlers, and middleware — never from client-side code.
 *
 * Admin status is determined by the `is_admin` boolean column on the
 * `profiles` table, not by an environment variable.
 */

import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an anon-key Supabase client that reads/writes cookies.
 * Safe to call from Route Handlers and Server Components.
 */
function makeAnonClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookies can't be set here.
          }
        },
      },
    }
  )
}

/**
 * Build a service-role Supabase client (bypasses RLS).
 * Used to read `profiles.is_admin` even when RLS would otherwise block it.
 */
function makeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the currently authenticated user has `is_admin = true`
 * in the `profiles` table.  Returns `false` for unauthenticated requests or
 * when the profile row doesn't exist / the flag is not set.
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = makeAnonClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    // Use the service-role client so RLS never blocks this read.
    const adminDb = makeServiceClient()
    const { data, error } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error || !data) return false
    return data.is_admin === true
  } catch {
    return false
  }
}

/**
 * Convenience wrapper for Route Handlers: resolves to the authenticated user
 * object when the caller is an admin, or `null` otherwise.
 *
 * Usage:
 *   const user = await requireAdmin()
 *   if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 */
export async function requireAdmin() {
  try {
    const supabase = makeAnonClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const adminDb = makeServiceClient()
    const { data, error } = await adminDb
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (error || !data || data.is_admin !== true) return null
    return user
  } catch {
    return null
  }
}
