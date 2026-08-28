import { createClient } from "@/utils/supabase/client";
import { trySupabasePublicEnv } from "@/utils/supabase/env";

export function createBrowserSupabaseClient() {
  if (!trySupabasePublicEnv()) {
    return null;
  }
  return createClient();
}
