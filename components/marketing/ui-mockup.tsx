type UiMockupProps = {
  label: string;
  className?: string;
  heightClassName?: string;
};

export function UiMockup({
  label,
  className = "bg-[#e5eeff] border border-[#e2e8f0]",
  heightClassName = "h-[200px]",
}: UiMockupProps) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-[4px] text-center text-[16px] leading-6 text-[#45464d] ${className} ${heightClassName}`}
    >
      {label}
    </div>
  );
}
