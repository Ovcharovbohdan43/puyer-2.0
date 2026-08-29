/** Shared class names for the light dashboard chrome. */

export const dash = {
  page: "min-h-dvh bg-[#F6F7F6] text-[#111827]",
  pagePad: "flex flex-col gap-8 p-6 lg:p-10",
  title: "text-[32px] leading-10 font-semibold tracking-[-0.4px] text-[#111827]",
  subtitle: "mt-1 text-[14px] leading-5 text-[#6B7280]",
  card: "rounded-xl border border-[#E5E7EB] bg-white",
  kpi: "relative overflow-hidden flex flex-col gap-2 rounded-xl border border-[#E5E7EB] bg-white p-5",
  kpiLabel: "text-[13px] leading-5 font-medium text-[#6B7280]",
  kpiValue: "text-[28px] leading-8 font-semibold tracking-[-0.4px] text-[#111827]",
  kpiMeta: "text-[13px] leading-5 text-[#6B7280]",
  kpiMetaGood: "text-[13px] leading-5 text-[#006C49]",
  kpiMetaWarn: "text-[13px] leading-5 text-[#C2410C]",
  kpiMetaBad: "text-[13px] leading-5 text-[#DC2626]",
  iconMint: "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F5EF]",
  iconWarn: "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF4E5]",
  iconBad: "flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FEECEC]",
  input:
    "h-[38px] w-full rounded-lg border border-[#E5E7EB] bg-white py-2 pr-4 pl-10 text-[14px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#006C49]",
  btnPrimary:
    "inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-[#006C49] px-4 text-[14px] font-semibold text-white hover:brightness-110",
  btnSecondary:
    "inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] font-medium text-[#374151] hover:bg-[#F9FAFB]",
  btnOutline:
    "inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-[#006C49] px-4 text-[14px] font-semibold text-[#006C49] hover:bg-[#E8F5EF]",
  tableWrap: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
  tableHead: "bg-[#F9FAFB] text-[12px] leading-4 font-semibold text-[#6B7280]",
  row: "border-b border-[#E5E7EB] last:border-0",
  rowActive: "bg-[#E8F5EF]",
  ink: "text-[#111827]",
  muted: "text-[#6B7280]",
  paid: "text-[#006C49]",
  outstanding: "text-[#C27803]",
  link: "text-[14px] font-semibold text-[#006C49] hover:underline",
  navIdle: "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]",
  navActive: "bg-[#E8F5EF] text-[#006C49]",
} as const;

export function clientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "CL";
  }
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

export function downloadCsv(filename: string, rows: string[][]): void {
  const body = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}
