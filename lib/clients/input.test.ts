import { describe, expect, it } from "vitest";

import { parseClientCreate } from "@/lib/clients/input";
import { ValidationError } from "@/lib/errors";

describe("parseClientCreate", () => {
  it("requires a name and a valid email for reminders", () => {
    expect(() => parseClientCreate({ name: "  ", email: "a@b.test" })).toThrow(ValidationError);
    expect(() => parseClientCreate({ name: "Acme", email: "" })).toThrow(/email/);
    expect(() => parseClientCreate({ name: "Acme", email: "not-an-email" })).toThrow(/email/);
    expect(parseClientCreate({ name: " Acme ", email: " billing@acme.test ", phone: " +1 555 " })).toEqual({
      name: "Acme",
      email: "billing@acme.test",
      phone: "+1 555",
      address: "",
    });
  });
});
