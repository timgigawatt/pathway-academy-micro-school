/**
 * Shared REST client for the Gigawatt CMS, following the conventions in the
 * CMS repo's docs/tenant-seeding.md: env credentials, JWT auth, idempotent
 * upserts, and never sending a `tenant` field (the server assigns ours).
 */
import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

export function mimeTypeFor(filename) {
  return MIME_BY_EXT[extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

const CMS_URL = process.env.CMS_URL?.replace(/\/$/, '')
const BASE = `${CMS_URL}/api`

let token = null

export async function login() {
  const { CMS_EMAIL, CMS_PASSWORD } = process.env
  if (!CMS_URL || !CMS_EMAIL || !CMS_PASSWORD) {
    console.error('Set CMS_URL, CMS_EMAIL and CMS_PASSWORD (see .env.example).')
    process.exit(1)
  }
  const res = await fetch(`${BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.token) {
    console.error(`CMS login failed (${res.status}): ${JSON.stringify(json.errors ?? json)}`)
    process.exit(1)
  }
  token = json.token
}

export async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json.errors ?? json)}`)
  }
  return json
}

/** Upload a media file unless one with the same filename already exists. */
export async function upsertMedia(buffer, filename, alt) {
  const found = await api(
    'GET',
    `/media?where[filename][equals]=${encodeURIComponent(filename)}&limit=1&depth=0`,
  )
  if (found.docs?.[0]) {
    console.log(`  media exists: ${filename}`)
    return found.docs[0].id
  }
  const form = new FormData()
  // The Blob type matters: Payload only extracts image dimensions when the
  // uploaded part carries an image/* content type.
  form.append('file', new Blob([buffer], { type: mimeTypeFor(filename) }), filename)
  form.append('_payload', JSON.stringify({ alt }))
  const res = await fetch(`${BASE}/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`POST /media (${filename}) -> ${res.status} ${JSON.stringify(json.errors ?? json)}`)
  console.log(`  media created: ${filename}`)
  return json.doc.id
}

export async function upsertMediaFromFile(filePath, alt) {
  return upsertMedia(await readFile(filePath), basename(filePath), alt)
}

export async function upsertPage(slug, data) {
  const found = await api('GET', `/pages?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`)
  const existing = found.docs?.[0]
  const payload = { ...data, slug, type: 'generic', _status: 'published' }
  if (existing) {
    await api('PATCH', `/pages/${existing.id}`, payload)
    console.log(`  page updated: ${slug}`)
    return existing.id
  }
  const created = await api('POST', '/pages', payload)
  console.log(`  page created: ${slug}`)
  return created.doc.id
}

/** Upsert a one-per-tenant collection (navigation, footer, seo-settings). */
export async function upsertGlobal(collection, data) {
  const found = await api('GET', `/${collection}?limit=1&depth=0`)
  const existing = found.docs?.[0]
  if (existing) {
    await api('PATCH', `/${collection}/${existing.id}`, data)
    console.log(`  ${collection} updated`)
    return existing.id
  }
  const created = await api('POST', `/${collection}`, data)
  console.log(`  ${collection} created`)
  return created.doc.id
}
