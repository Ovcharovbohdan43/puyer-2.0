# Theme

## Purpose

Manual light/dark theming for Puyer. Public default is **light**. The choice is stored in `localStorage` under `puyer-theme` and applied with `html[data-theme]`.

## Description

The landing page was built from Figma with hardcoded light utilities (`bg-white`, `text-black`, `border-[#e2e8f0]`, …). Toggling `data-theme` on `<html>` used to restyle only the header.

The current approach (Tailwind CSS v4):

1. **CSS tokens** on `:root` and `html[data-theme="dark"]` (`--background`, `--foreground`, `--puyer-*`).
2. **`@custom-variant dark`** keyed to `[data-theme=dark]`, not `prefers-color-scheme`. First visit stays light, matching [`UX_FLOWS.md`](./UX_FLOWS.md).
3. **Blocking bootstrap** via `InlineScript` in `app/layout.tsx` (`THEME_BOOTSTRAP_SCRIPT`). SSR emits `type="text/javascript"` so it runs before paint. After hydration it becomes `type="text/plain"` so React 19 does not warn about a live `<script>` on client navigations (including the magic-link redirect).
4. **Compatibility remaps** under `html[data-theme="dark"]` so existing Figma hex classes invert without a full class rewrite. New UI should prefer tokens (`bg-background`, `text-foreground`, `border-puyer-border`, `dark:`).
5. **Invoice preview follows the theme.** `.invoice-paper` uses the same card tokens. Soft panels use `bg-puyer-soft` (not `#F8FAFC`). Black accent `#000000` maps to `--invoice-accent` so totals stay visible. Form fields use `bg-puyer-card` plus `color-scheme: dark` so native date/text inputs do not stay white. PDF export remains a light document. Landing `.template-mockup` still forces light paper.
6. **Public payer portal (`/invoice/[publicId]`)** uses tokens (`bg-puyer-card`, `text-puyer-ink`, `text-puyer-muted`, `border-puyer-border`), not Figma uppercase hex. `bg-white` remaps in dark mode, but `text-[#0B1C30]` does not — that mix made invoice text invisible.

The header control is a moon icon in light mode and a sun icon in dark mode (inline geometric SVG, `currentColor`). Labels live in `aria-label`. **Landing, `/pricing`, `/login`, and the authenticated dashboard do not show this control.** The dashboard is always light (`.app-shell`) and must not overwrite `puyer-theme` in localStorage. Dark theme still applies to the public invoice page if `puyer-theme` is `dark`; that page shows the moon/sun control.

## How to use

Click the moon/sun button on `/invoice/[publicId]`. Preference persists across reloads. Visiting the dashboard does not clear it.

Programmatic:

```ts
import { parseStoredTheme, THEME_STORAGE_KEY } from "@/lib/theme";
```

`ThemeProvider` in `components/ui/theme.tsx` syncs React state with `document.documentElement.dataset.theme`.

## Examples

- Light (default): white canvas, `#006c49` CTAs, Figma borders `#e2e8f0`.
- Dark: slate canvas `#0b1017`, elevated cards `#141b24`, slate solid actions `#2a3546`, invoice preview on a dark card.
- Native form controls follow `color-scheme` on `<html>`.

## How to test

```bash
npm run test
npm run typecheck
npm run dev
```

Browser:

- Header shows a moon on the public invoice page (not landing, `/pricing`, `/login`, or the dashboard).
- Landing and `/pricing` stay white with no moon/sun control, even if dark was stored from the app.
- Download PDF stays a dark solid button (not inverted to white).
- Black accent on the preview becomes light ink so totals stay readable.
- Reload with dark selected does not flash white.
- After a magic-link login, the overlay `Encountered a script tag while rendering React component` must not appear.
- `/pricing` stays light (same as landing). The dashboard is always light. Dark theme is only for the public invoice page if stored.
- `/invoice/{publicId}` stays readable in both themes (no dark-on-dark text).
- Green CTAs stay readable. Footer/trust blocks stay dark.

## Limitations

- Existing marketing classes still use Figma hex values; dark mode maps those in CSS rather than rewriting every component.
- OS `prefers-color-scheme` is ignored until a logged-in user preference exists (later phase).
- Theme is device-local until it is stored on `User` (see `PLAN.md`).

## Modules

- `app/globals.css`, `app/layout.tsx`
- `lib/theme.ts`, `lib/theme.test.ts`
- `components/ui/inline-script.tsx`, `components/ui/inline-script.test.ts`
- `components/ui/theme.tsx`, `components/ui/theme-toggle.tsx`
- `components/marketing/public-header.tsx`
- `components/auth/login-page.tsx`
- `components/invoice-builder/invoice-preview.tsx`
- `components/invoice/public-invoice-screen.tsx`, `components/invoice/public-pay-panel.tsx`
- `messages/en.json` (`header.themeLight`, `header.themeDark`)

## Version

1.0.10 — 2026-08-29

## Changelog

```
[2026-08-29] – Fixed: Dashboard light shell does not persist over the payer-portal theme; public invoice has the moon/sun control.
[2026-08-29] – Changed: Landing trust bar stays dark; icons are Phosphor, not Figma SVGs.
[2026-08-29] – Changed: Dashboard is light-only; Overview moon removed.
[2026-08-29] – Changed: Invoice preview scrollbar is hidden (scroll still works).
[2026-08-29] – Changed: Landing and `/pricing` stay light (no public theme toggle).
[2026-08-29] – Fixed: Dark theme no longer paints builder fields and Premium
  invoice panels white (tokens + native input color-scheme).
[2026-08-29] – Changed: `/login` has no moon/sun control and keeps a white canvas.
[2026-08-28] – Fixed: Public payer portal uses theme tokens so dark mode is not dark-on-dark.
[2026-08-28] – Fixed: Theme bootstrap no longer renders a live `<script>`
  during client React work (magic-link / dashboard hydration overlay).
[2026-08-27] – Added: Full dark theme via CSS tokens, data-theme, and
  Tailwind v4 @custom-variant. Moon/sun header control. Invoice paper
  stays light.
[2026-08-27] – Changed: Dark mode covers remaining chrome — invoice
  preview, solid actions (Download PDF), monochrome icons, scrollbars,
  date pickers. Black buttons stay dark instead of inverting to white.
```
