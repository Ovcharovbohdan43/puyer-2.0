import { clipBanReason } from "@/lib/moderation/status";

export type BanNoticeInput = {
  recipientName: string;
  kind: "TEMPORARY" | "PERMANENT";
  reason: string;
  endsAt: Date | null;
  helpUrl: string;
  supportEmail: string;
};

function formatEndsAt(endsAt: Date | null): string {
  if (!endsAt) {
    return "";
  }
  return endsAt.toISOString().slice(0, 10);
}

export function banNoticeSubject(kind: "TEMPORARY" | "PERMANENT"): string {
  return kind === "PERMANENT"
    ? "Official notice: your Puyer account is permanently restricted"
    : "Official notice: your Puyer account is temporarily restricted";
}

export function banNoticeText(input: BanNoticeInput): string {
  const reason = clipBanReason(input.reason);
  const name = input.recipientName.trim() || "there";
  const lines = [
    `Hi ${name},`,
    "",
    "This is an official notice from Puyer.",
    input.kind === "PERMANENT"
      ? "Your account or workspace has been permanently restricted."
      : `Your account or workspace has been temporarily restricted until ${formatEndsAt(input.endsAt)}.`,
    "",
    `Reason: ${reason}`,
    "",
    "What you can do next:",
    `- If you believe this is a mistake, email ${input.supportEmail} from this address and include the reason above.`,
    `- You can also open a request at ${input.helpUrl}.`,
    "- Do not create another Puyer account to avoid this restriction.",
    input.kind === "TEMPORARY"
      ? "- When the restriction ends, sign in again with the same email. Access is restored automatically; you do not need a new account."
      : "- A permanent restriction stays in place until Puyer reviews an appeal and lifts it.",
    "",
    "Puyer Trust & Safety",
  ];
  return lines.join("\n");
}

export function banNoticeParagraphs(input: BanNoticeInput): string[] {
  return banNoticeText(input)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
