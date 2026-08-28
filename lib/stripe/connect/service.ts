import "server-only";

import type { StripeConnectionStatus } from "@prisma/client";

import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db/prisma";
import { StripeConnectionError } from "@/lib/errors";
import { appBaseUrl, getStripe } from "@/lib/stripe/client";
import {
  buildAccountOnboardingLinkParams,
  buildConnectedAccountCreateParams,
  buildDirectChargeCheckout,
} from "@/lib/stripe/connect/params";
import { mapV1AccountToConnection, mapV2AccountToConnection } from "@/lib/stripe/connect/status";
import { assertSafeDirectChargePayload } from "@/lib/stripe/forbidden";

export async function createConnectedAccount(input: {
  organizationId: string;
  email: string;
  displayName: string;
  currency: string;
  country: string;
  actorUserId: string;
}) {
  const existing = await prisma.stripeConnection.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (existing?.stripeConnectedAccountId) {
    if (existing.status === "DISCONNECTED") {
      return prisma.stripeConnection.update({
        where: { organizationId: input.organizationId },
        data: { status: "CONNECTING" },
      });
    }
    return existing;
  }

  const stripe = getStripe();
  const account = await stripe.v2.core.accounts.create(
    buildConnectedAccountCreateParams({
      email: input.email,
      displayName: input.displayName,
      currency: input.currency,
      country: input.country,
    }),
  );

  const connection = await prisma.stripeConnection.upsert({
    where: { organizationId: input.organizationId },
    create: {
      organizationId: input.organizationId,
      stripeConnectedAccountId: account.id,
      status: "CONNECTING",
    },
    update: {
      stripeConnectedAccountId: account.id,
      status: "CONNECTING",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
    },
  });

  await writeAuditLog({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "STRIPE_CONNECTED",
    entityType: "StripeConnection",
    entityId: connection.id,
  });

  return connection;
}

export async function createOnboardingLink(organizationId: string) {
  const connection = await prisma.stripeConnection.findUnique({
    where: { organizationId },
  });
  if (!connection?.stripeConnectedAccountId) {
    throw new StripeConnectionError("Connect Stripe first.");
  }
  const stripe = getStripe();
  const base = appBaseUrl();
  const link = await stripe.v2.core.accountLinks.create(
    buildAccountOnboardingLinkParams({
      accountId: connection.stripeConnectedAccountId,
      returnUrl: `${base}/settings?stripe=return`,
      refreshUrl: `${base}/settings?stripe=refresh`,
    }),
  );
  if (!link.url) {
    throw new StripeConnectionError();
  }
  return link.url;
}

export async function refreshConnectionStatus(organizationId: string) {
  const connection = await prisma.stripeConnection.findUnique({
    where: { organizationId },
  });
  if (!connection || connection.status === "DISCONNECTED") {
    return connection;
  }
  const snapshot = await retrieveConnectionSnapshot(connection.stripeConnectedAccountId);
  return prisma.stripeConnection.update({
    where: { organizationId },
    data: {
      status: snapshot.status,
      chargesEnabled: snapshot.chargesEnabled,
      payoutsEnabled: snapshot.payoutsEnabled,
      detailsSubmitted: snapshot.detailsSubmitted,
      lastAccountUpdatedAt: new Date(),
    },
  });
}

export async function retrieveConnectionSnapshot(accountId: string) {
  const stripe = getStripe();
  try {
    const account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.merchant", "identity", "requirements"],
    });
    return mapV2AccountToConnection(account);
  } catch {
    const account = await stripe.accounts.retrieve(accountId);
    return mapV1AccountToConnection(account);
  }
}

export async function createInvoiceCheckout(input: {
  connectedAccountId: string;
  invoiceId: string;
  publicId: string;
  invoiceNumber: string;
  currency: string;
  totalMinor: bigint;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  if (!input.connectedAccountId) {
    throw new StripeConnectionError();
  }
  const { params, requestOptions } = buildDirectChargeCheckout(input);
  assertSafeDirectChargePayload(params, requestOptions);
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create(params, requestOptions);
  if (!session.url) {
    throw new StripeConnectionError("Checkout is unavailable.");
  }
  return session;
}

export async function disconnectAccount(input: {
  organizationId: string;
  actorUserId: string;
}): Promise<{ status: StripeConnectionStatus }> {
  const connection = await prisma.stripeConnection.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (!connection) {
    return { status: "NOT_CONNECTED" };
  }
  const updated = await prisma.stripeConnection.update({
    where: { organizationId: input.organizationId },
    data: {
      status: "DISCONNECTED",
      chargesEnabled: false,
      payoutsEnabled: false,
    },
  });
  await writeAuditLog({
    actorUserId: input.actorUserId,
    organizationId: input.organizationId,
    action: "STRIPE_DISCONNECTED",
    entityType: "StripeConnection",
    entityId: updated.id,
  });
  return { status: updated.status };
}
