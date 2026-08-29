import type { Metadata } from "next";

import { CookieSettingsButton } from "@/components/cookies/cookie-settings-button";
import { LegalArticle } from "@/components/legal/legal-article";
import { PublicChrome } from "@/components/marketing/public-chrome";
import { legalDocumentBySlug } from "@/lib/legal/policies";

function LegalPage({ slug }: { slug: "privacy" | "terms" | "cookies" }) {
  const document = legalDocumentBySlug(slug);
  if (!document) {
    return null;
  }
  return (
    <PublicChrome>
      <main className="min-h-screen bg-white">
        <LegalArticle document={document} />
      </main>
    </PublicChrome>
  );
}

export function legalMetadata(slug: "privacy" | "terms" | "cookies"): Metadata {
  const document = legalDocumentBySlug(slug);
  return {
    title: `${document?.title ?? "Legal"} — Puyer`,
    description: document?.description,
  };
}

export function PrivacyPage() {
  return <LegalPage slug="privacy" />;
}

export function TermsPage() {
  return <LegalPage slug="terms" />;
}

export function CookiesPage() {
  const document = legalDocumentBySlug("cookies");
  if (!document) {
    return null;
  }
  return (
    <PublicChrome>
      <main className="min-h-screen bg-white">
        <LegalArticle document={document} />
        <div className="mx-auto max-w-[760px] px-5 pb-16 sm:px-10">
          <CookieSettingsButton className="rounded-full bg-[#006c49] px-6 py-3 text-[12px] font-semibold tracking-[0.6px] text-white" />
        </div>
      </main>
    </PublicChrome>
  );
}
