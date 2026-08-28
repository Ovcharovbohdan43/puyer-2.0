export function InvoicePreviewSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between border-b border-[#E5E7EB] pb-4">
        <div className="h-6 w-16 rounded bg-[#E2E8F0]" />
        <div className="flex flex-col items-end gap-1">
          <div className="h-4 w-20 rounded bg-[#E2E8F0]" />
          <div className="h-3 w-16 rounded bg-[#F1F5F9]" />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-2">
        <div className="h-3 w-3/4 rounded bg-[#F1F5F9]" />
        <div className="h-3 w-1/2 rounded bg-[#F1F5F9]" />
      </div>
      <div className="mt-8 overflow-hidden rounded border border-[#E5E7EB]">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8FAFC] px-2 py-2">
          <div className="h-2 w-36 rounded bg-[#E2E8F0]" />
          <div className="h-2 w-16 rounded bg-[#E2E8F0]" />
        </div>
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-2 py-2">
          <div className="h-2 w-48 rounded bg-[#F1F5F9]" />
          <div className="h-2 w-14 rounded bg-[#E2E8F0]" />
        </div>
        <div className="flex items-center justify-between px-2 py-2">
          <div className="h-2 w-36 rounded bg-[#F1F5F9]" />
          <div className="h-2 w-14 rounded bg-[#E2E8F0]" />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="h-6 w-24 rounded bg-[#CBD5E1]" />
      </div>
    </div>
  );
}
