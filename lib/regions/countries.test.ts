import { describe, expect, it } from "vitest";

import {
  countryLabel,
  parseConnectCountry,
  shouldCreateNewConnectedAccount,
} from "@/lib/regions/countries";

describe("connect country", () => {
  it("keeps USD invoicing independent of Stripe region", () => {
    expect(parseConnectCountry("ua")).toBe("UA");
    expect(parseConnectCountry("xx", "PL")).toBe("PL");
    expect(countryLabel("UA")).toMatch(/Ukraine/i);
  });

  it("creates a new Stripe account after disconnect only when the country changed", () => {
    expect(shouldCreateNewConnectedAccount(null, "UA")).toBe(true);
    expect(
      shouldCreateNewConnectedAccount(
        { stripeConnectedAccountId: "acct_1", status: "CONNECTED", identityCountry: "US" },
        "UA",
      ),
    ).toBe(false);
    expect(
      shouldCreateNewConnectedAccount(
        { stripeConnectedAccountId: "acct_1", status: "DISCONNECTED", identityCountry: "US" },
        "UA",
      ),
    ).toBe(true);
    expect(
      shouldCreateNewConnectedAccount(
        { stripeConnectedAccountId: "acct_1", status: "DISCONNECTED", identityCountry: "US" },
        "US",
      ),
    ).toBe(false);
  });
});
