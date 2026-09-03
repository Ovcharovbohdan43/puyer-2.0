import { isProtectedPath } from "@/lib/auth/protected-routes";

/** Supabase SSR cookies are `sb-<ref>-auth-token` (and chunked `.0` siblings). */
export function hasSupabaseCookies(cookieNames: readonly string[]): boolean {
  return cookieNames.some((name) => name.startsWith("sb-"));
}

/**
 * Call Auth `getClaims()` in `proxy.ts` only when a refresh can succeed.
 * Anonymous marketing/API traffic must not wait on JWKS.
 */
export function shouldRefreshAuthSession(input: {
  path: string;
  cookieNames: readonly string[];
}): boolean {
  return hasSupabaseCookies(input.cookieNames);
}

/** Protected app routes with no Auth cookies can redirect without `getClaims()`. */
export function shouldRedirectProtectedWithoutSession(input: {
  path: string;
  cookieNames: readonly string[];
}): boolean {
  return isProtectedPath(input.path) && !hasSupabaseCookies(input.cookieNames);
}
