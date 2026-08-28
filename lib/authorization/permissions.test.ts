import { describe, expect, it } from "vitest";

import {
  canChangeMemberRole,
  canOrgPermission,
  canRemoveMember,
  emailsMatch,
  isInviteExpired,
  requireOrgPermission,
} from "@/lib/authorization/permissions";
import { ForbiddenError } from "@/lib/errors";
import { hashInviteToken, isInviteTokenFormat } from "@/lib/team/token";

describe("org permission matrix", () => {
  it("lets members work invoices and clients but not billing, Stripe, or seats", () => {
    expect(canOrgPermission("MEMBER", "MANAGE_INVOICES")).toBe(true);
    expect(canOrgPermission("MEMBER", "MANAGE_CLIENTS")).toBe(true);
    expect(canOrgPermission("MEMBER", "VIEW_TEAM")).toBe(true);
    expect(canOrgPermission("MEMBER", "MANAGE_BILLING")).toBe(false);
    expect(canOrgPermission("MEMBER", "MANAGE_STRIPE")).toBe(false);
    expect(canOrgPermission("MEMBER", "MANAGE_MEMBERS")).toBe(false);
    expect(canOrgPermission("OWNER", "MANAGE_MEMBERS")).toBe(true);
    expect(() => requireOrgPermission("MEMBER", "MANAGE_MEMBERS")).toThrow(ForbiddenError);
  });

  it("blocks demoting or removing the last owner", () => {
    expect(
      canChangeMemberRole({
        actorRole: "OWNER",
        targetRole: "OWNER",
        nextRole: "MEMBER",
        ownerCount: 1,
        isSelf: true,
      }),
    ).toBe(false);
    expect(
      canChangeMemberRole({
        actorRole: "OWNER",
        targetRole: "OWNER",
        nextRole: "MEMBER",
        ownerCount: 2,
        isSelf: true,
      }),
    ).toBe(true);
    expect(
      canChangeMemberRole({
        actorRole: "MEMBER",
        targetRole: "MEMBER",
        nextRole: "OWNER",
        ownerCount: 1,
        isSelf: false,
      }),
    ).toBe(false);
    expect(
      canRemoveMember({ actorRole: "OWNER", targetRole: "MEMBER", ownerCount: 1, isSelf: false }),
    ).toBe(true);
    expect(
      canRemoveMember({ actorRole: "OWNER", targetRole: "OWNER", ownerCount: 1, isSelf: false }),
    ).toBe(false);
    expect(
      canRemoveMember({ actorRole: "OWNER", targetRole: "MEMBER", ownerCount: 1, isSelf: true }),
    ).toBe(false);
  });

  it("matches invite emails case-insensitively and hashes tokens", () => {
    expect(emailsMatch("Ada@Puyer.org", "ada@puyer.org")).toBe(true);
    expect(isInviteExpired(new Date("2026-08-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      true,
    );
    expect(isInviteExpired(new Date("2026-09-01T00:00:00.000Z"), new Date("2026-08-28T00:00:00.000Z"))).toBe(
      false,
    );
    const hash = hashInviteToken("a".repeat(64));
    expect(hash).toHaveLength(64);
    expect(hashInviteToken("a".repeat(64))).toBe(hash);
    expect(isInviteTokenFormat("g".repeat(64))).toBe(false);
    expect(isInviteTokenFormat("ab".repeat(32))).toBe(true);
  });
});
