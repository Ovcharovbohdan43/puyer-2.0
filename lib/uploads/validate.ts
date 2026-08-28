import { ValidationError } from "@/lib/errors";

export const ALLOWED_LOGO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function sanitizeUploadFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "upload";
  const cleaned = base.replace(/[^A-Za-z0-9._-]/g, "-").replace(/^\.+/, "").slice(0, 80);
  return cleaned || "upload";
}

export function sniffImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function validateLogoUpload(input: { mime: string; size: number; fileName: string; bytes?: Uint8Array }): {
  fileName: string;
  mime: string;
} {
  const fileName = sanitizeUploadFileName(input.fileName);
  const extIndex = fileName.lastIndexOf(".");
  const ext = extIndex >= 0 ? fileName.slice(extIndex).toLowerCase() : "";
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError("Use a JPEG, PNG, or WebP image.");
  }
  if (input.size <= 0 || input.size > MAX_LOGO_BYTES) {
    throw new ValidationError("Image must be 2 MB or smaller.");
  }
  const declared = input.mime.toLowerCase();
  if (input.bytes) {
    const sniffed = sniffImageMime(input.bytes);
    if (!sniffed) {
      throw new ValidationError("Use a JPEG, PNG, or WebP image.");
    }
    if (declared !== "application/octet-stream" && declared !== sniffed) {
      throw new ValidationError("Use a JPEG, PNG, or WebP image.");
    }
    return { fileName, mime: sniffed };
  }
  if (!ALLOWED_LOGO_MIME.has(declared)) {
    throw new ValidationError("Use a JPEG, PNG, or WebP image.");
  }
  return { fileName, mime: declared };
}
