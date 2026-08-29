import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

import { supabaseClientOptions } from "@/lib/auth/supabase-cookies";
import { getSupabasePublicEnv } from "@/utils/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const hostname =
    headerStore.get("x-forwarded-host")?.split(",")[0]?.trim().split(":")[0] ??
    headerStore.get("host")?.split(":")[0];
  const { url, publishableKey } = getSupabasePublicEnv();

  return createServerClient(url, publishableKey, {
    ...supabaseClientOptions(hostname),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component. Session refresh runs in proxy.ts.
        }
      },
    },
  });
}
