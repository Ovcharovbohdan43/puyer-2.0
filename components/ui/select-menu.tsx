"use client";

import { useEffect, useState } from "react";

import { FigmaIcon } from "@/components/marketing/figma-icon";

type SelectMenuProps = {
  valueLabel: string;
  ariaLabel?: string;
  closeLabel: string;
  children: (close: () => void) => React.ReactNode;
};

export function SelectMenu({ valueLabel, ariaLabel, closeLabel, children }: SelectMenuProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`relative min-w-0 w-full ${open ? "z-30" : ""}`}>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default"
          aria-label={closeLabel}
          onClick={close}
        />
      ) : null}
      <button
        type="button"
        className="relative z-20 flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded border border-[#e2e8f0] bg-white px-[9px] text-left text-[16px] leading-none text-[#0b1c30] outline-none focus-visible:border-[#0b1c30]"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? valueLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{valueLabel}</span>
        <span className={`shrink-0 ${open ? "rotate-180" : ""}`}>
          <FigmaIcon src="/landing/chevron.svg" alt="" width={16} height={16} />
        </span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded border border-[#e2e8f0] bg-white p-2 shadow-lg">
          {children(close)}
        </div>
      ) : null}
    </div>
  );
}

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type SimpleSelectProps<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  closeLabel: string;
  ariaLabel?: string;
};

export function SimpleSelect<T extends string>({
  value,
  options,
  onChange,
  closeLabel,
  ariaLabel,
}: SimpleSelectProps<T>) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <SelectMenu valueLabel={selected.label} ariaLabel={ariaLabel} closeLabel={closeLabel}>
      {(close) => (
        <ul role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`flex w-full px-2 py-2 text-left text-[14px] hover:bg-[#eff4ff] ${
                  option.value === value ? "font-semibold" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </SelectMenu>
  );
}
