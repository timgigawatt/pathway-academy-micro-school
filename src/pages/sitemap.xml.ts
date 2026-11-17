import type { APIRoute } from 'astro'
import { getPages, getPosts } from '../lib/payload'

// Every public page, for search engines (robots.txt points here). /thank-you/ is the form's
// confirmation, not a page to find. Same lists the pages are built from, so nothing drifts.
export const GET: APIRoute = async ({ site }) => {
  const [pages, posts] = await Promise.all([getPages(), getPosts()])
  const paths = [
    '/',
    ...pages.filter((p) => p.slug !== 'home').map((p) => `/${p.slug}/`),
    '/blog/',
    ...posts.map((p) => `/blog/${p.slug}/`),
  ]
  const lastmod = new Map(posts.map((p) => [`/blog/${p.slug}/`, p.publishedAt?.slice(0, 10)]))
  const urls = [...new Set(paths)]
    .map((path) => {
      const mod = lastmod.get(path)
      return `  <url><loc>${new URL(path, site).href}</loc>${mod ? `<lastmod>${mod}</lastmod>` : ''}</url>`
    })
    .join('\n')
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
