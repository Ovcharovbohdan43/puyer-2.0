import "server-only";

import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import type { AccountProfileInput } from "@/lib/account/input";

export async function updateAccountProfile(user: SessionUser, input: AccountProfileInput) {
  const membership = await requireOrganization(user);
  const isOwner = membership.role === "OWNER";

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { name: input.name, timezone: input.timezone },
    });
    if (!isOwner) {
      return;
    }
    await tx.businessProfile.update({
      where: { organizationId: membership.organizationId },
      data: {
        businessName: input.businessName,
        businessAddress: input.businessAddress,
        defaultCountry: input.country,
      },
    });
    await tx.organization.update({
      where: { id: membership.organizationId },
      data: { name: input.businessName },
    });
  });

  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "ACCOUNT_PROFILE_UPDATED",
    entityType: "User",
    entityId: user.id,
  });
  logger.info("account_profile_updated");
}

export async function loadOpenDeletionRequest(userId: string) {
  return prisma.accountDeletionRequest.findFirst({
    where: { userId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
}

export async function createDeletionRequest(user: SessionUser, reason: string) {
  const membership = await requireOrganization(user);
  const existing = await loadOpenDeletionRequest(user.id);
  if (existing) {
    throw new ValidationError("A deletion request is already open.");
  }
  const request = await prisma.accountDeletionRequest.create({
    data: {
      userId: user.id,
      organizationId: membership.organizationId,
      reason,
      status: "OPEN",
    },
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "ACCOUNT_DELETION_REQUESTED",
    entityType: "AccountDeletionRequest",
    entityId: request.id,
  });
  logger.info("account_deletion_requested");
  return { request, membership };
}

export async function cancelDeletionRequest(user: SessionUser) {
  const membership = await requireOrganization(user);
  const existing = await loadOpenDeletionRequest(user.id);
  if (!existing) {
    throw new ValidationError("There is no open deletion request.");
  }
  await prisma.accountDeletionRequest.update({
    where: { id: existing.id },
    data: { status: "CANCELED" },
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "ACCOUNT_DELETION_CANCELED",
    entityType: "AccountDeletionRequest",
    entityId: existing.id,
  });
  logger.info("account_deletion_canceled");
  return existing;
}
