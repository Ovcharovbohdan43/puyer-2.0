import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { SessionUser } from "@/lib/authorization";
import { requireOrganization } from "@/lib/authorization";
import { resolveTenantRecord } from "@/lib/authorization/tenant";
import { NotFoundError, ValidationError } from "@/lib/errors";

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

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function requireClientAccess(user: SessionUser, clientId: string) {
  if (!UUID.test(clientId)) {
    throw new NotFoundError();
  }
  const membership = await requireOrganization(user);
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  return { membership, client: resolveTenantRecord(client, membership.organizationId) };
}

export async function updateClient(
  user: SessionUser,
  clientId: string,
  input: { name: string; email?: string; address?: string; phone?: string; taxNumber?: string; notes?: string },
) {
  const { membership, client } = await requireClientAccess(user, clientId);
  const name = input.name.trim();
  if (!name) {
    throw new ValidationError("Enter a client name.");
  }
  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      name,
      email: input.email?.trim() ?? "",
      address: input.address?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      taxNumber: input.taxNumber?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
    },
  });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: updated.id,
  });
  return updated;
}

export async function deleteClient(user: SessionUser, clientId: string) {
  const { membership, client } = await requireClientAccess(user, clientId);
  const invoiceCount = await prisma.invoice.count({
    where: { organizationId: membership.organizationId, clientId: client.id },
  });
  if (invoiceCount > 0) {
    throw new ValidationError("This client has invoices. Delete or reassign them first.");
  }
  await prisma.client.delete({ where: { id: client.id } });
  await writeAuditLog({
    actorUserId: user.id,
    organizationId: membership.organizationId,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: client.id,
    metadata: { deleted: true },
  });
}
