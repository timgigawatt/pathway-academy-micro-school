/**
 * Backfill width/height/mimeType on CMS media documents that were uploaded
 * as application/octet-stream (pre-fix cms-client.mjs), which made Payload
 * skip image processing and left dimensions null — breaking astro:assets
 * builds that then had to probe every file remotely.
 *
 * Idempotent: only touches this tenant's image docs with a missing width.
 */
import sharp from 'sharp'

import { api, login, mimeTypeFor } from './cms-client.mjs'

const TENANT = 'pathway-academy'
const CMS_URL = process.env.CMS_URL?.replace(/\/$/, '')

await login()

const qs = new URLSearchParams({
  'where[tenant.slug][equals]': TENANT,
  'where[width][exists]': 'false',
  limit: '200',
  depth: '0',
})
const { docs } = await api('GET', `/media?${qs}`)
console.log(`${docs.length} media document(s) missing dimensions`)

let failed = 0
for (const doc of docs) {
  const mimeType = mimeTypeFor(doc.filename)
  if (!mimeType.startsWith('image/')) {
    console.warn(`  skipping ${doc.filename}: not a known image extension`)
    continue
  }
  try {
    const res = await fetch(`${CMS_URL}${doc.url}`)
    if (!res.ok) throw new Error(`GET ${doc.url} -> ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    // autoOrient so EXIF-rotated phone photos report display dimensions,
    // matching what Payload itself would have stored.
    const { width, height } = await sharp(buffer).autoOrient().metadata()
    if (!width || !height) throw new Error('sharp returned no dimensions')
    await api('PATCH', `/media/${doc.id}`, { width, height, mimeType })
    console.log(`  ✓ ${doc.filename}: ${width}x${height} ${mimeType}`)
  } catch (err) {
    failed++
    console.error(`  ✗ ${doc.filename}: ${err.message}`)
  }
}

if (failed) {
  console.error(`${failed} document(s) could not be repaired`)
  process.exit(1)
}
console.log('Done.')
