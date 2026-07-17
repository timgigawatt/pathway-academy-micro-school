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

export const pages = [
  {
    title: 'Home',
    slug: 'home',
    layout: [
      {
        blockType: 'hero',
        eyebrow: 'MICRO SCHOOL · KDG–4TH GRADE',
        headline: 'Small School, Big Impact',
        body: 'Transforming Lives Through Christ-Centered Education in a Safe and Nurturing Environment',
        buttons: [
          { label: 'Reach Out', href: '/contact', style: 'accent' },
          { label: 'Read Our Blog', href: '/blog' },
        ],
      },
      {
        blockType: 'richText',
        heading: 'Our Mission',
        body: "To teach students from a Christian worldview in a safe and stress-free learning environment, focusing on each student's learning style and needs, as they develop a love for learning and by God's Grace a love for their creator.",
        image: 'mission',
        imagePosition: 'left',
      },
      {
        blockType: 'statsBand',
        stats: [
          { num: '20+', label: 'Years of teaching experience' },
          { num: 'KDG–4th', label: 'Grades served' },
          { num: '4 days', label: 'A week school program' },
        ],
      },
      {
        blockType: 'richText',
        heading: 'Meet Sally',
        body: 'I am a retired Kindergarten teacher with over 20 years of experience in Classical Christian Education. My passion is creating a nurturing environment where each child can discover their God-given potential.\n\nI offer a 4-day-a-week school program for KDG–4th grade, focusing on individualized attention and Christ-centered learning that helps students build strong academic foundations while developing their character.',
        image: 'sally',
        imagePosition: 'right',
      },
      {
        blockType: 'servicesPreview',
        heading: 'What Makes Pathway Different',
        items: [
          {
            title: 'Classical Christian Education',
            description: 'Time-tested methods that build strong academic foundations from a Christian worldview.',
          },
          {
            title: 'Individualized Attention',
            description: "A micro school by design — each student's learning style and needs shape how they're taught.",
          },
          {
            title: 'Nurturing Environment',
            description: 'A safe, stress-free place where children develop a love for learning.',
          },
        ],
      },
      {
        blockType: 'ctaBand',
        headingLines: [{ text: 'Come Walk the' }, { text: 'Pathway With Us' }],
        text: 'Schedule a visit or ask us anything — we would love to meet your family.',
        ctaLabel: 'Get in Touch',
        ctaHref: '/contact',
      },
    ],
  },
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
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
}

export const footer = {
  columns: [
    {
      heading: 'Quick Links',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Gallery', href: '/gallery' },
        { label: 'Blog', href: '/blog' },
        { label: 'Contact', href: '/contact' },
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
