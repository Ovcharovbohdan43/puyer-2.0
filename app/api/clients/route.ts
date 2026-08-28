import { NextResponse } from "next/server";

import { createClient, listClients } from "@/lib/clients/persist";
import { handleRoute, requireApiSession } from "@/lib/http/route";
import { ValidationError } from "@/lib/errors";
import { requireRateLimit } from "@/lib/rate-limit/consume";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("api-read", user.id);
    const clients = await listClients(user);
    return NextResponse.json({ ok: true, clients });
  }, request);
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireApiSession();
    await requireRateLimit("client-write", user.id);
    let body: { name?: unknown; email?: unknown; address?: unknown };
    try {
      body = (await request.json()) as { name?: unknown; email?: unknown; address?: unknown };
    } catch {
      throw new ValidationError("Enter a client name.");
    }
    const name = typeof body.name === "string" ? body.name : "";
    const client = await createClient(user, {
      name,
      email: typeof body.email === "string" ? body.email : "",
      address: typeof body.address === "string" ? body.address : "",
    });
    return NextResponse.json({ ok: true, client }, { status: 201 });
  }, request);
}
