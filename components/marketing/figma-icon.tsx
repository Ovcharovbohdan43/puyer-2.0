type FigmaIconProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function FigmaIcon({ src, alt, width, height, className }: FigmaIconProps) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden ${className ?? ""}`}
      style={{ width, height }}
    >
      {/* Figma-exported SVG. next/image is not used for these vectors. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={width} height={height} className="size-full object-contain" />
    </span>
  );
}
