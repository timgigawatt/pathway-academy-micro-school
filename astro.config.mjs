// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  output: 'static',
  vite: { plugins: [tailwindcss()] },
  image: {
    // CMS media lives on GCS in production, or is served through the CMS itself.
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '**.hosted.app' },
    ],
  },
})
