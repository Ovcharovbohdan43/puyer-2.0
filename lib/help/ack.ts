import { t } from "@/lib/i18n";
import type { HelpTopic } from "@/lib/help/input";

export function helpTopicLabel(topic: HelpTopic): string {
  return t("help").topics[topic];
}

export function helpCenterUrl(): string {
  const origin = (process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://puyer.org").replace(/\/$/, "");
  return `${origin}/help`;
}

export function helpAckText(input: {
  name: string;
  requestId: string;
  topic: HelpTopic;
}): string {
  const greeting = input.name.trim() || "there";
  const topic = helpTopicLabel(input.topic);
  const helpUrl = helpCenterUrl();
  return [
    `Hi ${greeting},`,
    "",
    "Thanks for writing in. We received your help request and our team has a copy of it.",
    "",
    `Reference: ${input.requestId}`,
    `Topic: ${topic}`,
    "",
    "What happens next:",
    "- We will reply to this email, usually within one business day.",
    "- If you have more detail, reply to this message. You do not need to submit the form again.",
    "- Guides stay available in the Help Center while you wait.",
    "",
    `Help Center: ${helpUrl}`,
    "",
    "— Puyer Help",
  ].join("\n");
}

export function helpAckHtmlParagraphs(input: {
  name: string;
  requestId: string;
  topic: HelpTopic;
}): string[] {
  const greeting = input.name.trim() || "there";
  const topic = helpTopicLabel(input.topic);
  return [
    `Hi ${greeting},`,
    "Thanks for writing in. We received your help request and our team has a copy of it.",
    `Reference: ${input.requestId}`,
    `Topic: ${topic}`,
    "We will reply to this email, usually within one business day. If you have more detail, reply here — you do not need to submit the form again.",
    "You can keep using Puyer and the Help Center while you wait.",
  ];
}
