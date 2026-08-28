import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { trySupabasePublicEnv } from "@/utils/supabase/env";

export function tryStorageAdmin(): SupabaseClient | null {
  const env = trySupabasePublicEnv();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !serviceRole) {
    return null;
  }
  return createClient(env.url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
