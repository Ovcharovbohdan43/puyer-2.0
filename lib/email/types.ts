export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export type OutboundEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

export type EmailSendResult = {
  skipped: boolean;
  providerMessageId: string | null;
};
