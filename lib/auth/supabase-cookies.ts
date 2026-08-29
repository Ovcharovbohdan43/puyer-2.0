const SHARED_COOKIE_ROOTS = ["puyer.org"] as const;

/** Share Auth cookies across apex and www so magic-link PKCE survives host redirects. */
export function supabaseAuthCookieOptions(hostname: string | undefined): { domain?: string } {
  const host = hostname?.split(":")[0]?.toLowerCase().trim();
  if (!host) {
    return {};
  }
  for (const root of SHARED_COOKIE_ROOTS) {
    if (host === root || host.endsWith(`.${root}`)) {
      return { domain: `.${root}` };
    }
  }
  return {};
}

export function supabaseClientOptions(hostname: string | undefined): {
  cookieOptions?: { domain?: string };
} {
  const cookieOptions = supabaseAuthCookieOptions(hostname);
  if (!cookieOptions.domain) {
    return {};
  }
  return { cookieOptions };
}
