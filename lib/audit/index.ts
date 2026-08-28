import "server-only";

import type { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/observability/logger";

export async function writeAuditLog(input: {
  actorUserId?: string | null;
  organizationId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        organizationId: input.organizationId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    logger.error("audit_write_failed", { action: input.action });
    void error;
  }
}
