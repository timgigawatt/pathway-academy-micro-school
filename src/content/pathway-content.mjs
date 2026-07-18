/**
 * Pathway Academy site content — the single source of truth used by
 * scripts/seed-content.mjs (to upsert into the CMS) and src/lib/fixtures.ts
 * (MOCK_CONTENT builds). Copy extracted from the original CRA site.
 *
 * Image values are repo paths under public/; the seed script uploads them to
 * the CMS media collection and swaps in document IDs.
 */

export const images = {
  hero: { file: 'public/images/hero.png', alt: 'Pathway Academy logo' },
  mission: { file: 'public/images/mission.jpg', alt: 'Students learning at Pathway Academy' },
  sally: { file: 'public/images/sally.jpeg', alt: "Sally's portrait" },
}

// Note: the homepage is code-owned (src/pages/index.astro implements the
// Home.dc.html design) and is intentionally absent here — a CMS "home" page,
// if one still exists from an earlier seed, is ignored by routing.
export const pages = [
  {
    title: 'About',
    slug: 'about',
    layout: [
      {
        blockType: 'richText',
        heading: 'Meet Sally',
        body: 'I am a retired Kindergarten teacher with over 20 years of experience in Classical Christian Education. My passion is creating a nurturing environment where each child can discover their God-given potential.\n\nI offer a 4-day-a-week school program for KDG–4th grade, focusing on individualized attention and Christ-centered learning that helps students build strong academic foundations while developing their character.',
        image: 'sally',
        imagePosition: 'left',
      },
      {
        blockType: 'richText',
        heading: 'Our Mission',
        body: "To teach students from a Christian worldview in a safe and stress-free learning environment, focusing on each student's learning style and needs, as they develop a love for learning and by God's Grace a love for their creator.",
        image: 'mission',
        imagePosition: 'right',
      },
    ],
  },
  {
    title: 'Gallery',
    slug: 'gallery',
    layout: [
      // The gallery block is populated by scripts/migrate-firebase.mjs.
      { blockType: 'gallery', heading: 'Life at Pathway', layout: 'grid', images: [] },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    layout: [
      {
        blockType: 'richText',
        heading: 'Get in Touch',
        body: "We would love to hear from you. Send us a message and we'll get back to you as soon as we can.",
      },
    ],
  },
]

export const navigation = {
  items: [
    { label: 'Our Mission', href: '/#mission' },
    { label: 'Meet Sally', href: '/#about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Blog', href: '/blog' },
  ],
}

export const footer = {
  columns: [
    {
      heading: 'Quick Links',
      links: [
        { label: 'Our Mission', href: '/#mission' },
        { label: 'Meet Sally', href: '/#about' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Blog', href: '/blog' },
      ],
    },
  ],
  social: [{ platform: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61562003723548' }],
  contact: {
    phone: '913-645-0650',
    email: 'sdodd.kc@gmail.com',
    address: 'Pathway Academy\n13825 Hemlock St\nOverland Park, KS 66223',
  },
  copyright: '© Pathway Academy. All Rights Reserved.',
}

export const seo = {
  titleTemplate: '%s · Pathway Academy',
  defaultTitle: 'Pathway Academy — Christ-Centered Micro School in Overland Park',
  defaultDescription:
    'A Christ-centered micro school in Overland Park, KS for kindergarten through 4th grade. Small classes, individualized attention, and a safe, nurturing environment.',
}
