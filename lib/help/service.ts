import "server-only";

import type { SessionUser } from "@/lib/authorization";
import { prisma } from "@/lib/db/prisma";
import { sendHelpAckEmail, sendHelpInboxEmail } from "@/lib/email";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";
import type { HelpTopic } from "@/lib/help/input";

export type SupportTicketRow = {
  id: string;
  topic: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  message: string;
};

export async function listMySupportRequests(user: SessionUser): Promise<SupportTicketRow[]> {
  try {
    const rows = await prisma.supportRequest.findMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        topic: true,
        status: true,
        createdAt: true,
        message: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      topic: row.topic,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      message: row.message,
    }));
  } catch (error) {
    logger.warn("help_tickets_unavailable", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return [];
  }
}

export async function submitHelpRequest(input: {
  name: string;
  email: string;
  topic: HelpTopic;
  message: string;
  userId?: string;
  organizationId?: string;
}): Promise<{ id: string }> {
  const created = await prisma.supportRequest.create({
    data: {
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      userId: input.userId,
      organizationId: input.organizationId,
    },
    select: { id: true },
  });

  logger.info("help_request_created", { topic: input.topic });

  try {
    const inbox = await sendHelpInboxEmail({
      requestId: created.id,
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      signedIn: Boolean(input.userId),
    });
    if (inbox.skipped) {
      logger.warn("help_inbox_email_skipped");
      throw new ValidationError("Your request could not be sent. Email delivery is not configured.");
    }
    const ack = await sendHelpAckEmail({
      requestId: created.id,
      name: input.name,
      email: input.email,
      topic: input.topic,
    });
    if (ack.skipped) {
      logger.warn("help_ack_email_skipped");
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("help_email_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    throw new ValidationError("Your request could not be sent. Try again in a moment.");
  }

  return { id: created.id };
}
