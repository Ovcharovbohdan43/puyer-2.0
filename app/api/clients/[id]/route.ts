import { NextResponse } from "next/server";

import { deleteClient, updateClient } from "@/lib/clients/persist";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

type ClientBody = {
  name?: unknown;
  email?: unknown;
  address?: unknown;
  phone?: unknown;
  taxNumber?: unknown;
  notes?: unknown;
};

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("client-write", user.id);
    const { id } = await context.params;
    let body: ClientBody;
    try {
      body = (await request.json()) as ClientBody;
    } catch {
      throw new ValidationError("Enter a client name.");
    }
    const client = await updateClient(user, id, {
      name: stringField(body.name),
      email: stringField(body.email),
      address: stringField(body.address),
      phone: stringField(body.phone),
      taxNumber: stringField(body.taxNumber),
      notes: stringField(body.notes),
    });
    return NextResponse.json({ ok: true, client });
  }, request);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("client-write", user.id);
    const { id } = await context.params;
    await deleteClient(user, id);
    return NextResponse.json({ ok: true });
  }, request);
}
