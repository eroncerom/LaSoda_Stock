import { createClient } from '@supabase/supabase-js'

export async function createAdminClient() {
  // Uses service_role key — ONLY for server-side
  // This key NEVER goes to the browser. 
  // We use the regular createClient here to ensure it ALWAYS uses the service_role key 
  // and doesn't get confused by user cookies.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
