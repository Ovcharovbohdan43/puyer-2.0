import type { Icon } from "@phosphor-icons/react";
import { LockSimpleIcon } from "@phosphor-icons/react/dist/ssr/LockSimple";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { ShieldIcon } from "@phosphor-icons/react/dist/ssr/Shield";

type TrustCopy = {
  stripe: string;
  gdpr: string;
  data: string;
};

type TrustItem = {
  label: string;
  Icon: Icon;
};

export function TrustBar({ trust }: { trust: TrustCopy }) {
  const items: TrustItem[] = [
    { label: trust.stripe, Icon: LockSimpleIcon },
    { label: trust.gdpr, Icon: ShieldIcon },
    { label: trust.data, Icon: ShieldCheckIcon },
  ];

  return (
    <section id="trust" className="trust-bar w-full px-5 py-8 sm:px-10">
      <ul className="mx-auto flex w-full max-w-[1280px] list-none flex-col items-center justify-center gap-3 p-0 sm:flex-row sm:flex-wrap sm:gap-4">
        {items.map((item) => (
          <li key={item.label} className="trust-chip flex items-center gap-2.5">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[#6cf8bb]/15">
              <item.Icon size={18} weight="duotone" color="#6cf8bb" aria-hidden />
            </span>
            <p className="text-[14px] font-medium leading-5 tracking-[0.01em] text-white">{item.label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
