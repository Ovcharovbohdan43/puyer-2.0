function originOfUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function isLocalOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".localhost");
  } catch {
    return false;
  }
}

/** Public origin of this request (honors Vercel `x-forwarded-host`). */
export function requestPublicOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedHost) {
    const proto = forwardedProto || (forwardedHost.startsWith("localhost") || forwardedHost.startsWith("127.0.0.1") ? "http" : "https");
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

/**
 * Host for `emailRedirectTo`. Always the host the user posted from so PKCE cookies match.
 * If `NEXT_PUBLIC_APP_URL` is still localhost while the request is production, ignore it.
 */
export function magicLinkRedirectOrigin(request: Request): string {
  const fromRequest = requestPublicOrigin(request);
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return fromRequest;
  }
  const configuredOrigin = originOfUrl(configured);
  if (!configuredOrigin) {
    return fromRequest;
  }
  if (isLocalOrigin(configuredOrigin) && !isLocalOrigin(fromRequest)) {
    return fromRequest;
  }
  return fromRequest;
}

export function magicLinkEmailRedirectTo(request: Request): string {
  return `${magicLinkRedirectOrigin(request)}/auth/callback`;
}

export function homeHasAuthCallbackParams(pathname: string, searchParams: URLSearchParams): boolean {
  if (pathname !== "/") {
    return false;
  }
  return Boolean(searchParams.get("code") || searchParams.get("token_hash"));
}

export function shouldOpenDashboardAfterImplicitMagicLink(
  pathname: string,
  hash: string,
  search: string,
): boolean {
  if (pathname !== "/") {
    return false;
  }
  if (search.includes("resume=")) {
    return false;
  }
  return hash.includes("access_token");
}
