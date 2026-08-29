import { createBrowserClient } from "@supabase/ssr";

import { supabaseClientOptions } from "@/lib/auth/supabase-cookies";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

export function createClient() {
  const { url, publishableKey } = getSupabasePublicEnv();
  const hostname = typeof window === "undefined" ? undefined : window.location.hostname;

  return createBrowserClient(url, publishableKey, supabaseClientOptions(hostname));
}
