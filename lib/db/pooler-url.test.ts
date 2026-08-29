import { describe, expect, it } from "vitest";

import { isPreparedStatementConflict, withPrismaPoolerParams } from "@/lib/db/pooler-url";

describe("withPrismaPoolerParams", () => {
  it("adds pgbouncer, zero statement cache, and a serverless connection limit", () => {
    const next = withPrismaPoolerParams(
      "postgresql://postgres.abc:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    );
    expect(next).toContain("pgbouncer=true");
    expect(next).toContain("statement_cache_size=0");
    expect(next).toContain("connection_limit=1");
  });

  it("does not override an explicit connection_limit", () => {
    const next = withPrismaPoolerParams(
      "postgresql://u:p@host:6543/postgres?pgbouncer=true&connection_limit=5",
    );
    expect(next).toContain("connection_limit=5");
    expect(next).not.toContain("connection_limit=1");
    expect(next).toContain("statement_cache_size=0");
  });

  it("still flags a URL the URL constructor cannot parse", () => {
    const next = withPrismaPoolerParams("postgresql://u:p@ss@host:6543/postgres");
    expect(next).toContain("pgbouncer=true");
    expect(next).toContain("statement_cache_size=0");
  });
});

describe("isPreparedStatementConflict", () => {
  it("detects Postgres 42P05 from Prisma/pgbouncer", () => {
    expect(
      isPreparedStatementConflict(
        new Error('prepared statement "s0" already exists\ncode: "42P05"'),
      ),
    ).toBe(true);
    expect(isPreparedStatementConflict(new Error("P2025"))).toBe(false);
  });
});
