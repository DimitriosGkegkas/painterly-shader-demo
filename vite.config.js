import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import glsl from 'vite-plugin-glsl'

const server =
    process.env.APP_ENV === 'sandbox' ? { hmr: { clientPort: 443 } } : {}

export default defineConfig({
    server: server,
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    plugins: [react(), glsl()],
})
