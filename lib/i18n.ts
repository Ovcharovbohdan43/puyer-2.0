import en from "@/messages/en.json";

type MessageDict = typeof en;

export const messages: MessageDict = en;

export function t<K extends keyof MessageDict>(section: K): MessageDict[K] {
  return messages[section];
}
