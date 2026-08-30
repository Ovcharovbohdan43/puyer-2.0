"use client";

import { useMemo, useState } from "react";

import { PeriodRangeFields } from "@/components/dashboard/period-range";
import { dash, downloadCsv } from "@/lib/dashboard/chrome";
import { exportFilename } from "@/lib/exports/csv";
import { defaultUtcMonthRange, filterByIsoDate, orderedIsoRange } from "@/lib/exports/period";
import { periodReportRows } from "@/lib/exports/tables";
import { t } from "@/lib/i18n";
import type { InvoiceListRow } from "@/lib/invoices/list-view";

export function ReportsPeriodExport({ invoices }: { invoices: InvoiceListRow[] }) {
  const copy = t("reports");
  const dashCopy = t("dashboard");
  const initial = defaultUtcMonthRange();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const range = orderedIsoRange(from, to);
  const inPeriod = useMemo(
    () => filterByIsoDate(invoices, (invoice) => invoice.date, range.from, range.to),
    [invoices, range.from, range.to],
  );

  return (
    <div className="flex flex-col items-stretch gap-3 lg:items-end">
      <PeriodRangeFields
        from={from}
        to={to}
        fromLabel={dashCopy.periodFrom}
        toLabel={dashCopy.periodTo}
        onFrom={setFrom}
        onTo={setTo}
      />
      <p className="max-w-sm text-right text-[13px] text-[#6B7280]">{copy.periodHint}</p>
      <button
        type="button"
        className={dash.btnOutline}
        onClick={() =>
          downloadCsv(
            exportFilename("puyer-report", range.from, range.to),
            periodReportRows(inPeriod, range.from, range.to, {
              period: copy.exportPeriod,
              currency: copy.colCurrency,
              issued: copy.exportIssued,
              paid: copy.kpiRevenue,
              outstanding: copy.kpiOutstanding,
              overdue: copy.kpiOverdue,
              invoices: {
                invoice: dashCopy.colInvoice,
                client: dashCopy.colClient,
                date: dashCopy.colDate,
                due: dashCopy.colDueDate,
                amount: dashCopy.colAmount,
                currency: copy.colCurrency,
                status: dashCopy.colStatus,
              },
            }),
          )
        }
      >
        {copy.downloadReport}
      </button>
    </div>
  );
}
