import type { BuilderState } from "@/components/invoice-builder/types";

export async function ensureLogoUploaded(state: BuilderState): Promise<BuilderState> {
  const url = state.logoUrl.trim();
  if (!url.startsWith("blob:") && !url.startsWith("data:")) {
    return state;
  }
  const blob = await (await fetch(url)).blob();
  const form = new FormData();
  form.set("file", new File([blob], "logo.png", { type: blob.type || "image/png" }));
  const response = await fetch("/api/logos", { method: "POST", body: form });
  const payload = (await response.json()) as { ok?: boolean; url?: string; error?: string };
  if (!response.ok || !payload.url) {
    throw new Error(payload.error ?? "Could not upload the logo.");
  }
  return { ...state, logoUrl: payload.url };
}
