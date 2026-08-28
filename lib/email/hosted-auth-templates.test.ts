import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HOSTED_AUTH_TEMPLATES,
  hostedAuthTemplatePatch,
  projectRefFromSupabaseUrl,
} from "@/lib/email/hosted-auth-templates";

describe("hosted Auth email templates", () => {
  it("builds a Management API patch with only mailer subject and HTML fields", () => {
    const patch = hostedAuthTemplatePatch();
    const keys = Object.keys(patch);
    expect(keys).toHaveLength(HOSTED_AUTH_TEMPLATES.length * 2);
    expect(keys.every((key) => key.startsWith("mailer_"))).toBe(true);
    expect(keys.some((key) => key.includes("smtp"))).toBe(false);
    expect(patch.mailer_subjects_magic_link).toBe("Sign in to Puyer");
    expect(patch.mailer_templates_magic_link_content).toContain("Sign in to Puyer");
    expect(patch.mailer_templates_magic_link_content).toContain("{{ .ConfirmationURL }}");
    expect(patch.mailer_templates_magic_link_content).not.toContain("<h2>Your sign-in link</h2>");
    expect(patch.mailer_templates_magic_link_content).not.toContain(
      "Follow the link below to sign in. This link expires shortly and can only be used once.",
    );
  });

  it("keeps GoTrue placeholders in every dashboard template file", () => {
    const dir = join(process.cwd(), "supabase", "templates");
    for (const spec of HOSTED_AUTH_TEMPLATES) {
      const html = readFileSync(join(dir, spec.file), "utf8");
      expect(html, spec.file).toContain("{{ .ConfirmationURL }}");
      expect(html, spec.file).not.toContain("{{{");
    }
  });

  it("reads the project ref from the public Supabase URL", () => {
    expect(projectRefFromSupabaseUrl("https://rtbycqyzzjvcqaqcnuuh.supabase.co")).toBe("rtbycqyzzjvcqaqcnuuh");
  });
});
