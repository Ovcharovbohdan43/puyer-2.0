import { describe, expect, it } from "vitest";

import { hasOrgRole, isOrgMember } from "@/lib/authorization/roles";

describe("org authorization", () => {
  it("allows listed roles only", () => {
    expect(hasOrgRole("OWNER", ["OWNER"])).toBe(true);
    expect(hasOrgRole("MEMBER", ["OWNER"])).toBe(false);
    expect(hasOrgRole("MEMBER", ["OWNER", "MEMBER"])).toBe(true);
  });

  it("scopes membership to organization ids from the database", () => {
    const orgs = ["org-a", "org-b"];
    expect(isOrgMember(orgs, "org-a")).toBe(true);
    expect(isOrgMember(orgs, "org-c")).toBe(false);
  });
});
