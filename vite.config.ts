import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (command === 'build') {
    const url = new URL(env.VITE_MEDIA_BASE_URL || 'invalid:')
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      throw new Error('Build requires VITE_MEDIA_BASE_URL with a public HTTPS media URL (see .env.example).')
    }
  }
  return {
    base: env.VITE_BASE_PATH || '/',
    // Development serves local originals. Production copies only light public files.
    publicDir: command === 'serve' ? 'public' : false,
    plugins: [react(), {
      name: 'light-public-assets',
      apply: 'build',
      generateBundle() {
        const copy = (directory: string, prefix = '') => {
          for (const entry of readdirSync(directory, { withFileTypes: true })) {
            if (!prefix && entry.name === 'media') continue
            const name = `${prefix}${entry.name}`
            const path = join(directory, entry.name)
            if (entry.isDirectory()) copy(path, `${name}/`)
            else if (entry.isFile()) this.emitFile({ type: 'asset', fileName: name, source: readFileSync(path) })
          }
        }
        copy('public')
      },
    }],
  }
})
