import "server-only";

import type { OrgRole } from "@prisma/client";

import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { createServerSupabaseClient } from "@/lib/auth/server";
import { hasOrgRole } from "@/lib/authorization/roles";
import { ensureWorkspace } from "@/lib/identity/provision";

export type SessionUser = {
  id: string;
  email: string;
};

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionOrNull();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

export async function getSessionOrNull(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return null;
  }
  const id = typeof data.claims.sub === "string" ? data.claims.sub : "";
  const email = typeof data.claims.email === "string" ? data.claims.email : "";
  if (!id || !email) {
    return null;
  }
  return { id, email };
}

export async function requireOrganization(user: SessionUser) {
  return ensureWorkspace(user);
}

export async function requireOrgRole(user: SessionUser, organizationId: string, allowed: OrgRole[]) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId,
      },
    },
    include: { organization: true },
  });
  if (!membership || !hasOrgRole(membership.role, allowed)) {
    throw new ForbiddenError();
  }
  return membership;
}
