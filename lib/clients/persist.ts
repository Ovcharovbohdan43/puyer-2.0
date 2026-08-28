import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { ValidationError } from "@/lib/errors";

export async function listClients(user: SessionUser) {
  const membership = await requireOrganization(user);
  return prisma.client.findMany({
    where: { organizationId: membership.organizationId },
    orderBy: { name: "asc" },
  });
}

export async function createClient(
  user: SessionUser,
  input: { name: string; email?: string; address?: string; phone?: string; notes?: string },
) {
  const membership = await requireOrganization(user);
  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Enter a client name.");
  }
  const client = await prisma.client.create({
    data: {
      organizationId: membership.organizationId,
      name,
      email: input.email?.trim() ?? "",
      address: input.address?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
    },
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "CLIENT_CREATED",
    entityType: "Client",
    entityId: client.id,
  });
  return client;
}

export async function findOrCreateClient(
  tx: Prisma.TransactionClient,
  organizationId: string,
  name: string,
  address: string,
) {
  const trimmed = name.trim();
  const existing = await tx.client.findFirst({
    where: { organizationId, name: trimmed },
    orderBy: { createdAt: "asc" },
  });
  if (existing) {
    if (address.trim() && address.trim() !== existing.address) {
      return tx.client.update({
        where: { id: existing.id },
        data: { address: address.trim() },
      });
    }
    return existing;
  }
  return tx.client.create({
    data: {
      organizationId,
      name: trimmed,
      address: address.trim(),
    },
  });
}
