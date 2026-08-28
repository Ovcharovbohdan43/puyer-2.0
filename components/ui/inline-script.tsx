"use client";

/**
 * Blocking inline script that is executable in SSR HTML and inert on the client.
 * React 19 warns if a Client Component tree renders a live `<script>` tag.
 * Next.js: typeof window is undefined during SSR (type javascript) and defined
 * after hydration (type plain). suppressHydrationWarning covers the type swap.
 */
export function inlineScriptType(): "text/javascript" | "text/plain" {
  return typeof window === "undefined" ? "text/javascript" : "text/plain";
}

export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={inlineScriptType()}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
