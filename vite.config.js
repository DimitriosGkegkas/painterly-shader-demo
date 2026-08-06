import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import glsl from 'vite-plugin-glsl'

const server =
    process.env.APP_ENV === 'sandbox' ? { hmr: { clientPort: 443 } } : {}
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base =
    process.env.VITE_BASE_URL ??
    (process.env.GITHUB_ACTIONS === 'true' && repositoryName && !repositoryName.endsWith('.github.io')
        ? `/${repositoryName}/`
        : '/')

export default defineConfig({
    base,
    server: server,
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    plugins: [react(), glsl()],
})
