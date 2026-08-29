import { ValidationError } from "@/lib/errors";
import { isValidEmail } from "@/lib/invoices/validate";

export const HELP_TOPICS = ["ACCOUNT", "BILLING", "PAYMENTS", "INVOICES", "TEAM", "OTHER"] as const;
export type HelpTopic = (typeof HELP_TOPICS)[number];

export const MAX_HELP_MESSAGE = 4000;
export const MAX_HELP_NAME = 120;

export function sanitizeHelpText(raw: string, max: number): string {
  const normalized = raw.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const cleaned = [...normalized]
    .filter((char) => char === "\n" || char === "\t" || char >= " ")
    .join("");
  return cleaned.trim().slice(0, max);
}

function isHelpTopic(value: string): value is HelpTopic {
  return (HELP_TOPICS as readonly string[]).includes(value);
}

export function parseHelpContact(body: unknown): {
  name: string;
  email: string;
  topic: HelpTopic;
  message: string;
} {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const name = sanitizeHelpText(typeof record.name === "string" ? record.name : "", MAX_HELP_NAME);
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const topicRaw = typeof record.topic === "string" ? record.topic.trim().toUpperCase() : "";
  const message = sanitizeHelpText(typeof record.message === "string" ? record.message : "", MAX_HELP_MESSAGE);

  if (name.length < 2) {
    throw new ValidationError("Enter your name.");
  }
  if (!isValidEmail(email)) {
    throw new ValidationError("Enter a valid email address.");
  }
  if (!isHelpTopic(topicRaw)) {
    throw new ValidationError("Choose a topic.");
  }
  if (message.length < 10) {
    throw new ValidationError("Tell us a bit more so we can help.");
  }

  return { name, email, topic: topicRaw, message };
}
