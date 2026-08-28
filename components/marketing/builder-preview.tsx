import { FigmaIcon } from "@/components/marketing/figma-icon";
import { t } from "@/lib/i18n";

export function BuilderPreview() {
  const builder = t("builder");
  const preview = t("preview");

  return (
    <section
      id="builder"
      className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-5 lg:grid-cols-12 lg:px-10"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-[#e2e8f0] bg-white p-[25px] lg:col-span-5">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-[17px]">
          <h2 className="text-[24px] font-semibold leading-8 text-black">{builder.title}</h2>
          <div className="flex gap-2">
            <span className="flex size-8 items-center justify-center rounded border border-[#e2e8f0] bg-[#eff4ff]">
              <FigmaIcon src="/landing/builder-doc.svg" alt="" width={13} height={17} />
            </span>
            <span className="flex size-8 items-center justify-center rounded border border-[#e2e8f0] bg-[#f8f9ff]">
              <FigmaIcon src="/landing/builder-layout.svg" alt="" width={15} height={16} />
            </span>
            <span className="flex size-8 items-center justify-center rounded border border-[#e2e8f0] bg-[#f8f9ff]">
              <FigmaIcon src="/landing/builder-preview.svg" alt="" width={17} height={16} />
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{builder.invoiceNumber}</span>
              <span className="rounded border border-[#e2e8f0] bg-white p-[9px] font-mono text-[14px] font-medium leading-5 text-[#0b1c30]">
                {builder.invoiceNumberValue}
              </span>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{builder.currency}</span>
              <span className="relative flex items-center rounded border border-[#e2e8f0] bg-white p-[9px] text-[16px] leading-6 text-[#0b1c30]">
                {builder.currencyValue}
                <span className="absolute right-[9px]">
                  <FigmaIcon src="/landing/chevron.svg" alt="" width={24} height={24} />
                </span>
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{builder.yourBusiness}</span>
              <span className="rounded border border-[#e2e8f0] px-[9px] py-[11px] text-[16px] text-[#6b7280]">
                {builder.businessPlaceholder}
              </span>
              <span className="min-h-[70px] rounded border border-[#e2e8f0] px-[9px] pt-[13px] text-[16px] leading-6 text-[#6b7280]">
                {builder.addressPlaceholder}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{builder.billTo}</span>
              <span className="rounded border border-[#e2e8f0] px-[9px] py-[11px] text-[16px] text-[#6b7280]">
                {builder.clientPlaceholder}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[16px] font-bold leading-6 text-[#0b1c30]">{builder.lineItems}</span>
            <div className="overflow-hidden rounded border border-[#e2e8f0]">
              <div className="grid grid-cols-12 gap-2 bg-[#eff4ff] px-2 py-1 text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
                <span className="col-span-6">{builder.description}</span>
                <span className="col-span-2 text-right">{builder.qty}</span>
                <span className="col-span-4 text-right">{builder.price}</span>
              </div>
              <div className="grid grid-cols-12 gap-2 border-b border-[#e2e8f0] px-2 py-2 text-[14px] leading-6 text-black">
                <span className="col-span-6">{builder.lineItem}</span>
                <span className="col-span-2 text-right font-mono text-[14px] font-medium">{builder.qtyValue}</span>
                <span className="col-span-4 text-right font-mono text-[14px] font-medium">{builder.priceValue}</span>
              </div>
              <div className="flex items-center justify-center gap-1 py-2 text-[12px] font-semibold tracking-[0.6px] text-[#0070f3]">
                <FigmaIcon src="/landing/plus.svg" alt="" width={12} height={12} />
                {builder.addItem}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 border-t border-[#e2e8f0] pt-[17px]">
          <a
            href="#builder"
            className="flex flex-1 items-center justify-center gap-1 rounded bg-black py-4 text-[12px] font-semibold tracking-[0.6px] text-white"
          >
            <FigmaIcon src="/landing/download.svg" alt="" width={12} height={12} />
            {builder.downloadPdf}
          </a>
          <span className="flex items-center justify-center rounded border border-[#e2e8f0] px-[17px] py-[15px]">
            <FigmaIcon src="/landing/share.svg" alt="" width={15} height={17} />
          </span>
        </div>
      </div>

      <div className="relative flex min-h-[600px] items-start justify-center overflow-hidden rounded-xl bg-[#e5eeff] p-8 lg:col-span-7">
        <div className="preview-glow pointer-events-none absolute inset-0 opacity-50" />
        <article className="invoice-paper relative z-[1] flex w-full max-w-[700px] flex-col gap-8 rounded-[2px] bg-white p-8 shadow-[0px_10px_25px_-5px_rgba(15,23,42,0.1),0px_4px_10px_-2px_rgba(15,23,42,0.05)] sm:p-12">
          <div className="flex items-start justify-between border-b-2 border-black pb-[26px]">
            <div>
              <p className="text-[32px] font-semibold uppercase leading-10 tracking-[-0.8px] text-black">
                {preview.invoice}
              </p>
              <p className="font-mono text-[14px] font-medium leading-5 text-[#45464d]">{preview.number}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="size-12 rounded-full bg-black" />
              <p className="text-right text-[24px] font-semibold leading-8 text-black">{preview.business}</p>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex-1">
              <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{preview.billedTo}</p>
              <p className="pt-1 text-[16px] font-semibold leading-6 text-black">{preview.client}</p>
              <p className="text-[14px] leading-5 text-[#45464d]">
                {preview.clientAddress1}
                <br />
                {preview.clientAddress2}
              </p>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1">
              <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{preview.date}</p>
              <p className="font-mono text-[14px] font-medium leading-5 text-black">{preview.dateValue}</p>
              <p className="text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">{preview.dueDate}</p>
              <p className="font-mono text-[14px] font-medium leading-5 text-black">{preview.dueDateValue}</p>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-[1fr_80px_100px] border-b border-[#e2e8f0] pb-2 text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
              <span>{preview.invoice === "INVOICE" ? builder.description : builder.description}</span>
              <span className="text-right">{builder.qty}</span>
              <span className="text-right">{builder.amount}</span>
            </div>
            <div className="grid grid-cols-[1fr_80px_100px] border-b border-[#e2e8f0] py-2 text-[14px]">
              <span>{preview.item1}</span>
              <span className="text-right font-mono">{preview.item1Qty}</span>
              <span className="text-right font-mono">{preview.item1Amount}</span>
            </div>
            <div className="grid grid-cols-[1fr_80px_100px] border-b border-[#e2e8f0] py-2 text-[14px]">
              <span>{preview.item2}</span>
              <span className="text-right font-mono">{preview.item2Qty}</span>
              <span className="text-right font-mono">{preview.item2Amount}</span>
            </div>
            <div className="ml-auto mt-2 w-full max-w-[265px]">
              <div className="flex justify-between border-b border-[#e2e8f0] py-1 text-[14px]">
                <span className="text-[#45464d]">{preview.subtotal}</span>
                <span className="font-mono">{preview.subtotalValue}</span>
              </div>
              <div className="flex justify-between border-b border-[#e2e8f0] py-1 text-[14px]">
                <span className="text-[#45464d]">{preview.tax}</span>
                <span className="font-mono">{preview.taxValue}</span>
              </div>
              <div className="flex justify-between pb-2 pt-3 text-[24px] font-semibold leading-8">
                <span>{preview.total}</span>
                <span>{preview.totalValue}</span>
              </div>
            </div>
          </div>

          <p className="border-t border-[#e2e8f0] pt-[25px] text-center text-[12px] font-semibold tracking-[0.6px] text-[#45464d]">
            {preview.thanks}
          </p>
        </article>
      </div>
    </section>
  );
}
