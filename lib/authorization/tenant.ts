import { NotFoundError } from "@/lib/errors";

export function resolveTenantRecord<T extends { organizationId: string }>(
  record: T | null | undefined,
  organizationId: string,
): T {
  if (!record || record.organizationId !== organizationId) {
    throw new NotFoundError();
  }
  return record;
}
