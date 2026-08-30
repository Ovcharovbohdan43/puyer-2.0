import { COOKIE_INVENTORY } from "@/lib/cookies/consent";
import {
  LEGAL_OPERATOR,
  LEGAL_PRIVACY_EMAIL,
  LEGAL_PRODUCT,
  LEGAL_SITE,
  LEGAL_SUPPORT_EMAIL,
  LEGAL_UPDATED,
} from "@/lib/legal/company";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  slug: "privacy" | "terms" | "cookies";
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const contactLine = `Questions: ${LEGAL_PRIVACY_EMAIL} (privacy) or ${LEGAL_SUPPORT_EMAIL} (product). Website: ${LEGAL_SITE}.`;

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  description: `How ${LEGAL_PRODUCT} collects, uses, and shares personal data.`,
  updated: LEGAL_UPDATED,
  intro: `${LEGAL_OPERATOR} (“Puyer”, “we”, “us”) provides invoicing software at ${LEGAL_SITE}. This notice explains what personal data we process when you visit the site, create an account, issue invoices, pay a Puyer subscription, or open a public invoice link. It is product documentation, not legal advice.`,
  sections: [
    {
      id: "who",
      title: "Who we are",
      blocks: [
        {
          type: "p",
          text: `${LEGAL_OPERATOR} operates ${LEGAL_PRODUCT}. Puyer is software for freelancers, self-employed professionals, and small businesses. We are not the merchant of record for invoices you send to your customers. Invoice payments are processed on your connected Stripe account. Puyer does not hold your customers’ funds and does not charge transaction fees on those payments. Our revenue is Puyer Pro and Puyer Business subscriptions only.`,
        },
        { type: "p", text: contactLine },
      ],
    },
    {
      id: "scope",
      title: "Who this notice covers",
      blocks: [
        {
          type: "ul",
          items: [
            "Visitors to puyer.org and related pages (pricing, legal, public invoices).",
            "Users who sign in with an email magic link and use the workspace (invoices, clients, products, reports, team, billing).",
            "People whose details an issuer stores in Puyer (clients, invoice recipients) — the issuer is typically the controller of that customer data; we process it to provide the service.",
            "People who pay an invoice through Stripe on a public invoice page (Stripe, not Puyer, collects card details).",
          ],
        },
      ],
    },
    {
      id: "data",
      title: "Personal data we process",
      blocks: [
        {
          type: "p",
          text: "We collect only what we need to run the product. Typical categories:",
        },
        {
          type: "ul",
          items: [
            "Account: email address; optional name; organization membership and role.",
            "Workspace content you enter: business profile, logos, clients, products/services, invoices, notes, bank-transfer details (only if you explicitly consent to store them), reminder settings.",
            "Authentication: magic-link tokens handled by Supabase Auth; session cookies so you stay signed in.",
            "Subscriptions: Stripe customer and subscription identifiers, plan, and status for Puyer Pro / Business. We do not store full card numbers.",
            "Invoice payments: payment status and related Stripe event data for invoices paid on your connected account. Card PAN and CVC go to Stripe, not to Puyer.",
            "Team: invite emails, roles (OWNER, ADMIN, MEMBER, VIEWER).",
            "Technical: IP address, user agent, request IDs, and security logs. Logs redact secrets, tokens, and bank identifiers.",
            "Communications: transactional email (magic links, invoice send, reminders, invites) via our email provider.",
          ],
        },
        {
          type: "p",
          text: "We do not ask for passwords. Sign-in is email magic link only.",
        },
      ],
    },
    {
      id: "use",
      title: "How we use data",
      blocks: [
        {
          type: "ul",
          items: [
            "Provide the service: accounts, invoices, PDFs, public share links, clients, reports, team, reminders.",
            "Process Puyer subscriptions on our Stripe platform account.",
            "Let you connect Stripe so your customers pay you directly on your connected account.",
            "Send transactional email you request (sign-in, send invoice, reminders, invites).",
            "Secure the service: rate limits, origin checks, abuse prevention, audit logs of product actions (not payment credentials).",
            "Comply with law and enforce our Terms.",
          ],
        },
        {
          type: "p",
          text: "We do not sell personal data. We do not use your invoice contents to advertise to your customers.",
        },
      ],
    },
    {
      id: "legal-bases",
      title: "Legal bases (where GDPR / UK GDPR apply)",
      blocks: [
        {
          type: "ul",
          items: [
            "Contract: creating an account, issuing invoices, subscriptions, Connect onboarding.",
            "Legitimate interests: securing the service, preventing abuse, understanding aggregate product reliability. You may object where the law allows.",
            "Consent: optional cookie categories in the cookie window; storing bank-transfer details on an invoice; any future marketing email (we do not send promotional mail by default).",
            "Legal obligation: tax, accounting, or lawful requests where they apply to us as a software provider.",
          ],
        },
      ],
    },
    {
      id: "processors",
      title: "Processors and sharing",
      blocks: [
        {
          type: "p",
          text: "We share data with service providers who process it on our instructions, and with Stripe as described below:",
        },
        {
          type: "ul",
          items: [
            "Supabase — authentication, Postgres database, file storage (logos, generated PDFs).",
            "Vercel — application hosting.",
            "Stripe — Puyer subscription billing on our platform account; Stripe Connect so invoice payments settle on your connected account. Stripe’s privacy notice applies to payment data Stripe collects.",
            "Resend — transactional email.",
            "Inngest — background jobs (reminders, webhooks follow-up).",
            "Upstash — optional Redis for rate limits in production.",
          ],
        },
        {
          type: "p",
          text: "Public invoice links are unguessable but not behind a login. Anyone with the link can see the invoice’s public fields (business details, line items, totals, payment status). Do not put secrets in invoice notes.",
        },
        {
          type: "p",
          text: "We may disclose data if required by law, to protect users or the service, or in a merger or sale of the business, with appropriate safeguards.",
        },
      ],
    },
    {
      id: "retention",
      title: "Retention",
      blocks: [
        {
          type: "p",
          text: "We keep account and workspace data while the account is active. You can delete or cancel invoices according to product rules (paid invoices are not hard-deleted). Session cookies last as configured by Auth. Magic-link return cookies expire in minutes. Logs are kept only as long as needed for security and debugging. You may request deletion of your account data at the privacy email; we will retain what we must for legal, dispute, or security reasons.",
        },
      ],
    },
    {
      id: "rights",
      title: "Your rights",
      blocks: [
        {
          type: "p",
          text: "Depending on where you live, you may have rights to access, correct, delete, restrict, or port personal data, to object to certain processing, and to withdraw consent. Email the privacy address. If you are in the EEA or UK, you may complain to your supervisory authority (for example the ICO in the UK). If you are in California, you may have additional rights under the CCPA/CPRA; we do not sell or share personal information as those terms are defined for advertising.",
        },
        {
          type: "p",
          text: "Issuers who store client data in Puyer remain responsible for their own privacy notices to those clients.",
        },
      ],
    },
    {
      id: "transfers",
      title: "International transfers",
      blocks: [
        {
          type: "p",
          text: "Our hosts and processors may store or process data in the United States and other countries. Where required, we rely on appropriate transfer tools (such as standard contractual clauses) used by those providers.",
        },
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        {
          type: "p",
          text: "Puyer is for business use. We do not knowingly collect data from children under 16 (or the age required in your country). If you believe we have, contact us and we will delete it.",
        },
      ],
    },
    {
      id: "changes",
      title: "Changes",
      blocks: [
        {
          type: "p",
          text: `We will update this page when our practices change. The date at the top is the latest revision (${LEGAL_UPDATED}). Material changes may also be noted in-product.`,
        },
      ],
    },
  ],
};

export const termsOfService: LegalDocument = {
  slug: "terms",
  title: "Terms of Service",
  description: `Rules for using ${LEGAL_PRODUCT}.`,
  updated: LEGAL_UPDATED,
  intro: `These Terms are an agreement between you and ${LEGAL_OPERATOR} for use of ${LEGAL_PRODUCT} at ${LEGAL_SITE}. By creating an account or using the service, you agree to them. If you use Puyer for an organization, you represent that you can bind that organization.`,
  sections: [
    {
      id: "service",
      title: "The service",
      blocks: [
        {
          type: "p",
          text: "Puyer is invoicing software. You can create invoices, manage clients and products, generate PDFs, share unguessable public links, track status, connect your Stripe account, configure reminders on paid plans, view reports, and subscribe to Puyer Pro or Puyer Business.",
        },
        {
          type: "p",
          text: "Puyer is not a bank, payment institution, or tax adviser. Puyer does not hold your customers’ funds, does not charge application fees on invoice payments, and does not act as merchant of record for those invoices. Payments for your invoices are processed directly through your connected Stripe account. Stripe’s terms apply to those payments. You are responsible for taxes, invoicing rules, and how you use documents you create.",
        },
      ],
    },
    {
      id: "account",
      title: "Accounts",
      blocks: [
        {
          type: "p",
          text: "You sign in with an email magic link. Keep access to that inbox. You are responsible for activity under your account and for inviting only people who should see your workspace. We may temporarily or permanently restrict accounts or workspaces that abuse the service, violate these Terms, or present a security risk. When we do, we store the reason and email it to the affected users with what they can do next.",
        },
      ],
    },
    {
      id: "content",
      title: "Your content",
      blocks: [
        {
          type: "p",
          text: "You retain rights in the invoices, client lists, and other content you upload. You grant us a limited license to host, display, and transmit that content solely to operate Puyer (including PDFs, public pages, and email you send). You must have the right to use the data you enter, including personal data of your clients.",
        },
        {
          type: "p",
          text: "Every issued invoice includes a short platform note: the document was created with Puyer; Puyer is software only; you are responsible for the document. That note is product copy, not a waiver of any rights a court would not allow us to waive.",
        },
      ],
    },
    {
      id: "payments-stripe",
      title: "Stripe Connect and invoice payments",
      blocks: [
        {
          type: "p",
          text: "To accept card payments on invoices, you connect your own Stripe account. You complete Stripe’s onboarding and stay in good standing with Stripe. Chargebacks, refunds, and negative balances on that account are between you and Stripe / your customer. Puyer does not capture invoice funds onto the platform, does not use destination charges or separate charges and transfers for invoice pay, and does not take a percentage of invoice payments.",
        },
      ],
    },
    {
      id: "subscriptions",
      title: "Puyer subscriptions",
      blocks: [
        {
          type: "p",
          text: "Puyer Pro and Puyer Business are billed by Stripe on our platform. Features, prices, and billing periods are shown on /pricing and in Billing. Paid features (for example automatic reminders or team seats, as described in-product) require an active plan. Taxes on the subscription may apply. You can cancel in Billing; access continues until the end of the paid period unless the product says otherwise.",
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        {
          type: "ul",
          items: [
            "Do not use Puyer for fraud, illegal goods, or to mislead payers.",
            "Do not probe, overload, or bypass security, rate limits, or other users’ workspaces.",
            "Do not reverse engineer the service except as allowed by law.",
            "Do not upload malware or content you do not have rights to use.",
          ],
        },
      ],
    },
    {
      id: "availability",
      title: "Availability and changes",
      blocks: [
        {
          type: "p",
          text: "We aim for a reliable service but do not guarantee uninterrupted access. We may change features, provided we do not silently change the invoice-payment model described above. We may discontinue the service with reasonable notice where practicable.",
        },
      ],
    },
    {
      id: "disclaimer",
      title: "Disclaimers",
      blocks: [
        {
          type: "p",
          text: "The service is provided “as is” to the extent permitted by law. We do not warrant that invoices will meet every legal or accounting requirement in your jurisdiction. You remain responsible for the contents of your invoices and for compliance with bookkeeping, VAT/sales tax, and consumer rules that apply to you.",
        },
      ],
    },
    {
      id: "liability",
      title: "Liability",
      blocks: [
        {
          type: "p",
          text: "Nothing in these Terms limits liability that cannot be limited under applicable law (for example fraud, or death or personal injury caused by negligence where that cannot be excluded). Subject to that, we are not liable for indirect, incidental, or consequential damages, or for lost profits, lost data, or business interruption, arising from use of the software. Our aggregate liability for claims relating to the service in any twelve-month period is limited to the greater of (a) the fees you paid us for Puyer subscriptions in that period and (b) one hundred US dollars. That clause allocates commercial risk for a software tool; it does not erase duties the law still imposes.",
        },
      ],
    },
    {
      id: "law",
      title: "Governing law",
      blocks: [
        {
          type: "p",
          text: "These Terms are governed by the laws of the State of Delaware, USA, excluding conflict-of-law rules, except that mandatory consumer protection laws of your country of residence continue to apply. Courts in Delaware have exclusive jurisdiction, except where the law gives you the right to sue in your home courts.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        { type: "p", text: contactLine },
      ],
    },
  ],
};

export const cookiePolicy: LegalDocument = {
  slug: "cookies",
  title: "Cookie Policy",
  description: `Cookies and similar storage ${LEGAL_PRODUCT} uses, and how to choose.`,
  updated: LEGAL_UPDATED,
  intro: `This policy describes cookies and similar technologies (including localStorage) on ${LEGAL_SITE}. It should be read with the Privacy Policy. The cookie window on the site lets you accept, reject, or customize optional categories.`,
  sections: [
    {
      id: "what",
      title: "What cookies are",
      blocks: [
        {
          type: "p",
          text: "Cookies are small files stored on your device. We also use localStorage for a few preferences. Some cookies are strictly necessary to sign you in and keep the service secure. Optional categories (analytics and marketing) are off until you opt in. We do not currently load advertising pixels or third-party analytics; those categories exist so we can respect a choice if we add them later.",
        },
      ],
    },
    {
      id: "types",
      title: "Categories",
      blocks: [
        {
          type: "ul",
          items: [
            "Necessary — required for sign-in, security, and remembering this cookie choice. These run without a separate opt-in.",
            "Preferences — first-party appearance storage (theme) for pages that still honor it.",
            "Analytics — measurement of how the product is used. Not loaded today. If added, they will not run unless you allow Analytics.",
            "Marketing — advertising or cross-site tracking. Not used today. Will not run unless you allow Marketing.",
          ],
        },
        {
          type: "p",
          text: "UK PECR (as amended in 2026) and EU ePrivacy rules treat strictly necessary and some low-risk first-party storage differently from advertising. We still show a choice window so you can reject optional categories and reopen settings at any time from the footer or this page.",
        },
      ],
    },
    {
      id: "list",
      title: "Cookies and storage we use",
      blocks: [
        {
          type: "table",
          headers: ["Name", "Category", "Where", "Duration", "Purpose"],
          rows: COOKIE_INVENTORY.map((item) => [
            item.name,
            item.category,
            item.storage,
            item.duration,
            item.purpose,
          ]),
        },
      ],
    },
    {
      id: "manage",
      title: "How to manage cookies",
      blocks: [
        {
          type: "p",
          text: "Use Accept all, Reject optional, or Customize in the cookie window. Choose Cookie settings in the site footer to open it again. You can also delete cookies and site data in your browser; that will sign you out and may show the window again.",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        { type: "p", text: contactLine },
      ],
    },
  ],
};

export const legalDocuments = [privacyPolicy, termsOfService, cookiePolicy] as const;

export function legalDocumentBySlug(slug: string): LegalDocument | undefined {
  return legalDocuments.find((doc) => doc.slug === slug);
}
