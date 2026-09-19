# Recipes

Authored. Maps what the client says to exactly what to do. Read by `site-update`
02_interpret together with `structure.md`. Grows only when a request was solved —
never up front. A question asked twice is a bug.

## Vocabulary

From the site itself, 2026-09-18 (no client intake yet):

- "the blog" / "a post" / "an update" = `src/content/posts/<slug>.md` (front-matter + HTML body). `draft: true` and future `pubDate` are hidden in production only
- "gallery" / "photos" = the `gallery` block in `pages/gallery.json` — `images[]` of media objects under `public/media/`
- "about" / "our story" = `pages/about.json` (richText blocks)
- "contact" = `pages/contact.json`; the form itself is Netlify Forms, not content
- "the numbers" = the `statsBand` block on home; "what we offer" = `servicesPreview` on home
- "menu" / "nav" = `globals/navigation.json`; "footer" = `globals/footer.json`

## Recipes

<!-- Appended by site-update 04_edit after a questions.md round-trip. -->

## Page-level notes

- Logo and the two home photos (`/images/hero.png`, `mission.jpg`, `sally.jpeg`) are hard-coded in components — changing those is a build change, not content.
- Media objects carry `sizes.thumb/card/full`; `full` points at the optimized original (≤2400px). Not yet through Astro's image pipeline.
