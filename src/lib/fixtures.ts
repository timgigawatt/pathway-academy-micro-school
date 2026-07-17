/**
 * Fixture content for MOCK_CONTENT=1 builds — the shared content definition
 * with repo-local image paths swapped in for CMS media documents.
 */

import * as content from '../content/pathway-content.mjs'
import type { Block, Footer, Media, NavItem, Page, Post, SeoSettings } from './payload'

const imageMap = content.images as Record<string, { file: string; alt: string }>

function localMedia(key: string): Media {
  const img = imageMap[key]
  if (!img) throw new Error(`fixtures: unknown image key "${key}"`)
  return { id: key, url: img.file.replace(/^public/, ''), alt: img.alt }
}

function resolveBlock(block: Record<string, unknown>): Block {
  const resolved: Record<string, unknown> = { ...block }
  if (typeof resolved.image === 'string') resolved.image = localMedia(resolved.image)
  if (resolved.blockType === 'gallery') {
    // The real gallery is populated by the Firebase migration; mock a few.
    resolved.images = ['hero', 'mission', 'sally'].map((key) => ({
      image: localMedia(key),
      caption: imageMap[key]?.alt,
    }))
  }
  return resolved as Block
}

const pages: Page[] = content.pages.map((page, i) => ({
  id: i,
  title: page.title,
  slug: page.slug,
  layout: page.layout.map(resolveBlock),
}))

const posts: Post[] = [
  {
    id: 'mock-post',
    title: 'Welcome to the Pathway Academy Blog',
    slug: 'welcome-to-the-pathway-academy-blog',
    publishedAt: '2026-07-01T12:00:00.000Z',
    excerpt: 'A mock post used for local fixture builds.',
    coverImage: localMedia('mission'),
    contentHtml:
      '<p>This is fixture content rendered when MOCK_CONTENT=1. Real posts come from the CMS.</p><h2>A heading</h2><p>Some more body copy to exercise the post layout.</p>',
  },
]

export const fixtures = {
  pages,
  posts,
  navigation: content.navigation.items as NavItem[],
  footer: content.footer as Footer,
  seo: content.seo as SeoSettings,
}
