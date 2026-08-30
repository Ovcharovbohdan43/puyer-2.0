import { NextResponse } from "next/server";

import { requireOrganization } from "@/lib/authorization";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { requireRateLimit } from "@/lib/rate-limit/consume";
import { orgLogoObjectPath, writeOrgLogo } from "@/lib/storage/org-logo";
import { MAX_LOGO_BYTES, validateLogoUpload } from "@/lib/uploads/validate";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    const membership = await requireOrganization(user);
    await requireRateLimit("logo-upload", user.id);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Choose a JPEG, PNG, or WebP image.");
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new ValidationError("Image must be 2 MB or smaller.");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const checked = validateLogoUpload({
      mime: file.type || "application/octet-stream",
      size: file.size,
      fileName: file.name || "logo.png",
      bytes,
    });
    const path = orgLogoObjectPath(membership.organizationId, crypto.randomUUID());
    const publicUrl = await writeOrgLogo(path, Buffer.from(bytes), checked.mime);
    if (!publicUrl) {
      throw new ValidationError("Logo storage is not configured.");
    }

    await prisma.businessProfile.upsert({
      where: { organizationId: membership.organizationId },
      create: {
        organizationId: membership.organizationId,
        logoUrl: publicUrl,
      },
      update: { logoUrl: publicUrl },
    });

    return NextResponse.json({ ok: true, url: publicUrl });
  }, request);
}
