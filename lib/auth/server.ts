import "server-only";

import { createClient } from "@/utils/supabase/server";
import { trySupabasePublicEnv } from "@/utils/supabase/env";

export async function createServerSupabaseClient() {
  if (!trySupabasePublicEnv()) {
    return null;
  }
  return createClient();
}
