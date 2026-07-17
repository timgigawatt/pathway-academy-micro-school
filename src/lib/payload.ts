/**
 * Build-time data layer for the Gigawatt CMS (Payload 3 REST API).
 *
 * All reads are anonymous: content collections are public-read for published
 * documents, and every query is scoped to the Pathway Academy tenant. A build
 * fails hard on an unreachable CMS or missing content — Netlify then keeps the
 * last good deploy live.
 *
 * MOCK_CONTENT=1 builds from local fixtures instead (pre-tenant development).
 */

import { fixtures } from './fixtures'

export const TENANT = 'pathway-academy'

export interface Media {
  id: string | number
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export interface Block {
  blockType: string
  [key: string]: unknown
}

export interface Page {
  id: string | number
  title: string
  slug: string
  layout?: Block[] | null
}

export interface Post {
  id: string | number
  title: string
  slug: string
  publishedAt?: string | null
  excerpt?: string | null
  coverImage?: Media | null
  contentHtml?: string | null
}

export interface NavItem {
  label: string
  href: string
  children?: NavItem[] | null
}

export interface Footer {
  columns?: { heading?: string | null; links?: { label: string; href: string }[] | null }[] | null
  social?: { platform: string; href: string }[] | null
  contact?: { phone?: string | null; email?: string | null; address?: string | null } | null
  copyright?: string | null
}

export interface SeoSettings {
  titleTemplate?: string | null
  defaultTitle?: string | null
  defaultDescription?: string | null
}

const useMock = process.env.MOCK_CONTENT === '1'

function apiBase(): string {
  const url = process.env.PAYLOAD_URL
  if (!url) throw new Error('PAYLOAD_URL is not set (or use MOCK_CONTENT=1 for fixture builds)')
  return `${String(url).replace(/\/$/, '')}/api`
}

async function fetchDocs<T>(collection: string, params: Record<string, string> = {}): Promise<T[]> {
  const qs = new URLSearchParams({
    'where[tenant.slug][equals]': TENANT,
    depth: '2',
    limit: '100',
    ...params,
  })
  const url = `${apiBase()}/${collection}?${qs}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`CMS request failed: GET ${url} -> ${res.status} ${await res.text().catch(() => '')}`)
  }
  const json = (await res.json()) as { docs?: T[] }
  return json.docs ?? []
}

export async function getPages(): Promise<Page[]> {
  if (useMock) return fixtures.pages
  const pages = await fetchDocs<Page>('pages')
  if (pages.length === 0) {
    throw new Error(`CMS returned no published pages for tenant "${TENANT}" — refusing to build an empty site.`)
  }
  return pages
}

export async function getPosts(): Promise<Post[]> {
  if (useMock) return fixtures.posts
  return fetchDocs<Post>('posts', { sort: '-publishedAt' })
}

async function getSingleton<T>(collection: string): Promise<T | null> {
  const docs = await fetchDocs<T>(collection, { limit: '1' })
  return docs[0] ?? null
}

export async function getNavigation(): Promise<NavItem[]> {
  if (useMock) return fixtures.navigation
  const doc = await getSingleton<{ items?: NavItem[] }>('navigation')
  return doc?.items ?? []
}

export async function getFooter(): Promise<Footer | null> {
  if (useMock) return fixtures.footer
  return getSingleton<Footer>('footer')
}

export async function getSeoSettings(): Promise<SeoSettings | null> {
  if (useMock) return fixtures.seo
  return getSingleton<SeoSettings>('seo-settings')
}

/** Absolute URL for a media document (local-storage URLs are CMS-relative). */
export function mediaUrl(media: Media | null | undefined): string | null {
  if (!media?.url) return null
  if (/^https?:\/\//.test(media.url)) return media.url
  if (useMock) return media.url
  return `${String(process.env.PAYLOAD_URL).replace(/\/$/, '')}${media.url}`
}

export function pageTitle(title: string | undefined, seo: SeoSettings | null): string {
  if (!title) return seo?.defaultTitle ?? 'Pathway Academy'
  const template = seo?.titleTemplate
  return template?.includes('%s') ? template.replace('%s', title) : title
}
