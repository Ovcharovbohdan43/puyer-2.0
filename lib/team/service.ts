import "server-only";

import type { OrgRole } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import {
  canChangeMemberRole,
  canRemoveMember,
  emailsMatch,
  INVITE_TTL_MS,
  isInviteExpired,
  normalizeInviteEmail,
  requireOrgPermission,
} from "@/lib/authorization/permissions";
import { prisma } from "@/lib/db/prisma";
import { sendInviteEmail } from "@/lib/email";
import { requireEntitlement } from "@/lib/entitlements";
import { loadEffectivePlan, planFromRow } from "@/lib/entitlements/load";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { isValidEmail } from "@/lib/invoices/validate";
import { logger } from "@/lib/observability/logger";
import { createInviteToken, hashInviteToken, isInviteTokenFormat } from "@/lib/team/token";

export async function listTeam(organizationId: string) {
  const [members, invites] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.organizationInvite.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invites };
}

export async function listUserWorkspaces(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function switchActiveOrganization(userId: string, organizationId: string) {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new ForbiddenError();
  }
  await prisma.user.update({
    where: { id: userId },
    data: { activeOrganizationId: organizationId },
  });
}

export async function inviteMember(input: {
  organizationId: string;
  actorUserId: string;
  actorRole: OrgRole;
  plan: ReturnType<typeof planFromRow>;
  email: string;
  orgName: string;
}) {
  requireOrgPermission(input.actorRole, "MANAGE_MEMBERS");
  requireEntitlement({ plan: input.plan }, "TEAM_MEMBERS");
  const email = normalizeInviteEmail(input.email);
  if (!isValidEmail(email)) {
    throw new ValidationError("Enter a valid email address.");
  }

  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId: input.organizationId, user: { email: { equals: email, mode: "insensitive" } } },
  });
  if (existingMember) {
    throw new ValidationError("That person is already on this team.");
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const pending = await prisma.organizationInvite.findFirst({
    where: { organizationId: input.organizationId, email, status: "PENDING" },
  });
  const invite = pending
    ? await prisma.organizationInvite.update({
        where: { id: pending.id },
        data: { tokenHash, expiresAt, invitedByUserId: input.actorUserId, role: "MEMBER" },
      })
    : await prisma.organizationInvite.create({
        data: {
          organizationId: input.organizationId,
          email,
          role: "MEMBER",
          tokenHash,
          expiresAt,
          invitedByUserId: input.actorUserId,
        },
      });

  await writeAuditLog({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "MEMBER_INVITED",
    entityType: "OrganizationInvite",
    entityId: invite.id,
    metadata: { email },
  });

  const sent = await sendInviteEmail({
    to: email,
    orgName: input.orgName,
    token,
    idempotencyKey: `invite:${invite.id}:${tokenHash.slice(0, 12)}`,
  });
  if (sent.skipped) {
    logger.warn("team_invite_email_skipped", { organizationId: input.organizationId });
  }
  return { inviteId: invite.id, email };
}

export async function lookupInvite(token: string) {
  if (!isInviteTokenFormat(token)) {
    throw new NotFoundError("This invitation is no longer valid.");
  }
  const invite = await prisma.organizationInvite.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    include: { organization: { select: { id: true, name: true } } },
  });
  if (!invite || invite.status !== "PENDING" || isInviteExpired(invite.expiresAt)) {
    throw new NotFoundError("This invitation is no longer valid.");
  }
  return invite;
}

export async function acceptInvite(input: { token: string; userId: string; email: string }) {
  const invite = await lookupInvite(input.token);
  if (!emailsMatch(invite.email, input.email)) {
    throw new ForbiddenError("Sign in with the invited email address to join this workspace.");
  }
  const plan = await loadEffectivePlan(invite.organizationId);
  requireEntitlement({ plan }, "TEAM_MEMBERS");

  await prisma.$transaction(async (tx) => {
    const already = await tx.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId: input.userId, organizationId: invite.organizationId },
      },
    });
    if (!already) {
      await tx.organizationMember.create({
        data: {
          userId: input.userId,
          organizationId: invite.organizationId,
          role: "MEMBER",
        },
      });
    }
    await tx.notificationPreference.upsert({
      where: {
        userId_organizationId: { userId: input.userId, organizationId: invite.organizationId },
      },
      create: { userId: input.userId, organizationId: invite.organizationId },
      update: {},
    });
    await tx.organizationInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    await tx.user.update({
      where: { id: input.userId },
      data: { activeOrganizationId: invite.organizationId },
    });
  });
  return { organizationId: invite.organizationId, organizationName: invite.organization.name };
}

export async function updateMemberRole(input: {
  organizationId: string;
  actorUserId: string;
  actorRole: OrgRole;
  plan: ReturnType<typeof planFromRow>;
  memberId: string;
  nextRole: OrgRole;
}) {
  requireOrgPermission(input.actorRole, "MANAGE_MEMBERS");
  requireEntitlement({ plan: input.plan }, "TEAM_MEMBERS");
  const target = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!target) {
    throw new NotFoundError();
  }
  const ownerCount = await prisma.organizationMember.count({
    where: { organizationId: input.organizationId, role: "OWNER" },
  });
  if (
    !canChangeMemberRole({
      actorRole: input.actorRole,
      targetRole: target.role,
      nextRole: input.nextRole,
      ownerCount,
      isSelf: target.userId === input.actorUserId,
    })
  ) {
    throw new ForbiddenError("The workspace must keep at least one owner.");
  }
  await prisma.organizationMember.update({
    where: { id: target.id },
    data: { role: input.nextRole },
  });
  await writeAuditLog({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "ROLE_CHANGED",
    entityType: "OrganizationMember",
    entityId: target.id,
    metadata: { from: target.role, to: input.nextRole },
  });
}

export async function removeMember(input: {
  organizationId: string;
  actorUserId: string;
  actorRole: OrgRole;
  plan: ReturnType<typeof planFromRow>;
  memberId: string;
}) {
  requireOrgPermission(input.actorRole, "MANAGE_MEMBERS");
  requireEntitlement({ plan: input.plan }, "TEAM_MEMBERS");
  const target = await prisma.organizationMember.findFirst({
    where: { id: input.memberId, organizationId: input.organizationId },
  });
  if (!target) {
    throw new NotFoundError();
  }
  const ownerCount = await prisma.organizationMember.count({
    where: { organizationId: input.organizationId, role: "OWNER" },
  });
  if (
    !canRemoveMember({
      actorRole: input.actorRole,
      targetRole: target.role,
      ownerCount,
      isSelf: target.userId === input.actorUserId,
    })
  ) {
    throw new ForbiddenError("The workspace must keep at least one owner.");
  }
  await prisma.organizationMember.delete({ where: { id: target.id } });
  await prisma.user.updateMany({
    where: { id: target.userId, activeOrganizationId: input.organizationId },
    data: { activeOrganizationId: null },
  });
}

export async function revokeInvite(input: {
  organizationId: string;
  actorRole: OrgRole;
  plan: ReturnType<typeof planFromRow>;
  inviteId: string;
}) {
  requireOrgPermission(input.actorRole, "MANAGE_MEMBERS");
  requireEntitlement({ plan: input.plan }, "TEAM_MEMBERS");
  const updated = await prisma.organizationInvite.updateMany({
    where: { id: input.inviteId, organizationId: input.organizationId, status: "PENDING" },
    data: { status: "REVOKED" },
  });
  if (updated.count === 0) {
    throw new NotFoundError();
  }
}
