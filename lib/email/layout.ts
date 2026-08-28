import { escapeHtml } from "@/lib/email/types";

const INK = "#0B1C30";
const MUTED = "#45464D";
const GREEN = "#006C49";
const BORDER = "#E2E8F0";
const CANVAS = "#F1F5F9";

type PuyerEmailLayoutInput = {
  preview: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
};

export function puyerEmailHtml(input: PuyerEmailLayoutInput): string {
  const preview = escapeHtml(input.preview);
  const heading = escapeHtml(input.heading);
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td style="border-radius:8px;background:${GREEN};">
              <a href="${escapeHtml(input.ctaUrl)}" style="display:inline-block;padding:14px 24px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:600;line-height:24px;color:#F8F9FF;text-decoration:none;">${escapeHtml(input.ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";
  const footnote = input.footnote
    ? `<p style="margin:24px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">${escapeHtml(input.footnote)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${CANVAS};">
  <div style="display:none;max-height:0;overflow:hidden;">${preview}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CANVAS};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="height:8px;background:${GREEN};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-family:Inter,Arial,sans-serif;font-size:24px;font-weight:700;line-height:32px;color:${INK};">Puyer</td>
          </tr>
          <tr>
            <td style="padding:8px 32px 0;font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:600;line-height:30px;letter-spacing:-0.3px;color:${INK};">${heading}</td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">
              ${input.bodyHtml}
              ${cta}
              ${footnote}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:18px;color:${MUTED};">Puyer is invoicing software. Payments go through your connected Stripe account.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function puyerParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:22px;color:${MUTED};">${escapeHtml(text)}</p>`;
}

export function puyerCodeBlock(code: string): string {
  return `<p style="margin:0 0 24px;padding:16px;font-family:ui-monospace,Consolas,monospace;font-size:20px;letter-spacing:4px;text-align:center;color:${INK};background:${CANVAS};border:1px solid ${BORDER};border-radius:8px;">${escapeHtml(code)}</p>`;
}
