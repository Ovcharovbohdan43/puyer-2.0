export function formatInvoiceDate(iso: string, locale = "en-US"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return iso;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}
