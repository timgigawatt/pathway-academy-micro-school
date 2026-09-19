import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts: front-matter + HTML/markdown body. New posts arrive through the Gigawatt
// site-update pipeline (_config/standards/email-to-post.md). Pages and globals are plain
// JSON read by src/lib/payload.ts, not collections.
const media = z.object({
  url: z.string(),
  alt: z.string().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  sizes: z.record(z.object({ url: z.string().optional().nullable(), width: z.number().optional().nullable(), height: z.number().optional().nullable() }).passthrough()).optional().nullable(),
}).passthrough();

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().max(200),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
    coverImage: media.optional().nullable(),
    excerpt: z.string().max(400).optional().nullable(),
    tags: z.array(z.string()).default([]),
    author: z.string().optional(),
    cmsId: z.string().optional(),
  }),
});

export const collections = { posts };
