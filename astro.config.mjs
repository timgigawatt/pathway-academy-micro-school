// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// Content is files in src/content/ (see src/lib/payload.ts); media in public/media/.
export default defineConfig({
  site: 'https://pathway-academy.netlify.app',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
})
