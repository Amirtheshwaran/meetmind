import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client — lazily initialized to avoid build-time crashes
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
    _admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return _admin;
}

// Convenience proxy — use this everywhere instead of instantiating directly
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
