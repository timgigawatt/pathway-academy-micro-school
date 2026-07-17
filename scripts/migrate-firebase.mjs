/**
 * One-time migration: Firebase (Firestore + Storage) → Gigawatt CMS.
 *
 * - `gallery` collection → CMS media docs + the Gallery page's gallery block
 * - `blogPosts` collection → CMS posts (plain-text content → Lexical paragraphs)
 * - writes public/_redirects entries for posts whose old URL used a doc ID
 *
 * Reads Firestore through its public REST API — the old site reads these
 * collections anonymously from the browser, so no service account is needed.
 * Idempotent: media dedupes by filename, posts/pages upsert by slug.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { api, login, upsertMedia } from './cms-client.mjs'

const FIREBASE_PROJECT = 'pathway-academy'
const FIREBASE_API_KEY = 'AIzaSyAGe4tEALPi6kdBnAJo4uf-8omOQ4Nda-0' // public web config
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

// --- Firestore helpers -------------------------------------------------------

function decodeValue(value) {
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('booleanValue' in value) return value.booleanValue
  if ('timestampValue' in value) return value.timestampValue
  if ('nullValue' in value) return null
  if ('mapValue' in value) return decodeFields(value.mapValue.fields ?? {})
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decodeValue)
  return null
}

function decodeFields(fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)]))
}

async function fetchCollection(name) {
  const docs = []
  let pageToken = ''
  do {
    const url = `${FIRESTORE}/${name}?pageSize=300&key=${FIREBASE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Firestore read failed: ${name} -> ${res.status} ${await res.text()}`)
    const json = await res.json()
    for (const doc of json.documents ?? []) {
      docs.push({ id: doc.name.split('/').pop(), ...decodeFields(doc.fields ?? {}) })
    }
    pageToken = json.nextPageToken ?? ''
  } while (pageToken)
  return docs
}

// --- Conversion helpers ------------------------------------------------------

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const stripHtml = (text) => text.replace(/<[^>]+>/g, '')

/** Plain text (blank-line paragraphs) → Lexical editor state. */
function textToLexical(text) {
  const paragraphs = stripHtml(text)
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [{ type: 'text', text: p, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      })),
    },
  }
}

async function downloadToMedia(url, filename, alt) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed: ${url} -> ${res.status}`)
  return upsertMedia(Buffer.from(await res.arrayBuffer()), filename, alt)
}

// --- Migration ---------------------------------------------------------------

await login()

console.log('Fetching Firestore collections…')
const [galleryDocs, postDocs] = await Promise.all([fetchCollection('gallery'), fetchCollection('blogPosts')])
console.log(`  gallery: ${galleryDocs.length} images, blogPosts: ${postDocs.length} posts`)

// Gallery → media + gallery block on the Gallery page
console.log('Migrating gallery…')
const galleryImages = []
for (const img of galleryDocs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
  if (!img.downloadURL) continue
  const filename = img.originalName || `gallery-${img.id}.jpg`
  const alt = img.title || img.description || 'Pathway Academy gallery photo'
  const mediaId = await downloadToMedia(img.downloadURL, filename, alt)
  galleryImages.push({ image: mediaId, caption: img.title || null })
}

const galleryPage = (await api('GET', '/pages?where[slug][equals]=gallery&limit=1&depth=0')).docs?.[0]
if (!galleryPage) {
  console.error('Gallery page not found — run scripts/seed-content.mjs first.')
  process.exit(1)
}
const layout = galleryPage.layout.map((block) =>
  block.blockType === 'gallery' ? { ...block, images: galleryImages } : block,
)
await api('PATCH', `/pages/${galleryPage.id}`, { layout, _status: 'published' })
console.log(`  gallery page updated with ${galleryImages.length} images`)

// Blog posts
console.log('Migrating blog posts…')
const redirects = []
for (const post of postDocs) {
  if (post.published === false) {
    console.log(`  skipping unpublished: ${post.title}`)
    continue
  }
  const slug = post.slug || slugify(post.title)
  if (!post.slug) redirects.push(`/blog/${post.id} /blog/${slug} 301`)

  let coverImage = null
  if (post.featuredImage?.downloadURL) {
    const filename = post.featuredImage.originalName || `post-${slug}-cover.jpg`
    coverImage = await downloadToMedia(post.featuredImage.downloadURL, filename, post.title)
  }

  const data = {
    title: post.title,
    slug,
    publishedAt: post.createdAt ?? null,
    excerpt: post.excerpt ? stripHtml(post.excerpt) : null,
    coverImage,
    content: textToLexical(post.content ?? ''),
    _status: 'published',
  }

  const existing = (await api('GET', `/posts?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0&draft=true`))
    .docs?.[0]
  if (existing) {
    await api('PATCH', `/posts/${existing.id}`, data)
    console.log(`  post updated: ${slug}`)
  } else {
    await api('POST', '/posts', data)
    console.log(`  post created: ${slug}`)
  }
}

// Redirects for old ID-based URLs
if (redirects.length) {
  const file = join(repoRoot, 'public/_redirects')
  await writeFile(file, `# Old Firebase blog URLs (doc-ID based) -> new slugs\n${redirects.join('\n')}\n`)
  console.log(`Wrote ${redirects.length} redirect(s) to public/_redirects — commit this file.`)
} else {
  console.log('No redirects needed (all posts already had slugs).')
}

console.log('Done.')
