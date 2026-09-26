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
        dedupe: ['three', 'postprocessing'],
        alias: {
            '@': resolve(__dirname, './src'),
            '@dimitrisgkegkas/postprocessing': resolve(__dirname, 'packages/postprocessing/src/index.ts'),
            '@dimitrisgkegkas/fiber-material': resolve(__dirname, 'packages/fiber-material/src/index.ts'),
        },
    },
    plugins: [react(), glsl()],
})
