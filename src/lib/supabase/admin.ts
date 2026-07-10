import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// SERVICE ROLE CLIENT — bypasses Row Level Security entirely.
// Import ONLY from files under src/app/api/**/route.ts. Never import this
// from a "use client" component or any code that ships to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
