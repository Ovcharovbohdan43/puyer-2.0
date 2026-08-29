import { PUYER_LOGO_HEIGHT, PUYER_LOGO_SRC, PUYER_LOGO_WIDTH } from "@/lib/brand";
import { t } from "@/lib/i18n";

type PuyerLogoProps = {
  className?: string;
  height?: number;
  onDark?: boolean;
};

export function PuyerLogo({ className = "", height = 32, onDark = false }: PuyerLogoProps) {
  const alt = t("header").brand;
  const width = Math.round((height * PUYER_LOGO_WIDTH) / PUYER_LOGO_HEIGHT);

  return (
    // Native img keeps PNG alpha. next/image optimization can flatten transparency to a white plate.
    <img
      src={PUYER_LOGO_SRC}
      alt={alt}
      width={width}
      height={height}
      className={`block bg-transparent object-contain object-left${onDark ? " puyer-logo-on-dark" : ""}${className ? ` ${className}` : ""}`}
      style={{ height, width: "auto", background: "transparent" }}
      decoding="async"
    />
  );
}
