# BUG-01 Mobile menu has no background below the header

- **Status:** Ready
- **Covers:** "The mobile navigation … is translucent"
- **Pages:** every page (the header is in the shared layout), phone and tablet widths below `lg` (1024 px)
- **Depends on:** none
- **Size:** S
- **Risk flags:** none
- **Source:** clients/pathway-academy/updates/2026-11-12-pathways-mobile-mac/ · checked at f31acb9

## Why

When the menu opens on a phone, the cream panel and the dimmed backdrop only cover the header bar. The links are drawn straight over the hero text, so the menu is hard to read and looks broken.

## What the visitor sees

1. On a phone, the visitor taps the menu button (☰) in the header.
2. **Today:** a cream strip shows the logo and ✕. Home / About / Gallery / Blog / Contact and "Come Visit Us" float over the page with nothing behind them.
3. **After:** the full-height cream panel slides in from the right, the page behind is dimmed and blurred, and the links and the "Come Visit Us" button sit on the solid panel.
4. Tapping ✕, the backdrop, or a link closes the menu, as today.

## Design

- Reference: match the existing block. The panel's markup and styling stay as they are; only where it sits in the DOM changes.
- States: menu closed (unchanged) / menu open (full-height panel over a dimmed page).
- Phone and desktop: desktop (≥ 1024 px) is unchanged; the desktop nav never shows the mobile menu.

## Architecture

- **Cause:** `src/components/Header.astro:14`. The `<header>` has `backdrop-blur` (`backdrop-filter`), which makes it the containing block for every `position: fixed` descendant. `#mobile-menu`, `#menu-backdrop` and the panel (`Header.astro:61–63`) sit inside the header, so `inset-0` and `inset-y-0` measure against the header (~88 px), not the viewport.
- **Fix (recommended):** move the whole `<div id="mobile-menu">…</div>` block (lines 61–90) out of `<header>` so it becomes the header's next sibling in the same component. The header keeps its translucent blur when the menu is closed, the IDs and the `<script>` stay the same, and `z-50` on the menu still stacks above the header's `z-40`.
- **Rejected alternative:** dropping `backdrop-blur` from the header also fixes it, but it changes how the sticky header looks on every page.
- **Content:** none
- **Components / layouts:** `src/components/Header.astro` only
- **Netlify:** none
- **Standards:** `accessibility`. Focus order and `aria-controls="mobile-menu"` must still resolve; the menu stays a sibling in the same component, so the ids don't change.
- **Files likely touched:** `src/components/Header.astro`

## Done when

- [ ] On the deploy preview at 390 px wide, opening the menu shows a cream panel from the top of the screen to the bottom, with every link and the "Come Visit Us" button on it and no page text showing through
- [ ] The page behind the panel is dimmed across the whole screen, and tapping it closes the menu
- [ ] ✕ and each link still close the menu; the page doesn't scroll while it's open
- [ ] At ≥ 1024 px the header looks as it did on `main`
- [ ] `npm run validate && npm run build` pass
- [ ] a11y and seo: nothing new on the branch (`tools/a11y.mjs`, `tools/seo.mjs`)
- [ ] compliance: no new CRITICAL (`tools/compliance-check.mjs --baseline`)

## Not included

- The desktop nav, the header's look when the menu is closed, the nav items themselves (`src/content/globals/navigation.json`)
- Any other page or component
- Do-not-touch (`client.md`): none defined yet

## Assumptions

- The screenshot was taken on the live site in iOS Safari. The cause is the same in every browser that implements `backdrop-filter` as a containing block (all current ones).

## Blocked note

—
