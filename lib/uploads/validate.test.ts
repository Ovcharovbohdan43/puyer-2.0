import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/errors";
import { sanitizeUploadFileName, sniffImageMime, validateLogoUpload } from "@/lib/uploads/validate";

describe("logo upload validation", () => {
  it("sanitizes names and rejects disallowed types and sizes", () => {
    expect(sanitizeUploadFileName("../../etc/passwd.png")).toBe("passwd.png");
    expect(sanitizeUploadFileName("Acme Logo!.PNG")).toBe("Acme-Logo-.PNG");
    expect(() =>
      validateLogoUpload({ mime: "application/pdf", size: 12, fileName: "x.pdf" }),
    ).toThrow(ValidationError);
    expect(() =>
      validateLogoUpload({ mime: "image/png", size: 3 * 1024 * 1024, fileName: "x.png" }),
    ).toThrow(ValidationError);
    expect(validateLogoUpload({ mime: "image/png", size: 12, fileName: "logo.png" })).toEqual({
      fileName: "logo.png",
      mime: "image/png",
    });
  });

  it("sniffs magic bytes so a renamed executable is rejected", () => {
    expect(sniffImageMime(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(sniffImageMime(Uint8Array.from([0x00, 0x01, 0x02, 0x03]))).toBeNull();
    expect(() =>
      validateLogoUpload({
        mime: "image/png",
        size: 4,
        fileName: "logo.png",
        bytes: Uint8Array.from([0x00, 0x01, 0x02, 0x03]),
      }),
    ).toThrow(ValidationError);
  });
});
