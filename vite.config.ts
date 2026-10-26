/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * Link previews need absolute image URLs. __SITE_URL__ in index.html becomes VITE_SITE_URL, or on Vercel
 * the production domain (VERCEL_PROJECT_PRODUCTION_URL, a system env var). Locally it's empty: a relative path.
 */
function siteUrl(): Plugin {
  const url =
    process.env.VITE_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '')
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', url.replace(/\/$/, '')),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), siteUrl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // jsdom provides localStorage for zustand's persist middleware
    environment: 'jsdom',
  },
})
