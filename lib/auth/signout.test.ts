import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/auth/signout/route";

vi.mock("@/lib/auth/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/auth/server";

describe("POST /api/auth/signout", () => {
  afterEach(() => {
    vi.mocked(createServerSupabaseClient).mockReset();
  });

  it("signs out through the server client so cookies are cleared", async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    vi.mocked(createServerSupabaseClient).mockResolvedValue({
      auth: { signOut },
    } as never);

    const response = await POST(
      new Request("http://localhost:3000/api/auth/signout", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
      }),
    );
    expect(response.status).toBe(200);
    expect(signOut).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects a cross-site Origin", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/auth/signout", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    );
    expect(response.status).toBe(403);
    expect(vi.mocked(createServerSupabaseClient)).not.toHaveBeenCalled();
  });
});
