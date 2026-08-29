/** Prisma + Supabase transaction pooler (PgBouncer) query flags. */

const PGBOUNCER = "pgbouncer";
const STATEMENT_CACHE = "statement_cache_size";
const CONNECTION_LIMIT = "connection_limit";

function appendParam(url: string, key: string, value: string): string {
  const join = url.includes("?") ? "&" : "?";
  if (new RegExp(`[?&]${key}=`, "i").test(url)) {
    return url.replace(new RegExp(`([?&]${key}=)[^&]*`, "i"), `$1${value}`);
  }
  return `${url}${join}${key}=${value}`;
}

/**
 * Transaction-mode PgBouncer rejects Prisma's named prepared statements (Postgres 42P05).
 * Prisma's `pgbouncer=true` flag plus a zero statement cache avoids `s0` / `s1` collisions
 * on reused pooler connections (Vercel serverless + layout/page queries).
 */
export function withPrismaPoolerParams(databaseUrl: string): string {
  const trimmed = databaseUrl.trim();
  if (!trimmed) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    url.searchParams.set(PGBOUNCER, "true");
    url.searchParams.set(STATEMENT_CACHE, "0");
    if (!url.searchParams.has(CONNECTION_LIMIT)) {
      url.searchParams.set(CONNECTION_LIMIT, "1");
    }
    return url.toString();
  } catch {
    let next = appendParam(trimmed, PGBOUNCER, "true");
    next = appendParam(next, STATEMENT_CACHE, "0");
    if (!/[?&]connection_limit=/i.test(next)) {
      next = appendParam(next, CONNECTION_LIMIT, "1");
    }
    return next;
  }
}

export function isPreparedStatementConflict(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return text.includes("42P05") || /prepared statement .* already exists/i.test(text);
}
