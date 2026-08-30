/** UTF-8 CSV with a BOM so Excel opens currency symbols correctly. */

const BOM = "\uFEFF";

export function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function toCsv(rows: string[][]): string {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  return `${BOM}${body}`;
}

export function exportFilename(base: string, from?: string, to?: string, now = new Date()): string {
  const safe = base
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
  if (from && to) {
    return `${safe}-${from}-${to}.csv`;
  }
  const stamp = now.toISOString().slice(0, 10);
  return `${safe}-${stamp}.csv`;
}
