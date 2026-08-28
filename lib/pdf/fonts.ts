import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Font } from "@react-pdf/renderer";

import { hyphenatePdfWord } from "@/lib/pdf/hyphenate";

let registered = false;

function fontsDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "fonts");
}

/** Noto Sans (SIL OFL) — Helvetica has no Cyrillic and produces `?` in the PDF. */
export function ensurePdfFonts(): void {
  if (registered) {
    return;
  }
  const dir = fontsDir();
  const regular = path.join(dir, "NotoSans-Regular.ttf");
  const bold = path.join(dir, "NotoSans-Bold.ttf");
  if (!existsSync(regular) || !existsSync(bold)) {
    throw new Error(`PDF fonts missing under ${dir}`);
  }
  Font.register({
    family: "Noto Sans",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback(hyphenatePdfWord);
  registered = true;
}
