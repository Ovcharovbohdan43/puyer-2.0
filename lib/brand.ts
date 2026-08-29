export const PUYER_LOGO_SRC = "/brand/puyer-logo.png";
export const PUYER_FAVICON_SRC = "/brand/puyer-favicon.png";
export const PUYER_LOGO_WIDTH = 95;
export const PUYER_LOGO_HEIGHT = 27;

const FALLBACK_PUBLIC_ORIGIN = "https://puyer.org";

export function puyerLogoAbsoluteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const origin = configured || FALLBACK_PUBLIC_ORIGIN;
  return `${origin}${PUYER_LOGO_SRC}`;
}
