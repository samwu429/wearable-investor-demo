import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// GitHub Pages project site: https://<user>.github.io/<repo>/
const repo = 'wearable-investor-demo'

/** GitHub Pages serves 404.html for unknown paths — copy SPA entry so /watch etc. work. */
function ghPagesSpa404(): Plugin {
  return {
    name: 'gh-pages-spa-404',
    apply: 'build',
    closeBundle() {
      const outDir = resolve(process.cwd(), 'dist')
      const indexHtml = resolve(outDir, 'index.html')
      const notFoundHtml = resolve(outDir, '404.html')
      if (existsSync(indexHtml)) {
        copyFileSync(indexHtml, notFoundHtml)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ghPagesSpa404()],
  base: process.env.GH_PAGES === '1' ? `/${repo}/` : '/',
})
