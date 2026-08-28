import { describe, expect, it } from "vitest";

import { ForbiddenError } from "@/lib/errors";
import { assertBrowserOrigin } from "@/lib/http/origin";

describe("assertBrowserOrigin", () => {
  it("allows GET and mutation requests without Origin", () => {
    expect(() =>
      assertBrowserOrigin(new Request("http://localhost:3000/api/clients", { method: "GET" })),
    ).not.toThrow();
    expect(() =>
      assertBrowserOrigin(new Request("http://localhost:3000/api/clients", { method: "POST" })),
    ).not.toThrow();
  });

  it("allows same-origin POSTs and rejects cross-site Origin", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    try {
      expect(() =>
        assertBrowserOrigin(
          new Request("http://localhost:3000/api/clients", {
            method: "POST",
            headers: { origin: "http://localhost:3000" },
          }),
        ),
      ).not.toThrow();
      expect(() =>
        assertBrowserOrigin(
          new Request("http://localhost:3000/api/clients", {
            method: "POST",
            headers: { origin: "https://evil.example" },
          }),
        ),
      ).toThrow(ForbiddenError);
    } finally {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });
});
