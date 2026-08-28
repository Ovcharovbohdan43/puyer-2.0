import type { OrgRole } from "@prisma/client";

import { ForbiddenError } from "@/lib/errors";

export type OrgPermission =
  | "MANAGE_BILLING"
  | "MANAGE_STRIPE"
  | "MANAGE_MEMBERS"
  | "MANAGE_INVOICES"
  | "MANAGE_CLIENTS"
  | "VIEW_REPORTS"
  | "VIEW_PAYMENTS"
  | "VIEW_TEAM";

const MEMBER_PERMISSIONS: ReadonlySet<OrgPermission> = new Set([
  "MANAGE_INVOICES",
  "MANAGE_CLIENTS",
  "VIEW_REPORTS",
  "VIEW_PAYMENTS",
  "VIEW_TEAM",
]);

export function canOrgPermission(role: OrgRole, permission: OrgPermission): boolean {
  if (role === "OWNER") {
    return true;
  }
  return MEMBER_PERMISSIONS.has(permission);
}

export function requireOrgPermission(role: OrgRole, permission: OrgPermission): void {
  if (!canOrgPermission(role, permission)) {
    throw new ForbiddenError();
  }
}

export function canChangeMemberRole(input: {
  actorRole: OrgRole;
  targetRole: OrgRole;
  nextRole: OrgRole;
  ownerCount: number;
  isSelf: boolean;
}): boolean {
  if (input.actorRole !== "OWNER") {
    return false;
  }
  if (input.nextRole !== "OWNER" && input.nextRole !== "MEMBER") {
    return false;
  }
  if (input.targetRole === "OWNER" && input.nextRole === "MEMBER") {
    if (input.ownerCount <= 1) {
      return false;
    }
  }
  return true;
}

export function canRemoveMember(input: {
  actorRole: OrgRole;
  targetRole: OrgRole;
  ownerCount: number;
  isSelf: boolean;
}): boolean {
  if (input.actorRole !== "OWNER") {
    return false;
  }
  if (input.isSelf) {
    return false;
  }
  if (input.targetRole === "OWNER" && input.ownerCount <= 1) {
    return false;
  }
  return true;
}

export function emailsMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isInviteExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const INVITE_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;
