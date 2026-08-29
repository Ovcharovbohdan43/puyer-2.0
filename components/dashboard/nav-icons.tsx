"use client";

import type { Icon } from "@phosphor-icons/react";
import { BellIcon } from "@phosphor-icons/react/dist/csr/Bell";
import { ChartLineUpIcon } from "@phosphor-icons/react/dist/csr/ChartLineUp";
import { CreditCardIcon } from "@phosphor-icons/react/dist/csr/CreditCard";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/csr/DotsThree";
import { GearIcon } from "@phosphor-icons/react/dist/csr/Gear";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { PlusIcon } from "@phosphor-icons/react/dist/csr/Plus";
import { ReceiptIcon } from "@phosphor-icons/react/dist/csr/Receipt";
import { SignOutIcon } from "@phosphor-icons/react/dist/csr/SignOut";
import { UsersIcon } from "@phosphor-icons/react/dist/csr/Users";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/csr/UsersThree";
import { WalletIcon } from "@phosphor-icons/react/dist/csr/Wallet";

export type AppNavIconId =
  | "overview"
  | "clients"
  | "invoices"
  | "payments"
  | "reports"
  | "settings"
  | "team"
  | "notifications"
  | "billing"
  | "more"
  | "plus"
  | "signOut";

const ICONS: Record<AppNavIconId, Icon> = {
  overview: HouseIcon,
  clients: UsersIcon,
  invoices: ReceiptIcon,
  payments: CreditCardIcon,
  reports: ChartLineUpIcon,
  settings: GearIcon,
  team: UsersThreeIcon,
  notifications: BellIcon,
  billing: WalletIcon,
  more: DotsThreeIcon,
  plus: PlusIcon,
  signOut: SignOutIcon,
};

export function AppNavIcon({
  id,
  active = false,
  onDark = false,
  size = 20,
}: {
  id: AppNavIconId;
  active?: boolean;
  onDark?: boolean;
  size?: number;
}) {
  const Glyph = ICONS[id];
  const color = onDark ? "#ffffff" : "currentColor";
  return (
    <Glyph
      size={size}
      weight={onDark ? "bold" : active ? "fill" : "duotone"}
      color={color}
      className="shrink-0"
      aria-hidden
    />
  );
}
