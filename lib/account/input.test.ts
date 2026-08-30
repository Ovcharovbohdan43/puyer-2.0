import { describe, expect, it } from "vitest";

import {
  parseAccountEmailBody,
  parseAccountPasswordBody,
  parseAccountProfileBody,
  parseDeletionReason,
} from "@/lib/account/input";
import { ValidationError } from "@/lib/errors";

describe("account input", () => {
  it("requires a name and a timezone", () => {
    expect(() => parseAccountProfileBody({ name: "A", timezone: "UTC" }, false)).toThrow(ValidationError);
    const parsed = parseAccountProfileBody({ name: "Ada Lovelace", timezone: "Europe/Kyiv" }, false);
    expect(parsed.name).toBe("Ada Lovelace");
    expect(parsed.timezone).toBe("Europe/Kyiv");
  });

  it("requires a business name for owners", () => {
    expect(() => parseAccountProfileBody({ name: "Ada Lovelace", timezone: "UTC" }, true)).toThrow(
      ValidationError,
    );
  });

  it("rejects the current email", () => {
    expect(() => parseAccountEmailBody({ email: "ada@puyer.org" }, "Ada@puyer.org")).toThrow(ValidationError);
    expect(parseAccountEmailBody({ email: "new@puyer.org" }, "ada@puyer.org")).toBe("new@puyer.org");
  });

  it("requires a letter and a number in the password", () => {
    expect(() => parseAccountPasswordBody({ password: "abcdefghijkl" })).toThrow(ValidationError);
    const parsed = parseAccountPasswordBody({ password: "correcthorse1" });
    expect(parsed.password).toBe("correcthorse1");
  });

  it("requires a deletion reason", () => {
    expect(() => parseDeletionReason({ reason: "too short" })).toThrow(ValidationError);
    expect(parseDeletionReason({ reason: "I no longer need this workspace." }).length).toBeGreaterThan(11);
  });
});
