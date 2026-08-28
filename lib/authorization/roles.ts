import type { OrgRole } from "@prisma/client";

export function hasOrgRole(actual: OrgRole, allowed: readonly OrgRole[]): boolean {
  return allowed.includes(actual);
}

export function isOrgMember(membershipOrgIds: readonly string[], organizationId: string): boolean {
  return membershipOrgIds.includes(organizationId);
}
