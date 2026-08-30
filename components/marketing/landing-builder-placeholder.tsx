export function LandingBuilderPlaceholder() {
  return (
    <section
      id="builder"
      className="scroll-mt-24 mx-auto w-full max-w-[1200px] px-5 lg:px-10"
      aria-busy="true"
      aria-label="Invoice builder"
    >
      <div className="grid grid-cols-1 gap-4 pb-8 lg:grid-cols-12">
        <div className="h-80 rounded-xl bg-[#f1f5f9] lg:col-span-5" />
        <div className="min-h-[600px] rounded-xl bg-[#e5eeff] lg:col-span-7" />
      </div>
    </section>
  );
}
