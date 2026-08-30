import "server-only";

import { logger } from "@/lib/observability/logger";
import { tryStorageAdmin } from "@/lib/storage/admin";

export const ORG_LOGO_BUCKET = "org-logos";

export function orgLogoObjectPath(organizationId: string, fileId: string): string {
  return `${organizationId}/${fileId}.png`;
}

export async function writeOrgLogo(path: string, bytes: Buffer, contentType: string): Promise<string | null> {
  const admin = tryStorageAdmin();
  if (!admin) {
    return null;
  }
  const { error } = await admin.storage.from(ORG_LOGO_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (error) {
    logger.warn("org_logo_store_failed");
    return null;
  }
  const { data } = admin.storage.from(ORG_LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
