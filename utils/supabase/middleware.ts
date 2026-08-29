import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { supabaseClientOptions } from "@/lib/auth/supabase-cookies";
import { trySupabasePublicEnv } from "@/utils/supabase/env";

export async function updateSession(request: NextRequest) {
  const env = trySupabasePublicEnv();
  if (!env) {
    return {
      response: NextResponse.next({ request }),
      signedIn: false,
    };
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(env.url, env.publishableKey, {
    ...supabaseClientOptions(request.nextUrl.hostname),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();

  return {
    response: supabaseResponse,
    signedIn: Boolean(data?.claims && typeof data.claims.sub === "string"),
  };
}
