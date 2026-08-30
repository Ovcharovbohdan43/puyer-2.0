import { readFileSync } from "node:fs";
import { join } from "node:path";

import hostedMailer from "../../supabase/templates/hosted-mailer.json";

export type HostedAuthTemplateSpec = {
  id: string;
  file: string;
  subject: string;
  subjectKey: string;
  contentKey: string;
};

export const HOSTED_AUTH_TEMPLATES = hostedMailer as HostedAuthTemplateSpec[];

export function templatesDir(cwd = process.cwd()): string {
  return join(cwd, "supabase", "templates");
}

export function hostedAuthTemplatePatch(cwd = process.cwd()): Record<string, string> {
  const dir = templatesDir(cwd);
  const body: Record<string, string> = {};
  for (const spec of HOSTED_AUTH_TEMPLATES) {
    const html = readFileSync(join(dir, spec.file), "utf8");
    if (spec.file === "magic_link.html" || spec.file === "email_change.html") {
      if (!html.includes("{{ .TokenHash }}") || !html.includes("/auth/confirm")) {
        throw new Error(`${spec.file} must link to /auth/confirm with {{ .TokenHash }}`);
      }
    } else if (!html.includes("{{ .ConfirmationURL }}")) {
      throw new Error(`${spec.file} is missing {{ .ConfirmationURL }}`);
    }
    body[spec.subjectKey] = spec.subject;
    body[spec.contentKey] = html;
  }
  return body;
}

export function projectRefFromSupabaseUrl(url: string): string {
  const host = new URL(url).hostname;
  const ref = host.split(".")[0]?.trim() ?? "";
  if (!ref) {
    throw new Error("Could not read project ref from NEXT_PUBLIC_SUPABASE_URL.");
  }
  return ref;
}
