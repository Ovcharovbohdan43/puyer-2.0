import type { Plan, SubscriptionStatus } from "@prisma/client";

export type BillingNoticeKind =
  | "activated"
  | "plan_changed"
  | "cancel_scheduled"
  | "canceled"
  | "payment_failed";

export type BillingSnapshot = {
  plan: Plan;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
};

const PAID: Plan[] = ["PRO", "BUSINESS"];
const LIVE: SubscriptionStatus[] = ["ACTIVE", "TRIALING"];
const ENDED: SubscriptionStatus[] = ["CANCELED", "UNPAID", "INCOMPLETE_EXPIRED"];

function isPaid(plan: Plan): boolean {
  return PAID.includes(plan);
}

function isLive(status: SubscriptionStatus): boolean {
  return LIVE.includes(status);
}

function isEnded(status: SubscriptionStatus): boolean {
  return ENDED.includes(status);
}

export function planDisplayName(plan: Plan): string {
  if (plan === "PRO") {
    return "Pro";
  }
  if (plan === "BUSINESS") {
    return "Business";
  }
  return "Free";
}

export function billingNoticeKind(prev: BillingSnapshot | null, next: BillingSnapshot): BillingNoticeKind | null {
  if (next.status === "PAST_DUE" && prev?.status !== "PAST_DUE") {
    return "payment_failed";
  }
  if (isEnded(next.status) && (!prev || !isEnded(prev.status))) {
    return "canceled";
  }
  if (next.cancelAtPeriodEnd && !prev?.cancelAtPeriodEnd && isPaid(next.plan) && isLive(next.status)) {
    return "cancel_scheduled";
  }
  if (isPaid(next.plan) && isLive(next.status)) {
    const wasLivePaid = Boolean(prev && isPaid(prev.plan) && isLive(prev.status));
    if (!wasLivePaid) {
      return "activated";
    }
    if (prev && prev.plan !== next.plan) {
      return "plan_changed";
    }
  }
  return null;
}

export function billingNoticeCopy(input: {
  kind: BillingNoticeKind;
  plan: Plan;
  previousPlan?: Plan;
  recipientName: string;
  workspaceName: string;
  billingUrl: string;
  supportEmail: string;
}): { subject: string; heading: string; preview: string; paragraphs: string[]; ctaLabel: string; ctaUrl: string } {
  const name = input.recipientName.trim() || "there";
  const plan = planDisplayName(input.plan);
  const workspace = input.workspaceName.trim() || "your workspace";
  const previous = input.previousPlan ? planDisplayName(input.previousPlan) : "Free";
  switch (input.kind) {
    case "activated":
      return {
        subject: `Your Puyer ${plan} subscription is active`,
        heading: `Puyer ${plan} is on`,
        preview: `${workspace} now has Puyer ${plan}.`,
        paragraphs: [
          `Hi ${name},`,
          `${workspace} is now on Puyer ${plan}. Stripe Connect, reminders, and the rest of that plan are available in the dashboard.`,
          `Manage billing any time from Puyer. Questions: ${input.supportEmail}.`,
        ],
        ctaLabel: "Open billing",
        ctaUrl: input.billingUrl,
      };
    case "plan_changed":
      return {
        subject: `Your Puyer plan changed to ${plan}`,
        heading: `You’re on Puyer ${plan}`,
        preview: `${workspace} moved from ${previous} to ${plan}.`,
        paragraphs: [
          `Hi ${name},`,
          `${workspace} moved from Puyer ${previous} to Puyer ${plan}.`,
          `Open billing to review the subscription. Questions: ${input.supportEmail}.`,
        ],
        ctaLabel: "Open billing",
        ctaUrl: input.billingUrl,
      };
    case "cancel_scheduled":
      return {
        subject: `Your Puyer ${plan} subscription will end at the period close`,
        heading: "Cancellation scheduled",
        preview: `${workspace} stays on ${plan} until the current period ends.`,
        paragraphs: [
          `Hi ${name},`,
          `Cancellation is scheduled for ${workspace}. You keep Puyer ${plan} until the current billing period ends, then the workspace returns to Free.`,
          `You can resume from billing before then. Questions: ${input.supportEmail}.`,
        ],
        ctaLabel: "Open billing",
        ctaUrl: input.billingUrl,
      };
    case "canceled":
      return {
        subject: "Your Puyer subscription has ended",
        heading: "Subscription ended",
        preview: `${workspace} is back on the Free plan.`,
        paragraphs: [
          `Hi ${name},`,
          `The Puyer subscription for ${workspace} has ended. The workspace is on Free. Paid features such as Stripe invoice payments and automatic reminders are off until you subscribe again.`,
          `Questions: ${input.supportEmail}.`,
        ],
        ctaLabel: "View plans",
        ctaUrl: input.billingUrl,
      };
    case "payment_failed":
      return {
        subject: `We could not renew Puyer ${plan}`,
        heading: "Payment failed",
        preview: `Update the card for ${workspace} to keep ${plan}.`,
        paragraphs: [
          `Hi ${name},`,
          `Stripe could not collect the latest payment for ${workspace} on Puyer ${plan}. Update the payment method to keep the plan. After a short grace period the workspace may return to Free.`,
          `Questions: ${input.supportEmail}.`,
        ],
        ctaLabel: "Update billing",
        ctaUrl: input.billingUrl,
      };
  }
}

export function passwordChangedCopy(input: {
  recipientName: string;
  settingsUrl: string;
  supportEmail: string;
}): { subject: string; heading: string; preview: string; paragraphs: string[]; ctaLabel: string; ctaUrl: string } {
  const name = input.recipientName.trim() || "there";
  return {
    subject: "Your Puyer password was changed",
    heading: "Password updated",
    preview: "The password on your Puyer account was changed.",
    paragraphs: [
      `Hi ${name},`,
      "The password for this Puyer account was just changed. You can still sign in with an email link.",
      `If you did not do this, contact ${input.supportEmail} from this address and reset the password from Settings.`,
    ],
    ctaLabel: "Open Settings",
    ctaUrl: input.settingsUrl,
  };
}

export function emailChangeRequestedCopy(input: {
  recipientName: string;
  newEmail: string;
  settingsUrl: string;
  supportEmail: string;
}): { subject: string; heading: string; preview: string; paragraphs: string[]; ctaLabel: string; ctaUrl: string } {
  const name = input.recipientName.trim() || "there";
  return {
    subject: "A Puyer email change was requested",
    heading: "Email change requested",
    preview: "Someone asked to change the sign-in email on this Puyer account.",
    paragraphs: [
      `Hi ${name},`,
      `Someone requested moving this Puyer account to ${input.newEmail}. That inbox will get a confirmation link. This address stays active until the new one is confirmed.`,
      `If you did not request this, contact ${input.supportEmail} from this address.`,
    ],
    ctaLabel: "Open Settings",
    ctaUrl: input.settingsUrl,
  };
}
