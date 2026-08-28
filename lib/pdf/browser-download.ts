export async function downloadPdfResponse(url: string, fallbackName: string): Promise<void> {
  const response = await fetch(url);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("pdf")) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "pdf");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const disposition = response.headers.get("content-disposition");
  const match = /filename="([^"]+)"/.exec(disposition ?? "");
  link.href = objectUrl;
  link.download = match?.[1] ?? fallbackName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
