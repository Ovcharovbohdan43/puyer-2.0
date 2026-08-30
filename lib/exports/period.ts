const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function utcIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function defaultUtcMonthRange(now = new Date()): { from: string; to: string } {
  const from = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  return { from, to: utcIsoDate(now) };
}

export function orderedIsoRange(from: string, to: string): { from: string; to: string } {
  if (from && to && from > to) {
    return { from: to, to: from };
  }
  return { from, to };
}

export function inInclusiveIsoRange(iso: string, from: string, to: string): boolean {
  if (!isIsoDate(iso)) {
    return false;
  }
  const range = orderedIsoRange(from, to);
  if (range.from && iso < range.from) {
    return false;
  }
  if (range.to && iso > range.to) {
    return false;
  }
  return true;
}

export function filterByIsoDate<T>(rows: readonly T[], getDate: (row: T) => string, from: string, to: string): T[] {
  if (!from && !to) {
    return [...rows];
  }
  return rows.filter((row) => inInclusiveIsoRange(getDate(row), from, to));
}
