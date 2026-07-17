export const images: Record<string, { file: string; alt: string }>
export const pages: {
  title: string
  slug: string
  layout: Record<string, unknown>[]
}[]
export const navigation: { items: { label: string; href: string }[] }
export const footer: Record<string, unknown>
export const seo: { titleTemplate: string; defaultTitle: string; defaultDescription: string }
