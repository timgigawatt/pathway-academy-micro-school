# Pathway Academy — Micro School Site

Static [Astro](https://astro.build) site for Pathway Academy, deployed on
Netlify. All content is managed in the Gigawatt CMS (multi-tenant Payload 3)
under the `pathway-academy` tenant; publishing in the CMS triggers a Netlify
rebuild via the tenant's build hook.

Design and plan: [docs/plans/](docs/plans/).

## Development

```sh
npm install
MOCK_CONTENT=1 npm run dev      # local fixture content, no CMS needed
PAYLOAD_URL=https://… npm run dev  # real CMS content
```

`npm run build` fails hard if the CMS is unreachable or has no published
pages, and runs `scripts/check-dist.mjs` to assert key pages were generated —
on Netlify a failed build keeps the last good deploy live.

## Content model

Pages are built from CMS layout blocks; `src/components/BlockRenderer.astro`
maps `blockType` → component (unknown types are skipped with a warning). Blog
posts render the CMS's pre-generated `contentHtml`. Navigation, footer
(including contact details), and SEO defaults come from the tenant's singleton
collections. The contact form posts to Netlify Forms (no backend).

## Scripts

| Script | Purpose |
|---|---|
| `npm run seed` | Upsert pages/navigation/footer/SEO into the CMS from `src/content/pathway-content.mjs`. Idempotent. |
| `npm run migrate` | One-time Firebase → CMS migration: gallery images and blog posts. Idempotent. |

Both need `CMS_URL`, `CMS_EMAIL`, `CMS_PASSWORD` (a `client-editor` account on
the tenant — see `.env.example`). Run `seed` before `migrate` (the migration
fills the gallery block on the seeded Gallery page).

## Deployment (one-time setup)

1. Merge the CMS `pathway-academy` branch (gallery block, footer contact
   group) and run its DB migrations.
2. In the CMS admin: create the `pathway-academy` tenant and a client-editor
   user; run the two scripts above.
3. Netlify: new site from this repo (`npm run build`, publish `dist/`), set
   `PAYLOAD_URL`, enable form notifications for the `contact` form.
4. Create a Netlify build hook and paste its URL into the tenant record.
5. Point DNS at Netlify; decommission the old Firebase site afterwards.
