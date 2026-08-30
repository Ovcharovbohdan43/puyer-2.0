export const LOGO_SCALE_MIN = 40;
export const LOGO_SCALE_MAX = 160;
export const LOGO_SCALE_DEFAULT = 100;
export const LOGO_BASE_HEIGHT_PX = 56;

export function clampLogoScale(value: number): number {
  if (!Number.isFinite(value)) {
    return LOGO_SCALE_DEFAULT;
  }
  return Math.min(LOGO_SCALE_MAX, Math.max(LOGO_SCALE_MIN, Math.round(value)));
}

export function invoiceLogoHeightPx(scale: number): number {
  return Math.round((LOGO_BASE_HEIGHT_PX * clampLogoScale(scale)) / 100);
}

export function invoiceLogoHeightPt(scale: number): number {
  return Math.round(invoiceLogoHeightPx(scale) * 0.75);
}

export function sanitizeStoredLogoUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2000) {
    return "";
  }
  if (trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "";
}
