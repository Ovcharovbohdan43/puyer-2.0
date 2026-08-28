import { puyerCodeBlock, puyerEmailHtml, puyerParagraph } from "@/lib/email/layout";
import type { OutboundEmail } from "@/lib/email/types";

export type AuthEmailAction =
  | "magiclink"
  | "signup"
  | "recovery"
  | "invite"
  | "email_change"
  | "email_change_new"
  | "reauthentication"
  | string;

export type AuthEmailInput = {
  to: string;
  action: AuthEmailAction;
  token: string;
  tokenHash: string;
  redirectTo: string;
  supabaseUrl: string;
  idempotencyKey: string;
};

const COPY: Record<
  string,
  { subject: string; heading: string; preview: string; lead: string; cta: string }
> = {
  magiclink: {
    subject: "Sign in to Puyer",
    heading: "Sign in to Puyer",
    preview: "Your Puyer sign-in link is ready.",
    lead: "Use the button below to open your workspace. The link expires in one hour.",
    cta: "Sign in to Puyer",
  },
  signup: {
    subject: "Confirm your Puyer account",
    heading: "Confirm your email",
    preview: "Confirm your email to start sending invoices with Puyer.",
    lead: "Confirm this email to create your Puyer account and start invoicing.",
    cta: "Confirm email",
  },
  recovery: {
    subject: "Reset your Puyer password",
    heading: "Reset your password",
    preview: "Reset your Puyer password with this link.",
    lead: "We received a request to reset the password for this Puyer account.",
    cta: "Reset password",
  },
  invite: {
    subject: "Join a workspace on Puyer",
    heading: "You’re invited to Puyer",
    preview: "Accept your invitation to a Puyer workspace.",
    lead: "Someone invited you to a Puyer workspace. Accept to join.",
    cta: "Accept invitation",
  },
  email_change: {
    subject: "Confirm your new Puyer email",
    heading: "Confirm your new email",
    preview: "Confirm the new email address for your Puyer account.",
    lead: "Confirm this address to finish changing the email on your Puyer account.",
    cta: "Confirm new email",
  },
  email_change_new: {
    subject: "Confirm your new Puyer email",
    heading: "Confirm your new email",
    preview: "Confirm the new email address for your Puyer account.",
    lead: "Confirm this address to finish changing the email on your Puyer account.",
    cta: "Confirm new email",
  },
  reauthentication: {
    subject: "Your Puyer verification code",
    heading: "Verification code",
    preview: "Your Puyer verification code.",
    lead: "Use this code to confirm a sensitive change on your Puyer account.",
    cta: "Open Puyer",
  },
};

export function authVerifyUrl(input: {
  supabaseUrl: string;
  tokenHash: string;
  action: string;
  redirectTo: string;
}): string {
  const base = input.supabaseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    token: input.tokenHash,
    type: input.action,
    redirect_to: input.redirectTo,
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

export function authEmailMessage(input: AuthEmailInput): OutboundEmail {
  const copy = COPY[input.action] ?? COPY.magiclink;
  const verifyUrl = authVerifyUrl({
    supabaseUrl: input.supabaseUrl,
    tokenHash: input.tokenHash,
    action: input.action,
    redirectTo: input.redirectTo,
  });
  const bodyHtml =
    puyerParagraph(copy.lead) +
    (input.token ? puyerParagraph("Or enter this one-time code:") + puyerCodeBlock(input.token) : "") +
    puyerParagraph("If you did not request this, you can ignore this email.");

  return {
    to: input.to,
    subject: copy.subject,
    text: [
      copy.heading,
      copy.lead,
      verifyUrl,
      input.token ? `Code: ${input.token}` : "",
      "If you did not request this, you can ignore this email.",
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: puyerEmailHtml({
      preview: copy.preview,
      heading: copy.heading,
      bodyHtml,
      ctaLabel: copy.cta,
      ctaUrl: verifyUrl,
      footnote: "This link expires in about one hour.",
    }),
    idempotencyKey: input.idempotencyKey,
  };
}
