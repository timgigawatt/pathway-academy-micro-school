/**
 * Seed the Pathway Academy tenant's pages, navigation, footer, and SEO
 * settings into the Gigawatt CMS. Idempotent — safe to re-run.
 *
 * Prereqs: tenant + client-editor account provisioned by the Gigawatt admin;
 * CMS_URL / CMS_EMAIL / CMS_PASSWORD in the environment.
 *
 * Note: this does NOT touch the gallery block's images or blog posts — those
 * come from scripts/migrate-firebase.mjs.
 */
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import * as content from '../src/content/pathway-content.mjs'
import { api, login, upsertGlobal, upsertMediaFromFile, upsertPage } from './cms-client.mjs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

await login()

console.log('Uploading images…')
const mediaIds = {}
for (const [key, img] of Object.entries(content.images)) {
  mediaIds[key] = await upsertMediaFromFile(join(repoRoot, img.file), img.alt)
}

console.log('Upserting pages…')
for (const page of content.pages) {
  // Swap content-key image references for uploaded media document IDs.
  const layout = page.layout.map((block) => {
    const resolved = { ...block }
    if (typeof resolved.image === 'string') resolved.image = mediaIds[resolved.image]
    return resolved
  })

  if (page.slug === 'gallery') {
    // Don't clobber gallery images placed by the Firebase migration.
    const found = await api('GET', `/pages?where[slug][equals]=gallery&limit=1&depth=0`)
    const existingGallery = found.docs?.[0]?.layout?.find((b) => b.blockType === 'gallery')
    if (existingGallery?.images?.length) {
      const galleryBlock = layout.find((b) => b.blockType === 'gallery')
      galleryBlock.images = existingGallery.images
    }
  }

  await upsertPage(page.slug, { title: page.title, layout })
}

console.log('Upserting navigation, footer, SEO settings…')
await upsertGlobal('navigation', content.navigation)
await upsertGlobal('footer', content.footer)
await upsertGlobal('seo-settings', content.seo)

console.log('Done. Publishing fires the tenant build hook (if configured).')
