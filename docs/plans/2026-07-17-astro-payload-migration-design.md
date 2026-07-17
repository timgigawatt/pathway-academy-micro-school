# Pathway Academy: Astro + Payload Migration Design

**Date:** 2026-07-17
**Status:** Validated

Replace the Create React App + Firebase site (`pathway-acadamy/pathway-academy-site`)
with a fully static Astro site in this repo, deployed to Netlify, with all content
managed in the existing multi-tenant Payload CMS (`gigawatt-cms`).

## Architecture

Three pieces, two of which mostly exist:

1. **CMS — gigawatt-cms (existing, small additions).** Pathway Academy becomes a
   new row in the `tenants` collection (slug `pathway-academy`, domain, logo, brand
   colors, Netlify build hook URL). All content lives in the existing tenant-scoped
   collections: Pages, Posts, Categories, Media, Navigation, Footer, SeoSettings,
   Redirects. CMS code changes are limited to:
   - A new **gallery block** in the Pages block library.
   - A **contact info group** (phone, email, address) on the Footer collection.
2. **Site — this repo.** Astro, fully static output, deployed to Netlify. At build
   time it queries the Payload REST API scoped by tenant and renders each Pages
   block with a matching Astro component. Near-zero client JS.
3. **Publish loop.** Editor publishes in Payload → the existing debounced
   `triggerBuild` hook POSTs the tenant's Netlify build hook → Netlify rebuilds
   and deploys within a couple of minutes. Contact form is plain HTML posting to
   **Netlify Forms** — no backend.

A one-time migration script ports Firebase blog posts and gallery images into
Posts and Media under the new tenant.

## Content Modeling

**Pages** (one document per route, composed of existing blocks):

| Route | Blocks |
|---|---|
| Home | `hero`, `richText` (mission intro), `statsBand`/`servicesPreview` (programs/subjects), `testimonials` (if quotes exist), `ctaBand` → Contact |
| About / Mission | `hero`, `richText` |
| Gallery | new `gallery` block |
| Contact | `richText` copy; the form itself is Astro-rendered Netlify Forms markup, not a block |

**New gallery block** (the one block addition): `images` array of Media uploads
with optional caption, plus a `layout` select (`grid` | `masonry`). No albums or
categories until needed.

**Blog:** existing Posts collection as-is (title, slug, Lexical body, featured
image, category, publish date). Astro renders `/blog` and `/blog/[slug]`.

**Navigation & Footer:** header links from the tenant's Navigation doc. Footer
gains the contact group alongside its existing social links. The live Facebook
feed embed from the old site is **dropped** in favor of a "Follow us" social link.

## Astro Site Structure

```
src/
  lib/payload.ts        # typed fetch helpers: getPage(slug), getPosts(), getGlobals()
  components/blocks/    # one .astro component per block: Hero, RichText, Gallery, CtaBand...
  components/           # Header, Footer, PostCard, Lightbox (island)
  layouts/Base.astro    # <head> from SeoSettings, header/footer from Navigation/Footer
  pages/
    [...slug].astro     # getStaticPaths from Pages docs → renders block list
    blog/index.astro
    blog/[slug].astro
```

- `payload.ts` hits `PAYLOAD_URL` (env var) REST endpoints at build time, always
  filtered by `where[tenant.slug][equals]=pathway-academy`, with `depth=2` so media
  and relationships come back resolved.
- `BlockRenderer.astro` maps `blockType` → component. Unknown block types render
  nothing (logged as a build warning), so blocks added for other tenants can't
  break this site.
- Rich text is Lexical JSON, rendered at build time with the
  `@payloadcms/richtext-lexical` HTML converter.
- **Images:** Astro `<Image>` with remote patterns pulls CMS media at build time;
  the deployed site serves optimized local copies. A CMS outage only blocks
  rebuilds, never visitors.
- **Styling:** Tailwind. Pathway's brand palette is hardcoded in the Astro theme
  config (not read from the tenant's `brandColors` field — one site, one palette).
- **Islands:** mobile nav toggle and gallery lightbox only.

## Migration

Source data: Firestore `blogPosts` and `gallery` (ordered by `order`) collections;
images in the `pathway-academy.firebasestorage.app` Storage bucket.

One-time Node script in the gigawatt-cms repo (`scripts/migrate-pathway.ts`) using
Payload's **Local API** (bypasses auth, handles uploads):

1. Read Firestore via `firebase-admin` with a service-account key.
2. Gallery docs → download Storage image, create Media doc under the Pathway
   tenant (caption + preserved `order`), collect IDs to seed the Gallery page's
   gallery block.
3. Blog posts → download featured image to Media, convert body to Lexical
   (Payload's HTML→Lexical converter; trivial paragraph mapping if bodies are
   plain text), create Posts doc with original publish date and a title-derived
   slug.
4. Idempotent: checks by slug/filename before creating; safe to re-run.
5. Emits an old-ID → new-slug mapping file for redirects.

## Deployment & Publish Pipeline

- Netlify site linked to this GitHub repo: `npm run build`, publish `dist/`,
  `PAYLOAD_URL` env var.
- Netlify **build hook** URL pasted into the Pathway tenant record; the existing
  `triggerBuild` hook (debounced per tenant) does the rest.
- Contact form: hidden static HTML form in the repo for Netlify's build-time
  detection; email notifications enabled in the Netlify UI.

## Error Handling

- Build **fails hard** if Payload is unreachable or returns no pages — Netlify
  keeps the last good deploy live.
- Only `_status=published` content is fetched; drafts never leak.
- Unknown block types render nothing, with a build warning.

## URL Parity & Redirects

Old blog URLs use Firestore doc IDs; new ones use slugs. The migration mapping
file becomes `_redirects` entries (`/blog/<old-id> /blog/<slug> 301`). All other
routes (`/`, `/about`, `/gallery`, `/contact`, `/blog`) keep their paths.

## Testing

- Generated `payload-types.ts` shared into this repo keeps the API contract typed.
- Netlify deploy previews on PRs are the main QA surface.
- Post-build check script asserts key pages exist in `dist/` and contain expected
  marker text — catches "API silently returned empty" failures.

## Cutover

1. Run migration; build against migrated content.
2. Verify on the Netlify preview URL; submit a test contact form.
3. Point DNS at Netlify; confirm.
4. Decommission Firebase Hosting and functions. Firestore stays read-only for a
   few weeks as a fallback before deletion.
