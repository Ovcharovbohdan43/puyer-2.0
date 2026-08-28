import { escapeHtml } from "@/lib/email/types";

const INK = "#0B1C30";
const MUTED = "#45464D";
const GREEN = "#006C49";
const ON_GREEN = "#F8F9FF";
const BORDER = "#E2E8F0";
const CANVAS = "#F1F5F9";
const WHITE = "#FFFFFF";
const FONT = "Arial, Helvetica, sans-serif";

type PuyerEmailLayoutInput = {
  preview: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footnote?: string;
};

function bulletproofButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                  <tr>
                    <td align="center" bgcolor="${GREEN}" style="background-color:${GREEN};border-radius:8px;">
                      <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:bold;line-height:20px;color:${ON_GREEN};text-decoration:none;border-radius:8px;">${escapeHtml(label)}</a>
                    </td>
                  </tr>
                </table>`;
}

export function puyerEmailHtml(input: PuyerEmailLayoutInput): string {
  const preview = escapeHtml(input.preview);
  const heading = escapeHtml(input.heading);
  const cta =
    input.ctaLabel && input.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr>
                  <td style="padding:8px 0 24px;">
                    ${bulletproofButton(input.ctaLabel, input.ctaUrl)}
                  </td>
                </tr>
              </table>`
      : "";
  const footnote = input.footnote
    ? `<p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">${escapeHtml(input.footnote)}</p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${heading}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${CANVAS};" bgcolor="${CANVAS}">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${preview}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${CANVAS}" style="border-collapse:collapse;background-color:${CANVAS};">
    <tr>
      <td align="center" valign="top" style="padding:32px 16px;">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td>
        <![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center" style="border-collapse:collapse;width:100%;max-width:600px;">
          <tr>
            <td align="left" bgcolor="${WHITE}" style="background-color:${WHITE};border:1px solid ${BORDER};border-radius:12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
                <tr>
                  <td bgcolor="${GREEN}" height="8" style="background-color:${GREEN};height:8px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:32px 32px 8px;font-family:${FONT};font-size:24px;font-weight:bold;line-height:32px;color:${INK};">Puyer</td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 0;font-family:${FONT};font-size:22px;font-weight:bold;line-height:30px;color:${INK};">${heading}</td>
                </tr>
                <tr>
                  <td style="padding:16px 32px 32px;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};">
                    ${input.bodyHtml}
                    ${cta}
                    ${footnote}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED};">Puyer is invoicing software. Payments go through your connected Stripe account.</td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function puyerParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:22px;color:${MUTED};">${escapeHtml(text)}</p>`;
}

export function puyerCodeBlock(code: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px;">
  <tr>
    <td align="center" bgcolor="${CANVAS}" style="padding:16px;font-family:Consolas,'Courier New',monospace;font-size:20px;letter-spacing:4px;color:${INK};background-color:${CANVAS};border:1px solid ${BORDER};border-radius:8px;">${escapeHtml(code)}</td>
  </tr>
</table>`;
}
