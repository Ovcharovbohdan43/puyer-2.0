import "server-only";

import { cache } from "react";
import { Prisma } from "@prisma/client";

import { isPreparedStatementConflict } from "@/lib/db/pooler-url";
import { prisma } from "@/lib/db/prisma";
import { workspaceDisplayName } from "@/lib/identity/name";
import { logger } from "@/lib/observability/logger";

type ProvisionUser = {
  id: string;
  email: string;
};

const membershipInclude = {
  organization: { include: { businessProfile: true, subscription: true } },
  user: true,
} as const;

export type WorkspaceMembership = Prisma.OrganizationMemberGetPayload<{
  include: typeof membershipInclude;
}>;

async function findMembership(
  tx: Prisma.TransactionClient | typeof prisma,
  userId: string,
): Promise<WorkspaceMembership | null> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { activeOrganizationId: true },
  });
  if (user?.activeOrganizationId) {
    const preferred = await tx.organizationMember.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: user.activeOrganizationId },
      },
      include: membershipInclude,
    });
    if (preferred) {
      return preferred;
    }
  }
  return tx.organizationMember.findFirst({
    where: { userId },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function createWorkspace(userId: string, email: string): Promise<WorkspaceMembership> {
  const name = workspaceDisplayName(email);
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: userId },
      create: { id: userId, email, name },
      update: { email },
    });
    await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE id = CAST(${userId} AS uuid) FOR UPDATE
    `;
    const raced = await findMembership(tx, userId);
    if (raced) {
      return { membership: raced, created: false };
    }
    const organization = await tx.organization.create({
      data: {
        name: `${name}'s workspace`,
        plan: "FREE",
        members: { create: { userId, role: "OWNER" } },
        businessProfile: { create: { businessName: name } },
        notificationPreferences: { create: { userId } },
        reminderRule: { create: {} },
      },
    });
    const created = await findMembership(tx, userId);
    if (!created || created.organizationId !== organization.id) {
      throw new Error("Workspace provision failed");
    }
    await tx.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organization.id },
    });
    return { membership: created, created: true };
  });

  if (result.created) {
    logger.info("workspace_provisioned", { organizationId: result.membership.organizationId });
  }
  return result.membership;
}

async function loadOrCreateWorkspace(userId: string, email: string): Promise<WorkspaceMembership> {
  const existing = await findMembership(prisma, userId);
  if (existing) {
    return existing;
  }

  try {
    return await createWorkspace(userId, email);
  } catch (error) {
    if (isUniqueConflict(error)) {
      const recovered = await findMembership(prisma, userId);
      if (recovered) {
        return recovered;
      }
    }
    throw error;
  }
}

const provisionWorkspace = cache(async (userId: string, email: string): Promise<WorkspaceMembership> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await loadOrCreateWorkspace(userId, email);
    } catch (error) {
      lastError = error;
      if (!isPreparedStatementConflict(error) || attempt === 2) {
        throw error;
      }
      logger.warn("workspace_prepared_statement_retry", { attempt });
    }
  }
  throw lastError;
});

export async function ensureWorkspace(user: ProvisionUser): Promise<WorkspaceMembership> {
  return provisionWorkspace(user.id, user.email);
}
