# Implementation Plan: Astro + Payload Migration

Companion to the [design doc](2026-07-17-astro-payload-migration-design.md).
Updated for the deployed-CMS reality: gigawatt-cms runs on Firebase App Hosting
(`https://gigawatt-cms--gigawatt-lab.us-central1.hosted.app`), and site repos
manage their tenant content through the REST API per the CMS repo's
`docs/tenant-seeding.md`. Scripts therefore live in this repo and use REST with
a tenant editor account — not the Payload Local API.

## Track 1 — CMS additions (gigawatt-cms repo, branch `pathway-academy`)

1. `gallery` block in `src/blocks/index.ts`: `images` array of
   `{ image: upload → media, caption?: text }` (min 1), `layout` select
   `grid | masonry` (default `grid`).
2. `contact` group on the Footer collection: `phone`, `email`, `address`.
3. Regenerate `payload-types.ts`; create the Postgres migration.
4. Push branch; merging to main deploys — Gigawatt admin (Timothy) merges.

Manual admin steps (cannot be scripted per tenant-seeding guide):
- Create the `pathway-academy` tenant (name, slug, domain, logo, brand colors).
- Create a `client-editor` user assigned to the tenant.
- After Netlify site exists: paste its build hook URL into the tenant record.

## Track 2 — Astro site (this repo)

- Astro + Tailwind, `output: 'static'`.
- `src/lib/payload.ts`: fetch helpers hitting `PAYLOAD_URL`, filtered by
  `where[tenant.slug][equals]=pathway-academy`, `depth=2`, published only.
  Build fails hard on unreachable CMS or zero pages.
- Blocks: Hero, RichText, StatsBand, ServicesPreview, Faq, Testimonials,
  CtaBand, Gallery — dispatched by `BlockRenderer.astro`; unknown types warn
  and render nothing.
- `layouts/Base.astro` pulls Navigation, Footer (incl. contact group),
  SeoSettings.
- Routes: `pages/[...slug].astro` (from Pages docs, `home` → `/`),
  `blog/index.astro`, `blog/[slug].astro`, plus a static contact form section
  using Netlify Forms markup (`data-netlify`, hidden static mirror form for
  build-time detection).
- Islands: mobile nav toggle, gallery lightbox. Nothing else ships JS.
- `scripts/check-dist.mjs`: post-build assertion that key pages exist in
  `dist/` with marker text.
- `netlify.toml`: build command runs `astro build && node scripts/check-dist.mjs`.

## Track 3 — Seed + migration scripts (this repo, `scripts/`)

- `seed-content.mjs`: idempotent upserts of pages (home, about, gallery,
  contact), navigation, footer, seo-settings — with the real copy extracted
  from the old CRA components. Conventions from the CMS `tenant-seeding.md`:
  env creds (`CMS_URL`, `CMS_EMAIL`, `CMS_PASSWORD`), never send `tenant`,
  `_status: 'published'`, media first.
- `migrate-firebase.mjs`: reads Firestore `blogPosts` and `gallery` via the
  public Firestore REST API (the old site reads them client-side, so rules
  allow it), downloads Storage images, uploads to `/api/media` (idempotent by
  filename), creates Posts (original publish dates, title-derived slugs),
  seeds the Gallery page's gallery block, and writes
  `public/_redirects` entries for `/blog/<old-id> → /blog/<slug>`.

## Order of execution

1. Track 1 branch + Track 2 scaffold in parallel (site can be built against
   existing blocks; gallery block renders once CMS branch is deployed).
2. Admin: merge CMS branch, create tenant + editor.
3. Run `seed-content.mjs`, then `migrate-firebase.mjs`.
4. Netlify: create site from repo, set `PAYLOAD_URL`, create build hook,
   paste into tenant record, enable form notifications.
5. Verify preview → DNS cutover → decommission Firebase Hosting/functions.
