/** Split unbreakable tokens so @react-pdf/renderer can wrap them. */
export function hyphenatePdfWord(word: string): string[] {
  if (!word) {
    return [""];
  }
  const chars = Array.from(word);
  if (chars.length <= 12) {
    return [word];
  }
  const parts: string[] = [""];
  for (const char of chars) {
    parts.push(char);
    parts.push("");
  }
  return parts;
}

/** Insert zero-width spaces so long tokens wrap even when hyphenation is skipped. */
export function wrapPdfText(value: string): string {
  return value.replace(/[^\s\u200B]{12,}/gu, (token) => {
    const chars = Array.from(token);
    const chunks: string[] = [];
    for (let index = 0; index < chars.length; index += 8) {
      chunks.push(chars.slice(index, index + 8).join(""));
    }
    return chunks.join("\u200B");
  });
}
