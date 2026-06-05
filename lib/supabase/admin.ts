import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client that uses the service_role key.
 * This bypasses Row Level Security and should ONLY be used in
 * server-side API routes after verifying the caller is an admin.
 * Never expose this client or the service_role key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
