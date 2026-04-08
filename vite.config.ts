import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages project site: https://<user>.github.io/<repo>/
const repo = 'wearable-investor-demo'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.GH_PAGES === '1' ? `/${repo}/` : '/',
})
