import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    stripeConnection: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/stripe/client", () => ({
  getStripe: vi.fn(),
  appBaseUrl: () => "https://puyer.test",
}));

import { prisma } from "@/lib/db/prisma";
import { loadConnectionForSettings } from "@/lib/stripe/connect/service";

describe("loadConnectionForSettings", () => {
  beforeEach(() => {
    vi.mocked(prisma.stripeConnection.findUnique).mockReset();
  });

  it("returns NOT_CONNECTED when no row exists", async () => {
    vi.mocked(prisma.stripeConnection.findUnique).mockResolvedValue(null);
    await expect(loadConnectionForSettings("org_1")).resolves.toEqual({
      status: "NOT_CONNECTED",
      chargesEnabled: false,
      identityCountry: null,
    });
  });

  it("does not throw when the lookup fails", async () => {
    vi.mocked(prisma.stripeConnection.findUnique).mockRejectedValue(new Error("relation does not exist"));
    await expect(loadConnectionForSettings("org_1")).resolves.toEqual({
      status: "NOT_CONNECTED",
      chargesEnabled: false,
      identityCountry: null,
    });
  });
});
