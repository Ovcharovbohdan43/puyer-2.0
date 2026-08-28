"use client";

import { useMemo, useState } from "react";

import { SelectMenu } from "@/components/ui/select-menu";
import { CURRENCIES, type Currency } from "@/lib/invoices/currencies";
import { t } from "@/lib/i18n";

type CurrencySelectProps = {
  value: string;
  onRequestChange: (next: Currency) => void;
};

export function CurrencySelect({ value, onRequestChange }: CurrencySelectProps) {
  const copy = t("builder");
  const [query, setQuery] = useState("");
  const selected = CURRENCIES.find((item) => item.code === value) ?? CURRENCIES[0];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return CURRENCIES;
    }
    return CURRENCIES.filter(
      (item) =>
        item.code.toLowerCase().includes(needle) ||
        item.name.toLowerCase().includes(needle) ||
        item.symbol.toLowerCase().includes(needle),
    );
  }, [query]);

  return (
    <SelectMenu
      valueLabel={`${selected.code} (${selected.symbol})`}
      ariaLabel={`${selected.code} ${selected.name}`}
      closeLabel={copy.closeList}
    >
      {(close) => (
        <>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchCurrency}
            className="mb-2 w-full rounded border border-[#e2e8f0] px-2 py-1 text-[14px] outline-none focus:border-[#0b1c30]"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setQuery("");
                close();
              }
            }}
          />
          <ul role="listbox" className="max-h-56 overflow-y-auto">
            {filtered.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-[14px] hover:bg-[#eff4ff]"
                  onClick={() => {
                    onRequestChange(item);
                    setQuery("");
                    close();
                  }}
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{item.code}</span>
                    <span className="text-[#45464d]"> · {item.name}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-[#0b1c30]">{item.symbol}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-2 py-2 text-[14px] text-[#45464d]">{copy.noCurrency}</li>
            ) : null}
          </ul>
        </>
      )}
    </SelectMenu>
  );
}
