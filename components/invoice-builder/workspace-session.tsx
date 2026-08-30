"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  BuilderSessionContext,
} from "@/components/invoice-builder/builder-session";
import {
  isBuilderDirty,
  type BuilderState,
  type InvoiceTemplate,
} from "@/components/invoice-builder/types";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { hasBankTransfer } from "@/lib/invoices/bank-transfer";
import { ensureLogoUploaded } from "@/lib/invoices/upload-logo";
import { prepareBuilderState } from "@/lib/invoices/validate";

type WorkspaceSessionProps = {
  initial: BuilderState;
  invoiceId?: string;
  publicId?: string;
  children: ReactNode;
};

export function WorkspaceSession({ initial, invoiceId, publicId, children }: WorkspaceSessionProps) {
  const router = useRouter();
  const toast = useToast();
  const copy = t("builder");
  const [baseline, setBaseline] = useState(initial);
  const [state, setStateRaw] = useState(initial);
  const [persisting, setPersisting] = useState(false);
  const [savedId, setSavedId] = useState(invoiceId ?? null);
  const [savedPublicId, setSavedPublicId] = useState(publicId ?? null);
  const dirty = isBuilderDirty(state, baseline);
  const persistedId = invoiceId ?? savedId;

  const setState = useCallback((updater: BuilderState | ((current: BuilderState) => BuilderState)) => {
    setStateRaw((current) => (typeof updater === "function" ? updater(current) : updater));
  }, []);

  const persist = useCallback(async () => {
    if (persisting) {
      return null;
    }
    setPersisting(true);
    try {
      let ready = state;
      try {
        ready = await ensureLogoUploaded(state);
      } catch {
        toast(copy.logoUploadFailed);
        return null;
      }
      const response = await fetch(persistedId ? `/api/invoices/${persistedId}` : "/api/invoices", {
        method: persistedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prepareBuilderState(ready)),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        invoice?: { id: string; invoiceNumber: string; publicId: string };
      };
      if (!response.ok || !payload.invoice) {
        toast(payload.error ?? copy.saveFailed);
        return null;
      }
      const next = { ...ready, invoiceNumber: payload.invoice.invoiceNumber };
      setSavedId(payload.invoice.id);
      setSavedPublicId(payload.invoice.publicId);
      setStateRaw(next);
      setBaseline(next);
      toast(
        hasBankTransfer(ready) && ready.storeBankDetailsConsent !== true
          ? copy.savedWithoutBankStorage
          : copy.saved,
      );
      if (!invoiceId) {
        router.replace(`/invoices/${payload.invoice.id}/edit`);
        router.refresh();
      }
      return payload.invoice;
    } catch {
      toast(copy.saveFailed);
      return null;
    } finally {
      setPersisting(false);
    }
  }, [copy.logoUploadFailed, copy.saveFailed, copy.saved, copy.savedWithoutBankStorage, invoiceId, persistedId, persisting, router, state, toast]);

  const onCopyPublicLink = useCallback(() => {
    if (!persistedId) {
      return;
    }
    void fetch(`/api/invoices/${persistedId}/send`, { method: "POST" }).then(() => {
      router.refresh();
    });
  }, [persistedId, router]);

  const value = useMemo(
    () => ({
      authenticated: true,
      state,
      setState,
      dirty,
      discardAndReset: () => {
        setStateRaw(baseline);
      },
      applyTemplate: (template: InvoiceTemplate) => {
        setStateRaw((current) => ({ ...current, template }));
      },
      startInvoice: () => undefined,
      scrollToBuilder: () => undefined,
      openAuth: () => undefined,
      requestNavigate: (href: string) => {
        router.push(href);
      },
      persist,
      persisting,
      invoiceId: persistedId,
      publicUrl: savedPublicId ? `/invoice/${savedPublicId}` : null,
      onCopyPublicLink,
    }),
    [baseline, dirty, onCopyPublicLink, persist, persistedId, persisting, router, savedPublicId, setState, state],
  );

  return <BuilderSessionContext.Provider value={value}>{children}</BuilderSessionContext.Provider>;
}
