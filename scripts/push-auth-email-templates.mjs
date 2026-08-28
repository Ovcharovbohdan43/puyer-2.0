import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const cwd = process.cwd();
const specs = JSON.parse(readFileSync(join(cwd, "supabase/templates/hosted-mailer.json"), "utf8"));

function loadDotEnv(path) {
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function projectRefFromSupabaseUrl(url) {
  return new URL(url).hostname.split(".")[0];
}

function hostedAuthTemplatePatch() {
  const dir = join(cwd, "supabase/templates");
  const body = {};
  for (const spec of specs) {
    const html = readFileSync(join(dir, spec.file), "utf8");
    if (!html.includes("{{ .ConfirmationURL }}")) {
      throw new Error(`${spec.file} is missing {{ .ConfirmationURL }}`);
    }
    body[spec.subjectKey] = spec.subject;
    body[spec.contentKey] = html;
  }
  return body;
}

loadDotEnv(join(cwd, ".env.local"));

const DEFAULT_PROJECT_REF = "rtbycqyzzjvcqaqcnuuh";
const token = (process.env.SUPABASE_ACCESS_TOKEN || "").trim();
const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const ref =
  (process.env.SUPABASE_PROJECT_REF || "").trim() ||
  (url ? projectRefFromSupabaseUrl(url) : "") ||
  DEFAULT_PROJECT_REF;

if (!token) {
  console.error(
    [
      "Hosted Auth templates were not updated.",
      "HTML in supabase/templates is not loaded by cloud Auth until you PATCH the project.",
      "Set SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)",
      "then run: npm run auth:push-templates",
    ].join("\n"),
  );
  process.exit(1);
}

const body = hostedAuthTemplatePatch();
const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(body),
});

if (!response.ok) {
  const text = await response.text();
  console.error(`Management API ${response.status}: ${text.slice(0, 500)}`);
  process.exit(1);
}

const saved = await response.json();
if (saved.mailer_subjects_magic_link !== "Sign in to Puyer") {
  console.error("Patch succeeded but magic-link subject was not saved as Sign in to Puyer.");
  process.exit(1);
}

console.log(`Pushed ${Object.keys(body).length / 2} Auth email templates to project ${ref}.`);
