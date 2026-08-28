import "server-only";

import type { Prisma } from "@prisma/client";

import { formatInvoiceNumber, invoiceYearFromDate } from "@/lib/invoices/numbering";

export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
  issueDate: Date,
): Promise<string> {
  await tx.$executeRaw`
    INSERT INTO "InvoiceSequence" ("organizationId", "nextNumber")
    VALUES (${organizationId}::uuid, 1)
    ON CONFLICT ("organizationId") DO NOTHING
  `;
  const rows = await tx.$queryRaw<Array<{ nextNumber: number }>>`
    SELECT "nextNumber" FROM "InvoiceSequence"
    WHERE "organizationId" = ${organizationId}::uuid
    FOR UPDATE
  `;
  const nextNumber = rows[0]?.nextNumber;
  if (!nextNumber) {
    throw new Error("Invoice sequence missing");
  }
  await tx.invoiceSequence.update({
    where: { organizationId },
    data: { nextNumber: { increment: 1 } },
  });
  return formatInvoiceNumber(invoiceYearFromDate(issueDate), nextNumber);
}
