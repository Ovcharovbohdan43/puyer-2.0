"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PuyerBusyText, PuyerSpinner } from "@/components/brand/puyer-spinner";
import { useBuilderSession } from "@/components/invoice-builder/builder-session";
import { CurrencySelect } from "@/components/invoice-builder/currency-select";
import { InvoicePreview } from "@/components/invoice-builder/invoice-preview";
import { LogoEditor } from "@/components/invoice-builder/logo-editor";
import { ACCENT_COLORS, type InvoiceTemplate, type PaymentChannel } from "@/components/invoice-builder/types";
import { FigmaIcon } from "@/components/marketing/figma-icon";
import { Modal } from "@/components/ui/modal";
import { SimpleSelect } from "@/components/ui/select-menu";
import { useToast } from "@/components/ui/toast";
import { totalsForInvoice, type DiscountType } from "@/lib/invoices/calculate";
import { getCurrency, type Currency } from "@/lib/invoices/currencies";
import { formatMoney } from "@/lib/invoices/money";
import { hasBankTransfer } from "@/lib/invoices/bank-transfer";
import { hasDetailsBuilderErrors, hasBuilderErrors, validateBuilder, type BuilderErrors } from "@/lib/invoices/validate";
import { ensureLogoUploaded } from "@/lib/invoices/upload-logo";
import { downloadPdfResponse } from "@/lib/pdf/browser-download";
import { t } from "@/lib/i18n";

type MobileTab = "edit" | "preview";
type BusyState = null | "preparing" | "ready";
type LandingFormStep = 1 | 2;

const TEMPLATES: { id: InvoiceTemplate; icon: string; width: number; height: number }[] = [
  { id: "MINIMAL", icon: "/landing/builder-doc.svg", width: 13, height: 17 },
  { id: "PROFESSIONAL", icon: "/landing/builder-layout.svg", width: 15, height: 16 },
  { id: "PREMIUM", icon: "/landing/builder-preview.svg", width: 17, height: 16 },
];

export function InvoiceBuilder({
  paged = false,
  clients = [],
  stripePaymentsReady = false,
}: {
  paged?: boolean;
  clients?: { id: string; name: string; address: string }[];
  stripePaymentsReady?: boolean;
}) {
  const copy = t("builder");
  const toast = useToast();
  const {
    state,
    setState,
    authenticated,
    openAuth,
    persist,
    persisting,
    publicUrl,
    invoiceId,
    onCopyPublicLink,
    requestNavigate,
  } = useBuilderSession();
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [errors, setErrors] = useState<BuilderErrors>({ lines: {} });
  const [errorTick, setErrorTick] = useState(0);
  const [busy, setBusy] = useState<BusyState>(null);
  const [pendingCurrency, setPendingCurrency] = useState<Currency | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [landingStep, setLandingStep] = useState<LandingFormStep>(1);
  const [logoEditorOpen, setLogoEditorOpen] = useState(false);
  const [logoSource, setLogoSource] = useState<File | string | null>(null);
  const [stripeWarnOpen, setStripeWarnOpen] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const currency = getCurrency(state.currency);
  const totals = useMemo(
    () =>
      totalsForInvoice(state.items, currency.exponent, state.discountType, state.discountValue, state.taxRate),
    [state.items, state.discountType, state.discountValue, state.taxRate, currency.exponent],
  );

  useEffect(() => {
    if (window.location.hash === "#builder") {
      window.setTimeout(() => document.getElementById("invoice-business-name")?.focus(), 200);
    }
  }, []);

  useEffect(() => {
    if (errorTick === 0) {
      return;
    }
    const first = document.querySelector<HTMLElement>("[data-invalid='true']");
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errorTick]);

  const showErrors = (next: BuilderErrors) => {
    setErrors(next);
    if (paged) {
      if (hasDetailsBuilderErrors(next)) {
        setLandingStep(1);
      } else if (next.paymentChannel) {
        setLandingStep(2);
      }
    }
    setErrorTick((tick) => tick + 1);
    toast(copy.errors.summary);
  };

  const persistIfValid = async () => {
    const nextErrors = validateBuilder(state);
    if (hasBuilderErrors(nextErrors)) {
      showErrors(nextErrors);
      return null;
    }
    setErrors({ lines: {} });
    if (!persist) {
      return null;
    }
    return persist();
  };

  const runDownloadOrShare = async (action: "download" | "share") => {
    if (busy) {
      return;
    }
    const nextErrors = validateBuilder(state);
    if (hasBuilderErrors(nextErrors)) {
      showErrors(nextErrors);
      return;
    }
    setErrors({ lines: {} });

    if (!authenticated) {
      if (action === "download") {
        setBusy("preparing");
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        setBusy("ready");
        await new Promise((resolve) => window.setTimeout(resolve, 400));
        setBusy(null);
      }
      openAuth(action);
      return;
    }

    if (action === "share") {
      setShareOpen(true);
      return;
    }

    setBusy("preparing");
    try {
      let id = invoiceId ?? null;
      if (persist) {
        const saved = await persist();
        id = saved?.id ?? id;
      }
      if (!id) {
        toast(copy.pdfFailed);
        return;
      }
      await downloadPdfResponse(`/api/invoices/${id}/pdf`, `${state.invoiceNumber}.pdf`);
      toast(copy.downloadedLater);
    } catch {
      toast(copy.pdfFailed);
    } finally {
      setBusy(null);
    }
  };

  const inputClass = "rounded border border-[#e2e8f0] bg-puyer-card px-[9px] py-[11px] text-[16px] text-puyer-ink";
  const fieldClass =
    "h-11 w-full rounded border border-[#e2e8f0] bg-puyer-card px-[9px] text-[16px] leading-none text-puyer-ink outline-none focus-visible:border-[#0b1c30]";
  const textareaClass = `${inputClass} min-h-[70px] min-w-0 resize-none overflow-y-auto wrap-anywhere`;
  const labelClass = "text-[16px] font-bold leading-6 text-[#0b1c30]";
  const errorClass = "text-[12px] text-[#b91c1c]";
  const invalidClass = "border-[#b91c1c] bg-[#fef2f2]";
  const mark = (base: string, invalid?: boolean) => (invalid ? `${base} ${invalidClass}` : base);

  const formDetails = (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="grid grid-cols-2 items-end gap-4">
        <label className="flex min-w-0 flex-col gap-1">
          <span className={labelClass}>{copy.invoiceNumber}</span>
          <span className="flex h-11 items-center rounded border border-[#e2e8f0] bg-[#eff4ff] px-[9px] font-mono text-[14px] font-medium leading-none text-[#0b1c30]">
            {state.invoiceNumber}
          </span>
        </label>
        <div className="flex min-w-0 flex-col gap-1">
          <span className={labelClass}>{copy.currency}</span>
          <CurrencySelect
            value={state.currency}
            onRequestChange={(next) => {
              const hasItems = state.items.some(
                (item) => item.description.trim() || item.quantity.trim() || item.unitPrice.trim(),
              );
              if (hasItems && next.code !== state.currency) {
                setPendingCurrency(next);
                return;
              }
              setState({ ...state, currency: next.code });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{copy.yourBusiness}</span>
        <input
          id="invoice-business-name"
          data-invalid={errors.businessName ? "true" : undefined}
          aria-invalid={Boolean(errors.businessName)}
          value={state.businessName}
          onChange={(event) => setState({ ...state, businessName: event.target.value })}
          placeholder={copy.businessPlaceholder}
          className={mark(inputClass, Boolean(errors.businessName))}
        />
        {errors.businessName ? <span className={errorClass}>{copy.errors.businessName}</span> : null}
        <textarea
          value={state.businessAddress}
          onChange={(event) => setState({ ...state, businessAddress: event.target.value })}
          placeholder={copy.addressPlaceholder}
          className={textareaClass}
          rows={3}
        />
        <p className="text-[13px] leading-5 text-puyer-muted">{copy.logoPngHint}</p>
        <span className={`${labelClass} mt-3`}>{copy.logoLabel}</span>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              setLogoSource(file);
              setLogoEditorOpen(true);
            }}
          />
          <button
            type="button"
            className="rounded-lg border border-[#006c49] bg-white px-3 py-2 text-[14px] font-semibold text-[#006c49] hover:bg-[#E8F5EF]"
            onClick={() => logoInputRef.current?.click()}
          >
            {state.logoUrl ? copy.logoChange : copy.logoAdd}
          </button>
          {state.logoUrl ? (
            <>
              <button
                type="button"
                className="rounded border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#0b1c30]"
                onClick={() => {
                  setLogoSource(state.logoUrl);
                  setLogoEditorOpen(true);
                }}
              >
                {copy.logoEdit}
              </button>
              <button
                type="button"
                className="rounded border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#0b1c30]"
                onClick={() => setState({ ...state, logoUrl: "" })}
              >
                {copy.logoRemove}
              </button>
            </>
          ) : null}
        </div>
        {state.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.logoUrl} alt="" className="mt-2 h-12 w-auto object-contain" />
        ) : null}
        <LogoEditor
          open={logoEditorOpen}
          source={logoSource}
          scale={state.logoScale}
          onClose={() => {
            setLogoEditorOpen(false);
            setLogoSource(null);
          }}
          onApply={(blob, scale) => {
            void (async () => {
              const local = URL.createObjectURL(blob);
              const next = { ...state, logoUrl: local, logoScale: scale };
              if (authenticated) {
                try {
                  const uploaded = await ensureLogoUploaded(next);
                  setState(uploaded);
                  URL.revokeObjectURL(local);
                } catch {
                  setState(next);
                  toast(copy.logoUploadFailed);
                }
              } else {
                setState(next);
              }
              setLogoEditorOpen(false);
              setLogoSource(null);
            })();
          }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{copy.billTo}</span>
        {authenticated && clients.length > 0 ? (
          <select
            className={inputClass}
            value={clients.find((client) => client.name === state.clientName)?.id ?? ""}
            onChange={(event) => {
              const chosen = clients.find((client) => client.id === event.target.value);
              if (!chosen) {
                setState({ ...state, clientName: "", clientAddress: "" });
                return;
              }
              setState({ ...state, clientName: chosen.name, clientAddress: chosen.address });
            }}
          >
            <option value="">{copy.newClient}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        ) : null}
        <input
          data-invalid={errors.clientName ? "true" : undefined}
          aria-invalid={Boolean(errors.clientName)}
          value={state.clientName}
          onChange={(event) => setState({ ...state, clientName: event.target.value })}
          placeholder={copy.clientPlaceholder}
          className={mark(inputClass, Boolean(errors.clientName))}
        />
        {errors.clientName ? <span className={errorClass}>{copy.errors.clientName}</span> : null}
        <textarea
          value={state.clientAddress}
          onChange={(event) => setState({ ...state, clientAddress: event.target.value })}
          placeholder={copy.clientAddressPlaceholder}
          className={textareaClass}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>{copy.issueDate}</span>
          <input
            type="date"
            data-invalid={errors.issueDate ? "true" : undefined}
            aria-invalid={Boolean(errors.issueDate)}
            value={state.issueDate}
            onChange={(event) => setState({ ...state, issueDate: event.target.value })}
            className={mark(inputClass, Boolean(errors.issueDate))}
          />
          {errors.issueDate ? <span className={errorClass}>{copy.errors.issueDate}</span> : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>{copy.dueDate}</span>
          <input
            type="date"
            data-invalid={errors.dueDate ? "true" : undefined}
            aria-invalid={Boolean(errors.dueDate)}
            value={state.dueDate}
            onChange={(event) => setState({ ...state, dueDate: event.target.value })}
            className={mark(inputClass, Boolean(errors.dueDate))}
          />
          {errors.dueDate ? <span className={errorClass}>{copy.errors.dueDate}</span> : null}
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>{copy.lineItems}</span>
        <div className={`overflow-x-auto rounded border ${errors.items ? "border-[#b91c1c]" : "border-[#e2e8f0]"}`}>
          <div className="min-w-[26rem]">
            <div className="grid grid-cols-[minmax(6rem,1fr)_3.5rem_5.75rem_7.25rem_1.25rem] gap-2 bg-[#eff4ff] px-2 py-1 text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
              <span>{copy.description}</span>
              <span className="text-right">{copy.qty}</span>
              <span className="text-right">{copy.price}</span>
              <span className="text-right">{copy.amount}</span>
              <span />
            </div>
            {state.items.map((item, index) => {
              const lineErrors = errors.lines[item.id];
              const lineInput = "min-w-0 rounded border px-1 py-1 text-[14px] focus:border-[#e2e8f0]";
              return (
              <div key={item.id} className="grid grid-cols-[minmax(6rem,1fr)_3.5rem_5.75rem_7.25rem_1.25rem] items-center gap-2 border-b border-[#e2e8f0] px-2 py-2">
                <input
                  data-invalid={lineErrors?.description ? "true" : undefined}
                  aria-invalid={Boolean(lineErrors?.description)}
                  value={item.description}
                  onChange={(event) => {
                    const items = state.items.map((row) =>
                      row.id === item.id ? { ...row, description: event.target.value } : row,
                    );
                    setState({ ...state, items });
                  }}
                  className={`${lineInput} ${lineErrors?.description ? invalidClass : "border-transparent"}`}
                />
                <input
                  data-invalid={lineErrors?.quantity ? "true" : undefined}
                  aria-invalid={Boolean(lineErrors?.quantity)}
                  inputMode="decimal"
                  value={item.quantity}
                  onChange={(event) => {
                    const items = state.items.map((row) =>
                      row.id === item.id ? { ...row, quantity: event.target.value } : row,
                    );
                    setState({ ...state, items });
                  }}
                  className={`${lineInput} text-right font-mono text-[13px] tabular-nums ${lineErrors?.quantity ? invalidClass : "border-transparent"}`}
                />
                <input
                  data-invalid={lineErrors?.unitPrice ? "true" : undefined}
                  aria-invalid={Boolean(lineErrors?.unitPrice)}
                  inputMode="decimal"
                  value={item.unitPrice}
                  onChange={(event) => {
                    const items = state.items.map((row) =>
                      row.id === item.id ? { ...row, unitPrice: event.target.value } : row,
                    );
                    setState({ ...state, items });
                  }}
                  className={`${lineInput} text-right font-mono text-[13px] tabular-nums ${lineErrors?.unitPrice ? invalidClass : "border-transparent"}`}
                />
                <span className="overflow-hidden text-right font-mono text-[13px] leading-5 tabular-nums whitespace-nowrap">
                  {formatMoney(totals.lineAmounts[index] ?? 0n, currency.symbol, currency.exponent)}
                </span>
                {state.items.length > 1 ? (
                  <button
                    type="button"
                    className="text-[12px] leading-none text-[#45464d]"
                    aria-label={copy.removeItem}
                    onClick={() =>
                      setState({ ...state, items: state.items.filter((row) => row.id !== item.id) })
                    }
                  >
                    ×
                  </button>
                ) : (
                  <span />
                )}
              </div>
              );
            })}
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0070f3]"
            onClick={() =>
              setState({
                ...state,
                items: [
                  ...state.items,
                  { id: String(Date.now()), description: "", quantity: "1", unitPrice: "0.00" },
                ],
              })
            }
          >
            <FigmaIcon src="/landing/plus.svg" alt="" width={12} height={12} />
            {copy.addItem}
          </button>
        </div>
        {errors.items ? <span className={errorClass}>{copy.errors.items}</span> : null}
      </div>

      <div className="grid grid-cols-2 items-start gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={labelClass}>{copy.discount}</span>
          <SimpleSelect
            value={state.discountType}
            ariaLabel={copy.discount}
            closeLabel={copy.closeList}
            options={[
              { value: "NONE", label: copy.discountNone },
              { value: "PERCENT", label: copy.discountPercent },
              { value: "FIXED", label: copy.discountFixed },
            ]}
            onChange={(discountType: DiscountType) => setState({ ...state, discountType })}
          />
          {state.discountType !== "NONE" ? (
            <input
              data-invalid={errors.discount ? "true" : undefined}
              aria-invalid={Boolean(errors.discount)}
              value={state.discountValue}
              onChange={(event) => setState({ ...state, discountValue: event.target.value })}
              className={mark(fieldClass, Boolean(errors.discount))}
            />
          ) : null}
          {errors.discount ? <span className={errorClass}>{copy.errors.discount}</span> : null}
        </div>
        <label className="flex min-w-0 flex-col gap-1">
          <span className={labelClass}>{copy.tax}</span>
          <input
            data-invalid={errors.tax ? "true" : undefined}
            aria-invalid={Boolean(errors.tax)}
            value={state.taxRate}
            onChange={(event) => setState({ ...state, taxRate: event.target.value })}
            className={mark(fieldClass, Boolean(errors.tax))}
          />
          {errors.tax ? <span className={errorClass}>{copy.errors.tax}</span> : null}
        </label>
      </div>
    </div>
  );

  const choosePaymentChannel = (channel: Exclude<PaymentChannel, "UNSET">) => {
    setState((current) => ({ ...current, paymentChannel: channel }));
    if (errors.paymentChannel) {
      setErrors({ ...errors, paymentChannel: undefined });
    }
    if (channel === "STRIPE" && !stripePaymentsReady) {
      setStripeWarnOpen(true);
      return;
    }
    setStripeWarnOpen(false);
  };

  const channelBtnClass = (active: boolean) =>
    `flex-1 rounded border px-4 py-3 text-left ${
      active ? "border-[#0b1c30] bg-[#eff4ff]" : "border-[#e2e8f0] bg-white"
    }`;

  const formPayment = (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className={labelClass}>{copy.paymentChannel}</span>
        <p className="text-[12px] leading-4 text-[#45464d]">{copy.paymentChannelHint}</p>
        <div
          role="radiogroup"
          aria-label={copy.paymentChannel}
          data-invalid={errors.paymentChannel ? "true" : undefined}
          className={`flex flex-col gap-2 sm:flex-row ${errors.paymentChannel ? "rounded border border-[#b91c1c] p-2" : ""}`}
        >
          <button
            type="button"
            role="radio"
            aria-checked={state.paymentChannel === "STRIPE"}
            className={channelBtnClass(state.paymentChannel === "STRIPE")}
            onClick={() => choosePaymentChannel("STRIPE")}
          >
            <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.paymentChannelStripe}</span>
            <span className="mt-1 block text-[12px] leading-4 text-[#45464d]">{copy.paymentChannelStripeHint}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={state.paymentChannel === "BANK"}
            className={channelBtnClass(state.paymentChannel === "BANK")}
            onClick={() => choosePaymentChannel("BANK")}
          >
            <span className="block text-[14px] font-semibold text-[#0b1c30]">{copy.paymentChannelBank}</span>
            <span className="mt-1 block text-[12px] leading-4 text-[#45464d]">{copy.paymentChannelBankHint}</span>
          </button>
        </div>
        {errors.paymentChannel ? <span className={errorClass}>{copy.errors.paymentChannel}</span> : null}
        {state.paymentChannel === "STRIPE" && !stripePaymentsReady ? (
          <p className="text-[12px] leading-4 text-[#b45309]">{copy.stripeNotConnectedHint}</p>
        ) : null}
      </div>

      {state.paymentChannel === "BANK" ? (
      <div className="flex flex-col gap-3">
        <span className={labelClass}>{copy.bankSection}</span>
        <p className="text-[12px] leading-4 text-[#45464d]">{copy.bankSectionHint}</p>
        {(
          [
            ["bankAccountHolder", copy.bankAccountHolder],
            ["bankName", copy.bankName],
            ["bankIban", copy.bankIban],
            ["bankBic", copy.bankBic],
            ["bankAccountNumber", copy.bankAccountNumber],
            ["bankRoutingNumber", copy.bankRoutingNumber],
            ["bankPaymentReference", copy.bankPaymentReference],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[14px] leading-5 text-[#45464d]">{label}</span>
            <input
              value={state[key]}
              onChange={(event) => setState({ ...state, [key]: event.target.value })}
              className={fieldClass}
              autoComplete="off"
            />
          </label>
        ))}
        <label className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            className="mt-1 size-4 shrink-0"
            checked={state.storeBankDetailsConsent}
            disabled={!hasBankTransfer(state)}
            onChange={(event) => setState({ ...state, storeBankDetailsConsent: event.target.checked })}
          />
          <span className="text-[12px] leading-4 text-[#0b1c30]">{copy.bankStorageConsent}</span>
        </label>
        {hasBankTransfer(state) && !state.storeBankDetailsConsent ? (
          <p className="text-[12px] leading-4 text-[#b45309]">{copy.bankStorageDeclined}</p>
        ) : null}
      </div>
      ) : null}

      <label className="flex flex-col gap-1">
        <span className={labelClass}>{copy.paymentDetails}</span>
        <textarea
          value={state.paymentDetails}
          onChange={(event) => setState({ ...state, paymentDetails: event.target.value })}
          className={textareaClass}
          rows={3}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>{copy.notes}</span>
        <textarea
          value={state.notes}
          onChange={(event) => setState({ ...state, notes: event.target.value })}
          className={textareaClass}
          rows={3}
        />
        <span className="text-[10px] leading-4 text-[#45464d]">{copy.notesDisclaimerLocked}</span>
      </label>

      <div className="flex flex-col gap-2">
        <span className={labelClass}>{copy.accent}</span>
        <div className="flex gap-2">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              className={`size-8 rounded-full border ${state.accentColor === color ? "border-black" : "border-[#e2e8f0]"}`}
              style={{ background: color }}
              onClick={() => setState({ ...state, accentColor: color })}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const previewPane = (
    <div
      className={`preview-scroll relative flex min-h-[600px] flex-col items-center overflow-auto rounded-xl bg-[#e5eeff] p-4 sm:p-8 ${
        paged ? "lg:max-h-[calc(100dvh-8rem)]" : ""
      }`}
    >
      <div className="preview-glow pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative z-[1] mb-4 flex gap-2">
        <button
          type="button"
          className="rounded border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] font-semibold tracking-[0.6px]"
          onClick={() => setZoom((value) => Math.min(1.4, Math.round((value + 0.1) * 10) / 10))}
        >
          {copy.zoomIn}
        </button>
        <button
          type="button"
          className="rounded border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] font-semibold tracking-[0.6px]"
          onClick={() => setZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))}
        >
          {copy.zoomOut}
        </button>
        <button
          type="button"
          className="rounded border border-[#e2e8f0] bg-white px-2 py-1 text-[12px] font-semibold tracking-[0.6px]"
          onClick={() => setFullscreen(true)}
        >
          {copy.fullscreen}
        </button>
      </div>
      <div className="relative z-[1] w-full max-w-[700px]">
        <InvoicePreview state={state} currency={currency} totals={totals} zoom={zoom} />
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-4 border-t border-[#e2e8f0] pt-[17px]">
      {persist ? (
        <button
          type="button"
          disabled={Boolean(busy) || persisting}
          className="builder-cta flex flex-1 items-center justify-center gap-1 rounded bg-puyer-green py-4 text-[12px] font-semibold tracking-[0.6px] text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void persistIfValid()}
        >
          <PuyerBusyText busy={Boolean(persisting)} busyLabel={copy.saving} idle={copy.save} />
        </button>
      ) : null}
      <button
        type="button"
        disabled={Boolean(busy)}
        className="builder-cta flex flex-1 cursor-pointer items-center justify-center gap-1 rounded bg-puyer-green py-4 text-[12px] font-semibold tracking-[0.6px] text-white disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => void runDownloadOrShare("download")}
      >
        {busy === "preparing" || busy === "ready" ? (
          <PuyerBusyText
            busy
            busyLabel={busy === "preparing" ? copy.preparing : copy.ready}
            idle={copy.downloadPdf}
          />
        ) : (
          <>
            <FigmaIcon src="/landing/download.svg" alt="" width={12} height={12} />
            {copy.downloadPdf}
          </>
        )}
      </button>
      <div className="relative">
        <button
          type="button"
          disabled={Boolean(busy)}
          aria-label={copy.share}
          className="builder-cta flex cursor-pointer items-center justify-center rounded bg-puyer-green px-[17px] py-[15px] text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => void runDownloadOrShare("share")}
        >
          {busy ? (
            <PuyerSpinner size={16} tone="inherit" />
          ) : (
            <FigmaIcon src="/landing/share.svg" alt="" width={15} height={17} />
          )}
        </button>
        {shareOpen ? (
          <div className="absolute bottom-full right-0 mb-2 w-48 rounded border border-[#e2e8f0] bg-white p-2 shadow-lg">
            {["email", "copyLink", "whatsapp", "nativeShare"].map((key) => (
              <button
                key={key}
                type="button"
                className="block w-full px-2 py-2 text-left text-[14px] hover:bg-[#eff4ff]"
                onClick={() => {
                  setShareOpen(false);
                  void (async () => {
                    let href = publicUrl
                      ? publicUrl.startsWith("http")
                        ? publicUrl
                        : `${window.location.origin}${publicUrl}`
                      : null;
                    if (!href && persist) {
                      const saved = await persist();
                      if (saved?.publicId) {
                        href = `${window.location.origin}/invoice/${saved.publicId}`;
                      }
                    }
                    if (!href) {
                      toast(copy.shareSoon);
                      return;
                    }
                    if (key === "copyLink") {
                      await navigator.clipboard.writeText(href);
                      toast(copy.copyLinkDone);
                      onCopyPublicLink?.();
                      return;
                    }
                    if (key === "email") {
                      window.location.href = `mailto:?subject=${encodeURIComponent(copy.shareEmailSubject.replace("{number}", state.invoiceNumber))}&body=${encodeURIComponent(href)}`;
                      onCopyPublicLink?.();
                      return;
                    }
                    if (key === "whatsapp") {
                      window.open(`https://wa.me/?text=${encodeURIComponent(href)}`, "_blank", "noopener,noreferrer");
                      onCopyPublicLink?.();
                      return;
                    }
                    if (key === "nativeShare" && typeof navigator.share === "function") {
                      try {
                        await navigator.share({ title: state.invoiceNumber, url: href });
                        onCopyPublicLink?.();
                      } catch {
                        await navigator.clipboard.writeText(href);
                        toast(copy.copyLinkDone);
                      }
                      return;
                    }
                    await navigator.clipboard.writeText(href);
                    toast(copy.copyLinkDone);
                    onCopyPublicLink?.();
                  })();
                }}
              >
                {copy.shareOptions[key as keyof typeof copy.shareOptions]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <section id="builder" className="scroll-mt-24 mx-auto w-full max-w-[1200px] px-5 lg:px-10">
      <div className="mb-3 flex gap-2 md:hidden">
        <button
          type="button"
          className={`flex-1 rounded border py-2 text-[12px] font-semibold tracking-[0.6px] ${
            mobileTab === "edit" ? "border-black bg-black text-white" : "border-[#e2e8f0] bg-white"
          }`}
          onClick={() => setMobileTab("edit")}
        >
          {copy.editTab}
        </button>
        <button
          type="button"
          className={`flex-1 rounded border py-2 text-[12px] font-semibold tracking-[0.6px] ${
            mobileTab === "preview" ? "border-black bg-black text-white" : "border-[#e2e8f0] bg-white"
          }`}
          onClick={() => setMobileTab("preview")}
        >
          {copy.previewTab}
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div
          className={`flex min-w-0 flex-col gap-4 overflow-x-hidden rounded-xl border border-[#e2e8f0] bg-white p-[25px] lg:col-span-5 ${
            mobileTab === "preview" ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-[17px]">
            <h2 className="text-[24px] font-semibold leading-8 text-black">{copy.title}</h2>
            <div className="flex gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  title={template.id}
                  aria-pressed={state.template === template.id}
                  className={`flex size-8 items-center justify-center rounded border ${
                    state.template === template.id
                      ? "border-black bg-[#eff4ff]"
                      : "border-[#e2e8f0] bg-[#f8f9ff]"
                  }`}
                  onClick={() => setState({ ...state, template: template.id })}
                >
                  <FigmaIcon src={template.icon} alt="" width={template.width} height={template.height} />
                </button>
              ))}
            </div>
          </div>
          {paged ? (
            <>
              <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
                {copy.stepProgress.replace("{current}", String(landingStep))}
                {" · "}
                {landingStep === 1 ? copy.stepDetails : copy.stepPayment}
              </p>
              {landingStep === 1 ? formDetails : formPayment}
              <div className="flex gap-2">
                {landingStep === 2 ? (
                  <button
                    type="button"
                    className="flex-1 cursor-pointer rounded border border-[#e2e8f0] py-3 text-[12px] font-semibold tracking-[0.6px] transition duration-150 hover:bg-[#eff4ff] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b1c30]"
                    onClick={() => setLandingStep(1)}
                  >
                    {copy.backStep}
                  </button>
                ) : null}
                {landingStep === 1 ? (
                  <button
                    type="button"
                    className="builder-cta flex flex-1 cursor-pointer items-center justify-center rounded bg-puyer-green py-4 text-[12px] font-semibold tracking-[0.6px] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-puyer-green"
                    onClick={() => {
                      setLandingStep(2);
                      document.getElementById("builder")?.scrollIntoView({ block: "start", behavior: "smooth" });
                    }}
                  >
                    {copy.nextStep}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {formDetails}
              {formPayment}
            </>
          )}
          {!paged || landingStep === 2 ? actions : null}
        </div>

        <div
          className={`min-w-0 lg:col-span-7 ${mobileTab === "edit" ? "hidden md:block" : "block"} ${
            paged ? "lg:sticky lg:top-24" : ""
          }`}
        >
          {previewPane}
        </div>
      </div>

      {mobileTab === "preview" && (!paged || landingStep === 2) ? <div className="mt-4 md:hidden">{actions}</div> : null}

      <Modal
        open={pendingCurrency !== null}
        title={copy.currencyWarningTitle}
        onClose={() => setPendingCurrency(null)}
      >
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.currencyWarningBody}</p>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded bg-black py-[9px] text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={() => {
              if (pendingCurrency) {
                setState({ ...state, currency: pendingCurrency.code });
              }
              setPendingCurrency(null);
            }}
          >
            {copy.currencyContinue}
          </button>
          <button
            type="button"
            className="flex-1 rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px]"
            onClick={() => setPendingCurrency(null)}
          >
            {copy.currencyCancel}
          </button>
        </div>
      </Modal>

      <Modal
        open={stripeWarnOpen}
        title={copy.stripeNotConnectedTitle}
        onClose={() => setStripeWarnOpen(false)}
      >
        <p className="text-[14px] leading-5 text-[#45464d]">{copy.stripeNotConnectedBody}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            className="rounded bg-puyer-green py-[9px] text-[12px] font-semibold tracking-[0.6px] text-white"
            onClick={() => {
              setStripeWarnOpen(false);
              requestNavigate(authenticated ? "/settings" : "/login");
            }}
          >
            {copy.stripeNotConnectedConnect}
          </button>
          <button
            type="button"
            className="rounded border border-[#e2e8f0] py-[9px] text-[12px] font-semibold tracking-[0.6px]"
            onClick={() => setStripeWarnOpen(false)}
          >
            {copy.stripeNotConnectedContinue}
          </button>
          <button
            type="button"
            className="rounded py-[9px] text-[12px] font-semibold tracking-[0.6px] text-[#0b1c30]"
            onClick={() => {
              setStripeWarnOpen(false);
              choosePaymentChannel("BANK");
            }}
          >
            {copy.stripeNotConnectedBank}
          </button>
        </div>
      </Modal>

      {fullscreen ? (
        <div className="fixed inset-0 z-50 overflow-auto bg-[#e5eeff] p-4 sm:p-10 preview-scroll">
          <div className="mx-auto mb-4 flex max-w-[900px] gap-2">
            <button
              type="button"
              className="rounded bg-black px-4 py-2 text-[12px] font-semibold tracking-[0.6px] text-white"
              onClick={() => setFullscreen(false)}
            >
              {copy.closePreview}
            </button>
            <button
              type="button"
              className="rounded border border-[#e2e8f0] bg-white px-3 py-2 text-[12px] font-semibold tracking-[0.6px]"
              onClick={() => setZoom((value) => Math.min(1.4, Math.round((value + 0.1) * 10) / 10))}
            >
              {copy.zoomIn}
            </button>
            <button
              type="button"
              className="rounded border border-[#e2e8f0] bg-white px-3 py-2 text-[12px] font-semibold tracking-[0.6px]"
              onClick={() => setZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))}
            >
              {copy.zoomOut}
            </button>
          </div>
          <div className="mx-auto max-w-[900px]">
            <InvoicePreview state={state} currency={currency} totals={totals} zoom={zoom} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
